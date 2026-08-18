import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppleSubscriptionActions } from "@/components/AppleSubscriptionActions";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import {
  deleteAccountMobile,
  fetchOnboardingMobile,
  updateOnboardingMobile,
} from "@/lib/api";
import { useAppearancePreference, type AppearancePreference } from "@/lib/AppearanceContext";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

const ROLES = [
  { id: "rep", label: "Rep or liaison" },
  { id: "director", label: "Director" },
  { id: "vp", label: "VP or executive" },
  { id: "owner", label: "Owner" },
  { id: "other", label: "Other" },
];

const APPEARANCES: Array<{ id: AppearancePreference; label: string; icon: React.ComponentProps<typeof Feather>["name"] }> = [
  { id: "system", label: "System", icon: "smartphone" },
  { id: "light", label: "Light", icon: "sun" },
  { id: "dark", label: "Dark", icon: "moon" },
];

export default function AccountScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { preference, setPreference } = useAppearancePreference();
  const { user, isLoading, isAuthenticated, canUseFieldKit, canUseElite, canManageOrganization, logout, refresh } = useAuth();
  const [jobRole, setJobRole] = useState("");
  const [territoryNote, setTerritoryNote] = useState("");
  const [topObjections, setTopObjections] = useState("");
  const [saving, setSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  const loadProfile = useCallback(async () => {
    if (!canUseFieldKit) return;
    try {
      const data = await fetchOnboardingMobile();
      setJobRole(data.member.jobRole || "");
      setTerritoryNote(data.member.territoryNote || "");
      setTopObjections(data.member.topObjections || "");
    } catch {
      // Optional profile context can fail offline without blocking Account.
    }
  }, [canUseFieldKit]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      void loadProfile();
    }, [loadProfile, refresh]),
  );

  if (isLoading) {
    return <View style={[styles.center, { paddingTop: topPad }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!isAuthenticated || !user) {
    return (
      <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ paddingTop: topPad + 20, paddingHorizontal: 20, paddingBottom: bottomPad + 24 }}>
        <Text style={styles.kicker}>ACCOUNT</Text>
        <Text style={styles.pageTitle}>Explore first. Connect an account when it has something worth protecting.</Text>
        <Text style={styles.pageSubtitle}>You can tour the system and purchase through Apple before creating a Spartan account. Signing in connects membership, saved work, commitments, and preferences across your devices.</Text>

        <Pressable onPress={() => router.push("/access" as any)} style={styles.heroAction} accessibilityRole="button">
          <View style={styles.heroIcon}><Feather name="grid" size={22} color="#FFFFFF" /></View>
          <View style={{ flex: 1 }}><Text style={styles.heroActionTitle}>See everything in Spartan Coaching</Text><Text style={styles.heroActionBody}>Understand every destination and access level before you commit.</Text></View>
          <Feather name="chevron-right" size={20} color="#FFFFFF" />
        </Pressable>

        <SpartanButton title="Compare memberships and subscribe" onPress={() => router.push("/membership" as any)} style={{ marginTop: 18 }} />
        <SpartanButton title="Sign in" variant="outline" onPress={() => router.push("/login" as any)} style={{ marginTop: 10 }} />
        <Pressable onPress={() => router.push("/(tabs)/contact" as any)} style={styles.simpleLink}><Text style={styles.simpleLinkText}>Company access or human consulting</Text><Feather name="chevron-right" size={17} color={colors.primary} /></Pressable>
      </ScrollView>
    );
  }

  const org = user.organization;
  const isCompany = org?.type === "company";
  const isAdmin = canManageOrganization;
  const isPersonal = org?.type === "personal";
  const tier = isCompany
    ? canUseElite ? "Company Elite" : canUseFieldKit ? "Company Standard" : "Company access pending"
    : canUseElite ? "Elite" : canUseFieldKit ? "Standard" : "No active membership";

  const saveProfile = async () => {
    setSaving(true);
    setProfileMessage(null);
    try {
      await updateOnboardingMobile({
        jobRole: jobRole || null,
        territoryNote: territoryNote.trim() || null,
        topObjections: topObjections.trim() || null,
      });
      await refresh();
      setProfileMessage("Profile saved");
    } catch (error: any) {
      setProfileMessage(error?.message || "Profile could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = () => {
    if (user.member.role === "platform_admin") {
      Alert.alert("Not available", "Platform administrator accounts cannot be deleted from the app.");
      return;
    }
    Alert.alert(
      "Delete your account?",
      "This permanently closes your Spartan account and signs you out. If you have an Apple subscription, manage that subscription separately through Apple before deleting the account.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete account",
          style: "destructive",
          onPress: async () => {
            setDeletePending(true);
            try {
              await deleteAccountMobile();
              await logout();
              router.replace("/(tabs)" as any);
            } catch (error: any) {
              Alert.alert("Could not delete account", String(error?.message || "Contact support for help.").slice(0, 280));
            } finally {
              setDeletePending(false);
            }
          },
        },
      ],
    );
  };

  const initials = user.member.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ paddingTop: topPad + 16, paddingHorizontal: 20, paddingBottom: bottomPad + 30 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      testID="screen-account"
    >
      <Text style={styles.kicker}>MY SPARTAN</Text>
      <View style={styles.identityRow}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
        <View style={{ flex: 1 }}><Text style={styles.memberName}>{user.member.name}</Text><Text style={styles.memberEmail}>{user.member.email}</Text></View>
      </View>

      <Pressable onPress={() => router.push("/access" as any)} style={styles.membershipCard} accessibilityRole="button" testID="account-membership-card">
        <View style={{ flex: 1 }}>
          <Text style={styles.cardKicker}>YOUR ACCESS</Text>
          <Text style={styles.membershipTitle}>{tier}</Text>
          <Text style={styles.membershipBody}>{isCompany ? "Provided through your organization contract and seat assignment." : canUseElite ? "The complete field system plus private Coach." : canUseFieldKit ? "The complete field system without private Coach." : "Explore the app and choose Standard or Elite when you are ready."}</Text>
        </View>
        <Feather name="chevron-right" size={22} color={colors.heroForeground} />
      </Pressable>

      {isPersonal ? (
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>APPLE MEMBERSHIP</Text>
          <Text style={styles.sectionTitle}>{canUseFieldKit ? "Manage individual access" : "Choose individual access"}</Text>
          <Text style={styles.sectionBody}>Individual iOS membership is purchased and managed through Apple. Spartan Coaching does not send you to browser checkout for an iPhone subscription.</Text>
          {canUseFieldKit ? <AppleSubscriptionActions isAuthenticated showManage onEntitlementChanged={refresh} /> : <SpartanButton title="Compare Standard and Elite" onPress={() => router.push("/membership" as any)} />}
        </View>
      ) : null}

      {isCompany ? (
        <View style={styles.section} testID="company-apple-renewal-guidance">
          <Text style={styles.sectionKicker}>PREVIOUS INDIVIDUAL APPLE ACCESS</Text>
          <Text style={styles.sectionTitle}>Company access does not cancel an Apple subscription.</Text>
          <Text style={styles.sectionBody}>If you previously subscribed to Spartan Coaching through Apple, your company seat is active separately. Manage the individual subscription privately in Apple Subscriptions to prevent another renewal. Your organization cannot see whether you have or cancel an individual Apple subscription.</Text>
          <AppleSubscriptionActions isAuthenticated showManage showRestore={false} />
        </View>
      ) : null}

      {isAdmin ? (
        <Pressable onPress={() => router.push("/admin" as any)} style={styles.adminCard} testID="account-admin-hero">
          <View style={styles.adminIcon}><Feather name="shield" size={20} color="#FFFFFF" /></View>
          <View style={{ flex: 1 }}><Text style={styles.adminTitle}>Organization Admin</Text><Text style={styles.adminBody}>Manage seats, members, invitations, roles, adoption, and explicitly shared information. Private Coach content is never exposed here.</Text></View>
          <Feather name="chevron-right" size={20} color={colors.primary} />
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionKicker}>APPEARANCE</Text>
        <Text style={styles.sectionTitle}>Make the app feel native to your iPhone.</Text>
        <View style={styles.appearanceRow}>
          {APPEARANCES.map((item) => {
            const selected = preference === item.id;
            return (
              <Pressable key={item.id} onPress={() => setPreference(item.id)} style={[styles.appearanceChoice, selected && styles.appearanceSelected]} accessibilityState={{ selected }}>
                <Feather name={item.icon} size={18} color={selected ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.appearanceText, selected && { color: colors.primary }]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {canUseFieldKit ? (
        <View style={styles.section}>
          <Text style={styles.sectionKicker}>FIELD CONTEXT</Text>
          <Text style={styles.sectionTitle}>Give the app useful context without giving it patient data.</Text>
          <Text style={styles.sectionBody}>These preferences help shape planning and coaching. Do not enter patient PHI.</Text>
          <Text style={styles.label}>Primary role</Text>
          <View style={styles.roleWrap}>
            {ROLES.map((role) => {
              const selected = jobRole === role.id;
              return <Pressable key={role.id} onPress={() => setJobRole(role.id)} style={[styles.roleChip, selected && styles.roleChipSelected]}><Text style={[styles.roleText, selected && { color: colors.primary }]}>{role.label}</Text></Pressable>;
            })}
          </View>
          <Text style={styles.label}>Territory context</Text>
          <TextInput style={styles.input} value={territoryNote} onChangeText={setTerritoryNote} placeholder="Territory priorities, account mix, leadership context" placeholderTextColor={colors.mutedForeground} multiline />
          <Text style={styles.label}>Top objections</Text>
          <TextInput style={styles.input} value={topObjections} onChangeText={setTopObjections} placeholder="Common non patient specific objections you want to practice" placeholderTextColor={colors.mutedForeground} multiline />
          {profileMessage ? <Text style={styles.profileMessage}>{profileMessage}</Text> : null}
          <SpartanButton title={saving ? "Saving…" : "Save field context"} onPress={saveProfile} disabled={saving} />
        </View>
      ) : null}

      {canUseElite ? (
        <View style={styles.section} testID="account-clinical-context">
          <Text style={styles.sectionKicker}>CLINICAL CONTEXT</Text>
          <Text style={styles.sectionTitle}>Set the jurisdiction before clinical education tools use it.</Text>
          <Text style={styles.sectionBody}>Save your primary state and Medicare Administrative Contractor region. This is account context only and never patient information.</Text>
          <LinkRow label="State and MAC context" onPress={() => router.push("/jurisdiction" as any)} />
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionKicker}>PRIVACY & CONTROL</Text>
        <Text style={styles.sectionTitle}>Know what stays private.</Text>
        <InfoRow icon="lock" title="Raw Coach conversations" body="Private and hard deleted after 90 days. Organization admins never see prompts, drafts, recordings, transcripts, or unshared outputs." />
        <InfoRow icon="eye" title="Shared information" body="Only summaries and commitments you explicitly share can become visible to an organization administrator." />
        <InfoRow icon="database" title="Coach memory" body="Off by default. When enabled, it is visible, editable, and deletable by you." />
        <InfoRow icon="shield" title="Patient information" body="PHI is prohibited. Clinical or legal risk should be rerouted to the responsible medical, compliance, legal, or leadership channel." />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionKicker}>HELP & LEGAL</Text>
        <LinkRow label="Support" onPress={() => router.push("/support" as any)} />
        <LinkRow label="Privacy policy" onPress={() => router.push({ pathname: "/legal", params: { document: "privacy" } } as any)} />
        <LinkRow label="Terms" onPress={() => router.push({ pathname: "/legal", params: { document: "terms" } } as any)} />
        <LinkRow label="Trust & safety" onPress={() => router.push({ pathname: "/legal", params: { document: "trust" } } as any)} />
        <LinkRow label="Human consulting" onPress={() => router.push("/(tabs)/contact" as any)} />
        <LinkRow label="Take the guided tour again" onPress={() => router.push("/tour" as any)} />
      </View>

      <View style={styles.section}>
        <SpartanButton title="Sign out" variant="outline" onPress={async () => { await logout(); router.replace("/(tabs)" as any); }} />
        <Pressable disabled={deletePending} onPress={confirmDelete} style={styles.deleteButton}><Text style={styles.deleteText}>{deletePending ? "Deleting account…" : "Delete account"}</Text></Pressable>
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, title, body }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <View style={styles.infoRow}><View style={styles.infoIcon}><Feather name={icon} size={17} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.infoTitle}>{title}</Text><Text style={styles.infoBody}>{body}</Text></View></View>;
}

function LinkRow({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return <Pressable onPress={onPress} style={styles.linkRow}><Text style={styles.linkLabel}>{label}</Text><Feather name="chevron-right" size={19} color={colors.mutedForeground} /></Pressable>;
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2, ...font("bold") },
    pageTitle: { color: colors.foreground, fontSize: 32, lineHeight: 37, letterSpacing: -0.9, marginTop: 8, ...font("heavy") },
    pageSubtitle: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, marginTop: 9, ...font("regular") },
    heroAction: { minHeight: 96, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 22, backgroundColor: colors.heroBackground, borderRadius: 20, borderCurve: "continuous", padding: 16 },
    heroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    heroActionTitle: { color: colors.heroForeground, fontSize: 16, ...font("bold") },
    heroActionBody: { color: colors.heroMuted, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    simpleLink: { minHeight: 52, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
    simpleLinkText: { color: colors.primary, fontSize: 13, ...font("bold") },
    identityRow: { flexDirection: "row", alignItems: "center", gap: 13, marginTop: 13, marginBottom: 20 },
    avatar: { width: 56, height: 56, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.primaryForeground, fontSize: 18, ...font("heavy") },
    memberName: { color: colors.foreground, fontSize: 22, ...font("heavy") },
    memberEmail: { color: colors.mutedForeground, fontSize: 12, marginTop: 2, ...font("regular") },
    membershipCard: { minHeight: 142, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.heroBackground, borderRadius: 22, borderCurve: "continuous", padding: 18, marginBottom: 18 },
    cardKicker: { color: colors.heroMuted, fontSize: 9, letterSpacing: 1.8, ...font("bold") },
    membershipTitle: { color: colors.heroForeground, fontSize: 25, lineHeight: 30, marginTop: 5, ...font("heavy") },
    membershipBody: { color: colors.heroMuted, fontSize: 11, lineHeight: 17, marginTop: 5, ...font("regular") },
    adminCard: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primary, borderRadius: 18, borderCurve: "continuous", padding: 15, marginBottom: 18 },
    adminIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    adminTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    adminBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3, ...font("regular") },
    section: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.borderStrong, paddingTop: 22, marginTop: 7, gap: 12 },
    sectionKicker: { color: colors.primary, fontSize: 9, letterSpacing: 1.8, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 22, lineHeight: 27, ...font("heavy") },
    sectionBody: { color: colors.mutedForeground, fontSize: 12, lineHeight: 18, ...font("regular") },
    appearanceRow: { flexDirection: "row", gap: 8 },
    appearanceChoice: { flex: 1, minHeight: 58, alignItems: "center", justifyContent: "center", gap: 5, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.card, borderRadius: 15, borderCurve: "continuous" },
    appearanceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    appearanceText: { color: colors.mutedForeground, fontSize: 11, ...font("semibold") },
    label: { color: colors.foreground, fontSize: 12, ...font("bold") },
    roleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    roleChip: { minHeight: 40, justifyContent: "center", paddingHorizontal: 12, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 20, backgroundColor: colors.card },
    roleChipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    roleText: { color: colors.mutedForeground, fontSize: 11, ...font("semibold") },
    input: { minHeight: 64, color: colors.foreground, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 14, borderCurve: "continuous", padding: 12, fontSize: 13, lineHeight: 18, ...font("regular") },
    profileMessage: { color: colors.primary, fontSize: 11, ...font("semibold") },
    infoRow: { flexDirection: "row", alignItems: "flex-start", gap: 11, paddingVertical: 9 },
    infoIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: colors.primaryMuted, alignItems: "center", justifyContent: "center" },
    infoTitle: { color: colors.foreground, fontSize: 13, ...font("bold") },
    infoBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 3, ...font("regular") },
    linkRow: { minHeight: 50, flexDirection: "row", alignItems: "center", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border, gap: 10 },
    linkLabel: { flex: 1, color: colors.foreground, fontSize: 13, ...font("semibold") },
    deleteButton: { minHeight: 48, alignItems: "center", justifyContent: "center" },
    deleteText: { color: colors.destructive, fontSize: 12, ...font("bold") },
  });
}
