import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  entitlementShellCopy,
  formatHoursRemainingLabel,
  resolveEntitlementShell,
} from "@workspace/field-kit-catalog";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { AppleSubscriptionActions } from "@/components/AppleSubscriptionActions";
import { StatusChip } from "@/components/ui/StatusChip";
import { useColors } from "@/hooks/useColors";
import {
  deleteAccountMobile,
  fetchBillingStatus,
  fetchOnboardingMobile,
  getWebSiteUrl,
  openBillingPortal,
  startIndividualCheckout,
  updateOnboardingMobile,
  type BillingStatus,
} from "@/lib/api";
import {
  APP_STORE_PRIVACY_URL,
  APP_STORE_SUPPORT_URL,
  APP_STORE_TERMS_URL,
  APP_STORE_TRUST_URL,
} from "@/lib/appStoreReadiness";
import { markCheckoutPending } from "@/lib/activationCeremony";
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
  const insets = useSafeAreaInsets();
  const { preference, setPreference } = useAppearancePreference();
  const { user, isLoading, isAuthenticated, canUseFieldKit, canUseElite, logout, refresh } = useAuth();
  const [jobRole, setJobRole] = useState("");
  const [territoryNote, setTerritoryNote] = useState("");
  const [topObjections, setTopObjections] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [billing, setBilling] = useState<BillingStatus | null>(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [checkoutPending, setCheckoutPending] = useState(false);
  const [portalPending, setPortalPending] = useState(false);
  const [deletePending, setDeletePending] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"standard_weekly" | "elite_weekly">("elite_weekly");
  const billingLastFetchedRef = useRef(0);
  const stripeOpenedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  const BILLING_STALE_MS = 30_000;

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
      // The account remains usable when optional profile data is offline.
    }
  }, [canUseFieldKit]);

  const loadBilling = useCallback(async () => {
    if (!isAuthenticated) return;
    setBillingLoading(true);
    try {
      const value = await fetchBillingStatus();
      setBilling(value);
      billingLastFetchedRef.current = Date.now();
    } finally {
      setBillingLoading(false);
    }
  }, [isAuthenticated]);

  useFocusEffect(
    useCallback(() => {
      void loadProfile();
      void loadBilling();
      void refresh();
    }, [loadProfile, loadBilling, refresh]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (appStateRef.current !== "active" && nextState === "active") {
        if (stripeOpenedRef.current) {
          stripeOpenedRef.current = false;
          void loadBilling();
        } else if (Date.now() - billingLastFetchedRef.current >= BILLING_STALE_MS) {
          void loadBilling();
        }
        void refresh();
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [loadBilling, refresh]);

  if (isLoading) {
    return <View style={[styles.center, { backgroundColor: colors.background }]}><ActivityIndicator color={colors.primary} /></View>;
  }

  if (!isAuthenticated || !user) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ paddingTop: topPad + 24, paddingBottom: bottomPad, paddingHorizontal: 20 }}>
        <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>MEMBER ACCESS</Text>
        <Text style={[styles.pageTitle, { color: colors.foreground }, font("heavy")]}>Your field system</Text>
        <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }, font("regular")]}>Sign in with the same account you use on the Spartan Coaching website. Your membership, saved work, and private commitments follow you.</Text>
        <View style={[styles.heroCard, { backgroundColor: colors.heroBackground, borderColor: colors.primary }]}>
          <Text style={[styles.heroEyebrow, { color: colors.heroMuted }, font("bold")]}>HOSPICE SALES PRO</Text>
          <Text style={[styles.heroTitle, { color: colors.heroForeground }, font("heavy")]}>One account. Every field tool.</Text>
          <View style={{ marginTop: 17, gap: 11 }}>
            <Benefit icon="target" title="Standard" body="Core planning, practice, outreach, and field resources at $14.99 per week." inverted />
            <Benefit icon="zap" title="Elite" body="Adds private Spartan Coach and deidentified clinical education tools at $19.99 per week." inverted />
            <Benefit icon="users" title="Company teams" body="Contracted seats, organization access, and discounted rates." inverted />
          </View>
        </View>
        <SpartanButton title="Client login" onPress={() => router.push("/login")} style={{ marginTop: 18 }} />
        <SpartanButton title="Create an account on the web" variant="outline" onPress={() => void Linking.openURL(`${getWebSiteUrl()}/register`)} style={{ marginTop: 10 }} testID="button-create-account" />
        <Pressable onPress={() => router.push("/(tabs)/contact")} style={styles.textLink}><Text style={[{ color: colors.primary }, font("bold")]}>Team access or consulting</Text></Pressable>
      </ScrollView>
    );
  }

  const org = user.organization;
  const fieldKit = user.fieldKit;
  const billingOrg = billing?.organization;
  const isPersonal = org?.type === "personal";
  const isCompany = org?.type === "company";
  const isPlatform = org?.type === "platform" || user.member.role === "platform_admin";
  const isComp = billingOrg?.billingPlan === "comp" || org?.billingPlan === "comp";
  const billingProvider = billingOrg?.billingProvider || org?.billingProvider || null;
  const billingState = billingOrg?.billingStatus || org?.billingStatus || "";
  const hasPaidSubscription = ["active", "trialing"].includes(billingState) && (
    billingProvider === "apple" ||
    Boolean(billingOrg?.hasStripeSubscription || org?.hasStripeSubscription)
  );
  const cancelAtPeriodEnd = Boolean(billingOrg?.cancelAtPeriodEnd ?? org?.cancelAtPeriodEnd);
  const periodEnd = billingOrg?.currentPeriodEnd || org?.currentPeriodEnd;
  const canCheckout = Boolean(
    isPersonal &&
    !isPlatform &&
    !isComp &&
    !hasPaidSubscription &&
    ["trial", "expired", "suspended", "active"].includes(org?.status || ""),
  );
  const canPortal = Boolean(billing?.canOpenPortal || billingOrg?.hasStripeCustomer || org?.hasStripeCustomer);
  const shellId = resolveEntitlementShell({
    isAuthenticated: true,
    orgStatus: org?.status,
    orgType: org?.type,
    billingPlan: billingOrg?.billingPlan || org?.billingPlan,
    fieldKitAllowed: canUseFieldKit,
    fieldKitReason: fieldKit?.reason,
    cancelAtPeriodEnd,
    hasPaidSubscription,
    hoursRemaining: fieldKit?.hoursRemaining,
  });
  const shellCopy = entitlementShellCopy(shellId, { hoursLabel: formatHoursRemainingLabel(fieldKit?.hoursRemaining) });
  const currentTier = isCompany ? "Team membership" : canUseElite ? "Hospice Sales Pro Elite" : canUseFieldKit ? "Hospice Sales Pro Standard" : "Membership inactive";
  const currentPrice = canUseElite || (!canUseFieldKit && selectedPlan === "elite_weekly") ? "$19.99" : "$14.99";

  const subscribe = async () => {
    setCheckoutPending(true);
    try {
      const { url } = await startIndividualCheckout(selectedPlan);
      if (!(await Linking.canOpenURL(url))) throw new Error("Secure checkout could not be opened.");
      stripeOpenedRef.current = true;
      await markCheckoutPending();
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert("Checkout unavailable", String(error?.message || "Try again from the website Account page.").replace(/^\d+:\s*/, "").slice(0, 280));
    } finally {
      setCheckoutPending(false);
    }
  };

  const manageBilling = async () => {
    setPortalPending(true);
    try {
      const { url } = await openBillingPortal();
      stripeOpenedRef.current = true;
      await markCheckoutPending();
      await Linking.openURL(url);
    } catch (error: any) {
      Alert.alert("Billing unavailable", String(error?.message || "Try again from the website Account page.").replace(/^\d+:\s*/, "").slice(0, 280));
    } finally {
      setPortalPending(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateOnboardingMobile({
        jobRole: jobRole || null,
        territoryNote: territoryNote.trim() || null,
        topObjections: topObjections.trim() || null,
      });
      await refresh();
      setMessage("Profile saved");
    } catch (error: any) {
      setMessage(error?.message || "Profile could not be saved");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = () => {
    if (user.member.role === "platform_admin") {
      Alert.alert("Not available", "Platform administrator accounts cannot be deleted from the app.");
      return;
    }
    Alert.alert(
      "Delete your account?",
      "This permanently closes the account and signs you out. Manage any active subscription before deletion.",
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
              router.replace("/(tabs)");
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

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: topPad + 18, paddingBottom: bottomPad + 12, paddingHorizontal: 20 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
    >
      <Text style={[styles.kicker, { color: colors.primary }, font("bold")]}>MY SPARTAN</Text>
      <View style={styles.identityRow}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primaryForeground }, font("heavy")]}>{user.member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.memberName, { color: colors.foreground }, font("heavy")]}>{user.member.name}</Text>
          <Text style={[styles.memberEmail, { color: colors.mutedForeground }, font("regular")]}>{user.member.email}</Text>
        </View>
      </View>

      <View style={[styles.membershipCard, { backgroundColor: colors.heroBackground, borderColor: canUseElite ? colors.primary : colors.borderStrong }]} testID="card-membership-billing">
        <View style={styles.membershipTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroEyebrow, { color: colors.heroMuted }, font("bold")]}>YOUR MEMBERSHIP</Text>
            <Text style={[styles.membershipTitle, { color: colors.heroForeground }, font("heavy")]}>{currentTier}</Text>
          </View>
          <StatusChip label={shellCopy.chip} role={canUseFieldKit ? "active" : shellId === "trial" ? "trial" : "locked"} testID="account-status-chip" />
        </View>

        {isPersonal && !isPlatform ? (
          <Text style={[styles.membershipPrice, { color: colors.heroForeground }, font("heavy")]}>{currentPrice}<Text style={[styles.membershipCadence, { color: colors.heroMuted }, font("semibold")]}> per week</Text></Text>
        ) : null}
        <Text style={[styles.membershipBody, { color: colors.heroMuted }, font("regular")]}>{shellCopy.body}</Text>
        {periodEnd && hasPaidSubscription ? <Text style={[styles.renewal, { color: colors.heroForeground }, font("semibold")]}>{cancelAtPeriodEnd ? "Access until" : "Renews"} {new Date(periodEnd).toLocaleDateString()}</Text> : null}

        {billingLoading ? <View style={styles.loadingRow}><ActivityIndicator size="small" color={colors.primary} /><Text style={[{ color: colors.heroMuted }, font("regular")]}>Refreshing access</Text></View> : null}
        {!billingLoading && canPortal ? <SpartanButton title={portalPending ? "Opening billing" : "Manage membership"} variant="outline" onPress={() => void manageBilling()} loading={portalPending} style={{ marginTop: 16, borderColor: colors.heroMuted }} testID="button-manage-billing" /> : null}
        {!billingLoading && !canPortal ? <SpartanButton title="Refresh access" variant="outline" onPress={() => { void loadBilling(); void refresh(); }} style={{ marginTop: 16, borderColor: colors.heroMuted }} /> : null}
        {Platform.OS === "ios" && isPersonal && !canCheckout ? (
          <View style={{ marginTop: 9 }}>
            <AppleSubscriptionActions
              showManage={billingProvider === "apple" && hasPaidSubscription}
              onEntitlementChanged={async () => { await loadBilling(); await refresh(); }}
            />
          </View>
        ) : null}
      </View>

      {canCheckout ? (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="card-day-zero">
          <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>CHOOSE YOUR ACCESS</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Built for the work you do</Text>
          <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>Standard unlocks the field system. Elite adds private voice coaching and deidentified clinical education.</Text>
          <View style={styles.planGrid}>
            <PlanChoice
              selected={selectedPlan === "standard_weekly"}
              title="Standard"
              price="$14.99"
              body="Planning, practice, outreach, resources"
              onPress={() => setSelectedPlan("standard_weekly")}
            />
            <PlanChoice
              selected={selectedPlan === "elite_weekly"}
              title="Elite"
              price="$19.99"
              body="Everything plus Coach and clinical tools"
              badge="BEST FIT"
              onPress={() => {
                if (billing?.individualWeeklyElitePriceConfigured === false) {
                  Alert.alert("Elite enrollment is being connected", "Standard remains available while the Elite production price is configured.");
                  return;
                }
                setSelectedPlan("elite_weekly");
              }}
            />
          </View>
          <View style={{ marginTop: 14 }}>
            {Platform.OS === "ios" ? (
              <AppleSubscriptionActions
                plan={selectedPlan}
                showPurchase
                onEntitlementChanged={async () => { await loadBilling(); await refresh(); }}
              />
            ) : (
              <SpartanButton
                title={selectedPlan === "elite_weekly" ? "Choose Elite" : "Choose Standard"}
                onPress={() => void subscribe()}
                loading={checkoutPending}
                testID="button-subscribe"
              />
            )}
          </View>
          <Text style={[styles.purchaseNote, { color: colors.mutedForeground }, font("regular")]}>Apple purchases are finished only after the signed transaction is verified by Spartan Coaching and bound to this account.</Text>
        </View>
      ) : null}

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="card-your-membership">
        <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>ACCESS</Text>
        <AccessRow icon="target" title="Core field system" state={canUseFieldKit ? "Unlocked" : "Locked"} active={canUseFieldKit} />
        <AccessRow icon="mic" title="Private Spartan Coach" state={canUseElite ? "Unlocked" : "Elite"} active={Boolean(canUseElite)} onPress={() => router.push(canUseElite ? "/(tabs)/coach" : "/(tabs)/account")} />
        <AccessRow icon="shield" title="Deidentified clinical education" state={canUseElite ? "Unlocked" : "Elite"} active={Boolean(canUseElite)} onPress={() => router.push(canUseElite ? "/ai-tools" as any : "/(tabs)/account")} />
        {isCompany ? <Text style={[styles.teamNote, { color: colors.mutedForeground }, font("regular")]}>Seat changes and contracted billing are managed by your organization administrator.</Text> : null}
        {(user.member.role === "org_admin" || user.member.role === "platform_admin") ? (
          <Pressable onPress={() => void Linking.openURL(`${getWebSiteUrl()}/org/admin`)} style={[styles.inlineLink, { borderTopColor: colors.border }]} testID="account-org-admin-handoff">
            <View style={{ flex: 1 }}>
              <Text style={[styles.inlineTitle, { color: colors.foreground }, font("bold")]}>Organization administration</Text>
              <Text style={[styles.inlineBody, { color: colors.mutedForeground }, font("regular")]}>Manage members, structure, and seats on the website.</Text>
            </View>
            <Feather name="arrow-up-right" size={18} color={colors.primary} />
          </Pressable>
        ) : null}
      </View>

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>APPEARANCE</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Make it yours</Text>
        <View style={styles.appearanceGrid}>
          {APPEARANCES.map((item) => {
            const selected = preference === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => void setPreference(item.id)}
                style={[styles.appearanceChoice, { backgroundColor: selected ? colors.primary : colors.background, borderColor: selected ? colors.primary : colors.border }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
              >
                <Feather name={item.icon} size={18} color={selected ? colors.primaryForeground : colors.foreground} />
                <Text style={[styles.appearanceLabel, { color: selected ? colors.primaryForeground : colors.foreground }, font("bold")]}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {canUseFieldKit ? (
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>FIELD PROFILE</Text>
          <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Tune the experience</Text>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }, font("bold")]}>ROLE</Text>
          <View style={styles.roleWrap}>
            {ROLES.map((role) => {
              const selected = jobRole === role.id;
              return (
                <Pressable key={role.id} onPress={() => setJobRole(role.id)} style={[styles.roleChip, { backgroundColor: selected ? colors.primaryMuted : colors.background, borderColor: selected ? colors.primary : colors.border }]}>
                  <Text style={[styles.roleLabel, { color: selected ? colors.primary : colors.foreground }, font("bold")]}>{role.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }, font("bold")]}>TERRITORY CONTEXT</Text>
          <TextInput value={territoryNote} onChangeText={setTerritoryNote} placeholder="Market, facilities, focus" placeholderTextColor={colors.mutedForeground} multiline style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <Text style={[styles.fieldLabel, { color: colors.mutedForeground }, font("bold")]}>COMMON OBJECTIONS</Text>
          <TextInput value={topObjections} onChangeText={setTopObjections} placeholder="Not ready, already have a provider" placeholderTextColor={colors.mutedForeground} multiline style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]} />
          <SpartanButton title="Save field profile" onPress={() => void saveProfile()} loading={saving} style={{ marginTop: 14 }} />
          {message ? <Text style={[styles.saveMessage, { color: colors.mutedForeground }, font("regular")]}>{message}</Text> : null}
          <Text style={[styles.noPhi, { color: colors.mutedForeground }, font("regular")]}>Coaching context only. Never enter patient PHI.</Text>
        </View>
      ) : null}

      <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]} testID="card-privacy-legal">
        <Text style={[styles.sectionEyebrow, { color: colors.primary }, font("bold")]}>TRUST</Text>
        <Text style={[styles.sectionTitle, { color: colors.foreground }, font("heavy")]}>Privacy is part of the product</Text>
        <Text style={[styles.sectionBody, { color: colors.mutedForeground }, font("regular")]}>Raw Coach conversations remain private and are removed after 90 days. Only summaries and commitments you explicitly share can be visible to a manager.</Text>
        {[
          { label: "Privacy policy", url: APP_STORE_PRIVACY_URL, testID: "link-privacy" },
          { label: "Terms of service", url: APP_STORE_TERMS_URL, testID: "link-terms" },
          { label: "Trust center", url: APP_STORE_TRUST_URL, testID: "link-trust" },
          { label: "Support", url: APP_STORE_SUPPORT_URL, testID: "link-support" },
        ].map((item) => (
          <Pressable key={item.url} onPress={() => void Linking.openURL(item.url)} style={[styles.legalRow, { borderTopColor: colors.border }]} testID={item.testID}>
            <Text style={[styles.legalLabel, { color: colors.foreground }, font("semibold")]}>{item.label}</Text>
            <Feather name="arrow-up-right" size={17} color={colors.primary} />
          </Pressable>
        ))}
      </View>

      <SpartanButton
        title="Sign out"
        variant="outline"
        onPress={async () => {
          await logout();
          router.replace("/(tabs)");
        }}
        style={{ marginTop: 22 }}
        testID="button-sign-out"
      />
      <Pressable onPress={deleteAccount} disabled={deletePending} style={styles.deleteButton} testID="button-delete-account">
        <Text style={[styles.deleteText, { color: colors.destructive }, font("bold")]}>{deletePending ? "Deleting account" : "Delete account"}</Text>
      </Pressable>
      <Text style={[styles.deleteNote, { color: colors.mutedForeground }, font("regular")]}>Account deletion is permanent. Manage an active subscription first.</Text>
    </ScrollView>
  );
}

function Benefit({ icon, title, body, inverted }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; body: string; inverted?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.benefit}>
      <View style={[styles.benefitIcon, { backgroundColor: inverted ? colors.primary : colors.primaryMuted }]}><Feather name={icon} size={17} color={inverted ? colors.primaryForeground : colors.primary} /></View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.benefitTitle, { color: inverted ? colors.heroForeground : colors.foreground }, font("bold")]}>{title}</Text>
        <Text style={[styles.benefitBody, { color: inverted ? colors.heroMuted : colors.mutedForeground }, font("regular")]}>{body}</Text>
      </View>
    </View>
  );
}

function PlanChoice({ selected, title, price, body, badge, onPress }: { selected: boolean; title: string; price: string; body: string; badge?: string; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={[styles.plan, { backgroundColor: selected ? colors.primaryMuted : colors.background, borderColor: selected ? colors.primary : colors.border, borderWidth: selected ? 2 : 1 }]}>
      {badge ? <Text style={[styles.planBadge, { color: colors.primary }, font("bold")]}>{badge}</Text> : null}
      <Text style={[styles.planTitle, { color: colors.foreground }, font("heavy")]}>{title}</Text>
      <Text style={[styles.planPrice, { color: colors.primary }, font("heavy")]}>{price}<Text style={[styles.planCadence, { color: colors.mutedForeground }, font("regular")]}> / week</Text></Text>
      <Text style={[styles.planBody, { color: colors.mutedForeground }, font("regular")]}>{body}</Text>
    </Pressable>
  );
}

function AccessRow({ icon, title, state, active, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; title: string; state: string; active: boolean; onPress?: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[styles.accessRow, { borderTopColor: colors.border }]}>
      <View style={[styles.accessIcon, { backgroundColor: active ? colors.primaryMuted : colors.muted }]}><Feather name={icon} size={17} color={active ? colors.primary : colors.mutedForeground} /></View>
      <Text style={[styles.accessTitle, { color: colors.foreground }, font("semibold")]}>{title}</Text>
      <Text style={[styles.accessState, { color: active ? colors.success : colors.mutedForeground }, font("bold")]}>{state}</Text>
      {onPress ? <Feather name="chevron-right" size={17} color={colors.mutedForeground} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 10, letterSpacing: 2.2, marginBottom: 8 },
  pageTitle: { fontSize: 35, letterSpacing: -1, marginBottom: 8 },
  pageSubtitle: { fontSize: 14, lineHeight: 21 },
  heroCard: { borderWidth: 1, borderRadius: 22, padding: 20, marginTop: 20 },
  heroEyebrow: { fontSize: 9, letterSpacing: 1.8 },
  heroTitle: { fontSize: 24, lineHeight: 29, letterSpacing: -0.5, marginTop: 10 },
  textLink: { minHeight: 48, justifyContent: "center", alignItems: "center", marginTop: 8 },
  identityRow: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 18 },
  avatar: { width: 48, height: 48, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 17 },
  memberName: { fontSize: 24, letterSpacing: -0.5 },
  memberEmail: { fontSize: 12, marginTop: 3 },
  membershipCard: { borderWidth: 1, borderRadius: 24, padding: 20 },
  membershipTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  membershipTitle: { fontSize: 23, lineHeight: 28, letterSpacing: -0.5, marginTop: 7 },
  membershipPrice: { fontSize: 30, letterSpacing: -0.8, marginTop: 16 },
  membershipCadence: { fontSize: 13 },
  membershipBody: { fontSize: 13, lineHeight: 20, marginTop: 8 },
  renewal: { fontSize: 12, marginTop: 11 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 15 },
  sectionCard: { borderWidth: StyleSheet.hairlineWidth * 2, borderRadius: 21, padding: 18, marginTop: 14 },
  sectionEyebrow: { fontSize: 9, letterSpacing: 1.8, marginBottom: 7 },
  sectionTitle: { fontSize: 21, letterSpacing: -0.4 },
  sectionBody: { fontSize: 13, lineHeight: 19, marginTop: 6 },
  planGrid: { flexDirection: "row", gap: 9, marginTop: 16 },
  plan: { flex: 1, borderRadius: 17, padding: 14, minHeight: 154 },
  planBadge: { fontSize: 8, letterSpacing: 1.2, marginBottom: 5 },
  planTitle: { fontSize: 16 },
  planPrice: { fontSize: 21, marginTop: 7 },
  planCadence: { fontSize: 10 },
  planBody: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  purchaseNote: { fontSize: 10, lineHeight: 15, textAlign: "center", marginTop: 11 },
  accessRow: { minHeight: 59, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", gap: 10 },
  accessIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  accessTitle: { flex: 1, fontSize: 13 },
  accessState: { fontSize: 11 },
  teamNote: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  inlineLink: { borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", paddingTop: 14, marginTop: 4 },
  inlineTitle: { fontSize: 13 },
  inlineBody: { fontSize: 11, lineHeight: 16, marginTop: 3 },
  appearanceGrid: { flexDirection: "row", gap: 8, marginTop: 14 },
  appearanceChoice: { flex: 1, minHeight: 67, borderWidth: 1, borderRadius: 15, alignItems: "center", justifyContent: "center", gap: 7 },
  appearanceLabel: { fontSize: 12 },
  fieldLabel: { fontSize: 9, letterSpacing: 1.3, marginTop: 16 },
  roleWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7, marginTop: 9 },
  roleChip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 11, paddingVertical: 8 },
  roleLabel: { fontSize: 11 },
  input: { borderWidth: 1, borderRadius: 14, minHeight: 78, padding: 13, marginTop: 8, fontSize: 14, textAlignVertical: "top" },
  saveMessage: { fontSize: 12, textAlign: "center", marginTop: 8 },
  noPhi: { fontSize: 10, textAlign: "center", marginTop: 8 },
  legalRow: { minHeight: 51, borderTopWidth: StyleSheet.hairlineWidth, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  legalLabel: { fontSize: 13 },
  deleteButton: { minHeight: 48, alignItems: "center", justifyContent: "center", marginTop: 8 },
  deleteText: { fontSize: 13 },
  deleteNote: { fontSize: 10, lineHeight: 15, textAlign: "center" },
  benefit: { flexDirection: "row", alignItems: "flex-start", gap: 11 },
  benefitIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  benefitTitle: { fontSize: 14 },
  benefitBody: { fontSize: 12, lineHeight: 17, marginTop: 2 },
});
