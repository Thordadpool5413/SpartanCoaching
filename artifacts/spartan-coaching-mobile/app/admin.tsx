import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { HelmetMark } from "@/components/brand/HelmetMark";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import {
  fetchOrganizationAdminOverview,
  fetchPlatformAdminOverview,
  getWebSiteUrl,
  inviteOrganizationMember,
  setOrganizationMemberEnabled,
  type AccessRequestSummary,
  type AdminMetrics,
  type AdminOrganizationSummary,
  type OrgMemberSummary,
} from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

type PlatformData = {
  metrics: AdminMetrics;
  organizations: AdminOrganizationSummary[];
  requests: AccessRequestSummary[];
};

type OrgData = {
  members: OrgMemberSummary[];
  invites: Array<{ id: number; email: string; role: string; status: string }>;
  seatLimit: number;
  usage: { total: number; days: number; byTool: Array<{ toolName: string; count: number }> };
};

export default function AdminScreen() {
  const colors = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { user } = useAuth();
  const role = user?.member?.role;
  const isPlatform = role === "platform_admin";
  const isOrgAdmin = role === "org_admin";
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platform, setPlatform] = useState<PlatformData | null>(null);
  const [organization, setOrganization] = useState<OrgData | null>(null);
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!isPlatform && !isOrgAdmin) {
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    setError(null);
    try {
      if (isPlatform) setPlatform(await fetchPlatformAdminOverview());
      else setOrganization(await fetchOrganizationAdminOverview());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Admin data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOrgAdmin, isPlatform]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  if (!isPlatform && !isOrgAdmin) {
    return (
      <View style={styles.centered}>
        <Feather name="lock" size={28} color={colors.primary} />
        <Text style={styles.emptyTitle}>Administrator access required</Text>
        <Text style={styles.emptyBody}>This workspace is available only to organization and platform administrators.</Text>
        <SpartanButton title="Back to Account" onPress={() => router.back()} style={{ marginTop: 18, alignSelf: "stretch" }} />
      </View>
    );
  }

  const sendInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      Alert.alert("Complete the invitation", "Enter the member name and email address.");
      return;
    }
    setInviting(true);
    try {
      await inviteOrganizationMember({ name: inviteName, email: inviteEmail });
      setInviteName("");
      setInviteEmail("");
      await load(true);
      Alert.alert("Invitation sent", "The member will receive a secure setup link.");
    } catch (cause) {
      Alert.alert("Invitation not sent", cause instanceof Error ? cause.message : "Try again.");
    } finally {
      setInviting(false);
    }
  };

  const toggleMember = (member: OrgMemberSummary) => {
    const enabled = member.status === "disabled";
    Alert.alert(
      enabled ? "Restore member access?" : "Disable member access?",
      enabled ? `${member.name} will use an available contracted seat.` : `${member.name} will be signed out and stop using a seat.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: enabled ? "Restore" : "Disable",
          style: enabled ? "default" : "destructive",
          onPress: () => void setOrganizationMemberEnabled(member.id, enabled).then(() => load(true)).catch((cause) => Alert.alert("Change not saved", cause instanceof Error ? cause.message : "Try again.")),
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={() => { setRefreshing(true); void load(true); }} />}
    >
      <View style={styles.brandRow}>
        <HelmetMark size={54} />
        <View style={{ flex: 1 }}>
          <Text style={styles.kicker}>{isPlatform ? "PLATFORM COMMAND" : "TEAM COMMAND"}</Text>
          <Text style={styles.title}>Admin</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>{isPlatform ? "A live view of access, organizations, members, and adoption." : "Manage contracted seats, invitations, and team adoption without leaving the app."}</Text>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} /> : null}
      {error ? <View style={styles.errorCard}><Text selectable style={styles.errorText}>{error}</Text><SpartanButton title="Try again" variant="outline" onPress={() => void load()} style={{ marginTop: 12 }} /></View> : null}

      {platform ? <PlatformOverview data={platform} styles={styles} colors={colors} /> : null}

      {organization ? (
        <>
          <View style={styles.metricGrid}>
            <Metric label="Seats in use" value={organization.members.filter((item) => item.status !== "disabled").length} styles={styles} />
            <Metric label="Seat limit" value={organization.seatLimit} styles={styles} />
            <Metric label="Uses in 7 days" value={organization.usage.total} styles={styles} />
            <Metric label="Pending invites" value={organization.invites.length} styles={styles} />
          </View>

          <SectionTitle eyebrow="ADD A TEAM MEMBER" title="Send a secure invitation" styles={styles} />
          <View style={styles.panel}>
            <TextInput style={styles.input} value={inviteName} onChangeText={setInviteName} placeholder="Full name" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" />
            <TextInput style={styles.input} value={inviteEmail} onChangeText={setInviteEmail} placeholder="name@hospice.com" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <SpartanButton title="Send invitation" onPress={() => void sendInvite()} loading={inviting} />
          </View>

          <SectionTitle eyebrow="CONTRACTED TEAM" title="Members and access" styles={styles} />
          <View style={styles.list}>
            {organization.members.map((member) => (
              <View key={member.id} style={styles.row}>
                <View style={styles.avatar}><Text style={styles.avatarText}>{member.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</Text></View>
                <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{member.name}</Text><Text style={styles.rowBody}>{member.email} · {member.role.replace("_", " ")}</Text></View>
                {member.id !== user?.member?.id ? <Pressable onPress={() => toggleMember(member)} style={styles.memberAction}><Text style={styles.memberActionText}>{member.status === "disabled" ? "Restore" : "Disable"}</Text></Pressable> : null}
              </View>
            ))}
          </View>
        </>
      ) : null}

      <Pressable style={styles.webRow} onPress={() => void Linking.openURL(`${getWebSiteUrl()}${isPlatform ? "/admin" : "/org/admin"}`)}>
        <View style={{ flex: 1 }}><Text style={styles.webTitle}>Open the full web console</Text><Text style={styles.webBody}>Advanced contracts, audit history, and configuration remain available as a backup.</Text></View>
        <Feather name="arrow-up-right" size={20} color={colors.primary} />
      </Pressable>
    </ScrollView>
  );
}

function PlatformOverview({ data, styles, colors }: { data: PlatformData; styles: ReturnType<typeof makeStyles>; colors: ReturnType<typeof useColors> }) {
  const pending = data.requests.filter((item) => item.status === "pending");
  return <>
    <View style={styles.metricGrid}>
      <Metric label="Pending access" value={data.metrics.requests.pending} styles={styles} />
      <Metric label="Active orgs" value={data.metrics.organizations.active} styles={styles} />
      <Metric label="Active members" value={data.metrics.members.active} styles={styles} />
      <Metric label="Uses in 7 days" value={data.metrics.toolUsesLast7Days} styles={styles} />
    </View>
    <SectionTitle eyebrow="ACCESS DESK" title="Requests needing review" styles={styles} />
    <View style={styles.list}>{pending.length ? pending.slice(0, 8).map((item) => <View key={item.id} style={styles.row}><View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}><Feather name="user-plus" size={17} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowBody}>{item.companyName || item.email} · {item.type}</Text></View><Text style={styles.pending}>Pending</Text></View>) : <Text style={styles.emptyInline}>No access requests are waiting.</Text>}</View>
    <SectionTitle eyebrow="CLIENTS" title="Organizations" styles={styles} />
    <View style={styles.list}>{data.organizations.slice(0, 12).map((item) => <View key={item.id} style={styles.row}><View style={styles.avatar}><Text style={styles.avatarText}>{item.name.slice(0, 2).toUpperCase()}</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowBody}>{item.memberCount || 0} members · {item.type}</Text></View><Text style={styles.status}>{item.status}</Text></View>)}</View>
  </>;
}

function Metric({ label, value, styles }: { label: string; value: number; styles: ReturnType<typeof makeStyles> }) { return <View style={styles.metric}><Text selectable style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function SectionTitle({ eyebrow, title, styles }: { eyebrow: string; title: string; styles: ReturnType<typeof makeStyles> }) { return <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>; }

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
    centered: { flex: 1, backgroundColor: colors.background, padding: 28, alignItems: "center", justifyContent: "center" },
    brandRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingTop: 8 },
    kicker: { color: colors.primary, fontSize: 10, letterSpacing: 2.1, ...font("bold") },
    title: { color: colors.foreground, fontSize: 34, letterSpacing: -1, marginTop: 2, ...font("heavy") },
    subtitle: { color: colors.mutedForeground, fontSize: 15, lineHeight: 22, ...font("regular") },
    metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 8 },
    metric: { width: "48%", minHeight: 102, backgroundColor: colors.card, borderRadius: 18, padding: 16, justifyContent: "space-between", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    metricValue: { color: colors.foreground, fontSize: 30, fontVariant: ["tabular-nums"], ...font("heavy") },
    metricLabel: { color: colors.mutedForeground, fontSize: 12, ...font("medium") },
    sectionHeading: { marginTop: 12, gap: 4 },
    sectionEyebrow: { color: colors.primary, fontSize: 10, letterSpacing: 1.9, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 23, letterSpacing: -0.5, ...font("heavy") },
    panel: { backgroundColor: colors.card, borderRadius: 20, padding: 16, gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    input: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.input, color: colors.foreground, paddingHorizontal: 14, fontSize: 15, ...font("regular") },
    list: { backgroundColor: colors.card, borderRadius: 20, overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
    row: { minHeight: 72, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    avatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.foreground, fontSize: 12, ...font("bold") },
    rowTitle: { color: colors.foreground, fontSize: 14, ...font("bold") },
    rowBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 16, marginTop: 3, ...font("regular") },
    pending: { color: colors.warning, fontSize: 11, ...font("bold") },
    status: { color: colors.primary, fontSize: 11, textTransform: "capitalize", ...font("bold") },
    memberAction: { minHeight: 44, justifyContent: "center", paddingHorizontal: 8 },
    memberActionText: { color: colors.primary, fontSize: 12, ...font("bold") },
    emptyInline: { color: colors.mutedForeground, padding: 18, fontSize: 13, ...font("regular") },
    webRow: { minHeight: 90, borderRadius: 20, backgroundColor: colors.heroBackground, padding: 17, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
    webTitle: { color: colors.heroForeground, fontSize: 15, ...font("bold") },
    webBody: { color: colors.heroMuted, fontSize: 12, lineHeight: 18, marginTop: 4, ...font("regular") },
    errorCard: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginTop: 14 },
    errorText: { color: colors.destructive, fontSize: 13, lineHeight: 19, ...font("regular") },
    emptyTitle: { color: colors.foreground, fontSize: 22, marginTop: 16, textAlign: "center", ...font("heavy") },
    emptyBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: "center", ...font("regular") },
  });
}
