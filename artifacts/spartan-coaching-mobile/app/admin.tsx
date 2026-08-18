import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BrandStamp } from "@/components/brand/BrandStamp";
import { SpartanButton } from "@/components/ui/SpartanButton";
import { useColors } from "@/hooks/useColors";
import {
  fetchOrganizationAdminOverview,
  fetchPlatformAdminOverview,
  inviteOrganizationMember,
  setOrganizationMemberEnabled,
  type AccessRequestSummary,
  type AdminMetrics,
  type AdminOrganizationSummary,
  type OrgMemberSummary,
} from "@/lib/api";
import {
  assignOrganizationMember,
  createOrganizationBranch,
  createOrganizationTeam,
  fetchOrgAdminDetail,
  offboardOrganizationMember,
  setOrganizationMemberRole,
  type OrgAdminProfile,
  type OrgAuditEvent,
  type OrgBranchSummary,
  type OrgStructuredMember,
  type OrgTeamSummary,
} from "@/lib/orgAdminApi";
import { useAuth } from "@/lib/AuthContext";
import { font } from "@/lib/typography";

type PlatformData = {
  metrics: AdminMetrics;
  organizations: AdminOrganizationSummary[];
  requests: AccessRequestSummary[];
};

type OrgData = {
  members: OrgStructuredMember[];
  invites: Array<{ id: number; email: string; role: string; status: string }>;
  seatLimit: number;
  usage: {
    total: number;
    days: number;
    byTool: Array<{ toolName: string; count: number }>;
    byMember: Array<{ email: string; count: number }>;
  };
  profile: OrgAdminProfile | null;
  branches: OrgBranchSummary[];
  teams: OrgTeamSummary[];
  audit: OrgAuditEvent[];
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
  const [inviteRole, setInviteRole] = useState<"member" | "org_admin">("member");
  const [branchName, setBranchName] = useState("");
  const [teamName, setTeamName] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!isPlatform && !isOrgAdmin) {
      setLoading(false);
      return;
    }
    if (!quiet) setLoading(true);
    setError(null);
    try {
      if (isPlatform) {
        setPlatform(await fetchPlatformAdminOverview());
      } else {
        const [overview, detail] = await Promise.all([
          fetchOrganizationAdminOverview(),
          fetchOrgAdminDetail(),
        ]);
        const structured = detail.members.length
          ? detail.members
          : overview.members.map((member) => ({ ...member }));
        setOrganization({
          ...overview,
          members: structured,
          profile: detail.profile,
          branches: detail.branches,
          teams: detail.teams,
          audit: detail.audit,
        });
      }
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
        <Text style={styles.emptyBody}>This workspace only appears after an authorized organization or platform administrator role is active.</Text>
        <SpartanButton title="Back to Account" onPress={() => router.back()} style={{ marginTop: 18, alignSelf: "stretch" }} />
      </View>
    );
  }

  const withBusy = async (action: () => Promise<unknown>, success?: string) => {
    setBusy(true);
    try {
      await action();
      await load(true);
      if (success) Alert.alert(success);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (cause) {
      Alert.alert("Change not saved", cause instanceof Error ? cause.message : "Try again.");
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = async () => {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      Alert.alert("Complete the invitation", "Enter the member name and email address.");
      return;
    }
    await withBusy(
      () => inviteOrganizationMember({ name: inviteName, email: inviteEmail, role: inviteRole }),
      "Invitation sent",
    );
    setInviteName("");
    setInviteEmail("");
    setInviteRole("member");
  };

  const selectedMember = organization?.members.find((member) => member.id === selectedMemberId) || null;

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} tintColor={colors.primary} onRefresh={() => { setRefreshing(true); void load(true); }} />}
      showsVerticalScrollIndicator={false}
      testID="screen-admin"
    >
      <View style={styles.brandField}>
        <BrandStamp width={142} height={84} />
        <Text style={styles.kicker}>{isPlatform ? "PLATFORM ADMINISTRATION" : "ORGANIZATION ADMINISTRATION"}</Text>
        <Text style={styles.title}>{isPlatform ? "Platform command" : "Your team, without crossing the privacy line."}</Text>
        <Text style={styles.subtitle}>{isPlatform ? "Access, organizations, activation, and adoption from the native app." : "Manage contracted seats, members, roles, structure, adoption, and audit history. Private member coaching content stays private."}</Text>
      </View>

      <View style={styles.privacyCard} testID="admin-privacy-boundary">
        <View style={styles.privacyIcon}><Feather name="shield" size={20} color="#FFFFFF" /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyTitle}>Admin visibility has a hard boundary.</Text>
          <Text style={styles.privacyBody}>You can see activation, usage counts, trends, last activity, and information a member explicitly shares. You cannot see raw Coach prompts, drafts, recordings, transcripts, or unshared outputs.</Text>
        </View>
      </View>

      {loading ? <ActivityIndicator color={colors.primary} style={{ marginTop: 30 }} /> : null}
      {error ? <View style={styles.errorCard}><Text selectable style={styles.errorText}>{error}</Text><SpartanButton title="Try again" variant="outline" onPress={() => void load()} style={{ marginTop: 12 }} /></View> : null}

      {platform ? <PlatformOverview data={platform} styles={styles} colors={colors} /> : null}

      {organization ? (
        <>
          <OrganizationStatus data={organization} styles={styles} />
          <UsageOverview data={organization} styles={styles} colors={colors} />

          <SectionTitle eyebrow="CONTRACTED TEAM" title="Members and access" styles={styles} />
          <Text style={styles.sectionBody}>Tap a member to manage role, status, branch, team, manager, or offboarding. Your own administrator role is protected here.</Text>
          <View style={styles.list}>
            {organization.members.map((member) => {
              const selected = member.id === selectedMemberId;
              return (
                <Pressable
                  key={member.id}
                  onPress={() => setSelectedMemberId(selected ? null : member.id)}
                  style={[styles.memberRow, selected && styles.memberRowSelected]}
                  accessibilityRole="button"
                >
                  <View style={styles.avatar}><Text style={styles.avatarText}>{initials(member.name)}</Text></View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTitleLine}><Text style={styles.rowTitle}>{member.name}</Text><Text style={[styles.roleTag, member.role === "org_admin" && styles.roleTagAdmin]}>{member.role === "org_admin" ? "ADMIN" : "MEMBER"}</Text></View>
                    <Text style={styles.rowBody}>{member.email}</Text>
                    <Text style={styles.rowMeta}>{member.status} · {member.lastLoginAt ? `last active ${new Date(member.lastLoginAt).toLocaleDateString()}` : "no recorded login"}</Text>
                  </View>
                  <Feather name={selected ? "chevron-up" : "chevron-down"} size={19} color={colors.mutedForeground} />
                </Pressable>
              );
            })}
          </View>

          {selectedMember ? (
            <MemberControls
              member={selectedMember}
              currentMemberId={user?.member?.id}
              data={organization}
              styles={styles}
              colors={colors}
              disabled={busy}
              onRole={(nextRole) => void withBusy(() => setOrganizationMemberRole(selectedMember.id, nextRole))}
              onEnabled={(enabled) => void withBusy(() => setOrganizationMemberEnabled(selectedMember.id, enabled))}
              onAssign={(input) => void withBusy(() => assignOrganizationMember(selectedMember.id, input))}
              onOffboard={() => {
                Alert.alert(
                  `Offboard ${selectedMember.name}?`,
                  "This immediately disables the company seat and clears active sessions. The member's private Coach content is not exposed to the organization administrator.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Offboard", style: "destructive", onPress: () => void withBusy(() => offboardOrganizationMember(selectedMember.id)) },
                  ],
                );
              }}
            />
          ) : null}

          <SectionTitle eyebrow="ADD A TEAM MEMBER" title="Send a secure invitation" styles={styles} />
          <View style={styles.panel}>
            <TextInput style={styles.input} value={inviteName} onChangeText={setInviteName} placeholder="Full name" placeholderTextColor={colors.mutedForeground} autoCapitalize="words" />
            <TextInput style={styles.input} value={inviteEmail} onChangeText={setInviteEmail} placeholder="name@hospice.com" placeholderTextColor={colors.mutedForeground} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <Text style={styles.inputLabel}>Initial role</Text>
            <View style={styles.choiceRow}>
              <Choice label="Member" selected={inviteRole === "member"} onPress={() => setInviteRole("member")} styles={styles} />
              <Choice label="Org admin" selected={inviteRole === "org_admin"} onPress={() => setInviteRole("org_admin")} styles={styles} />
            </View>
            <SpartanButton title="Send invitation" onPress={() => void sendInvite()} loading={busy} />
          </View>

          <SectionTitle eyebrow="ORGANIZATION STRUCTURE" title="Branches and teams" styles={styles} />
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Branches</Text>
            <ChipList items={organization.branches.map((branch) => branch.name)} empty="No branches yet." styles={styles} />
            <View style={styles.inlineForm}><TextInput style={[styles.input, { flex: 1 }]} value={branchName} onChangeText={setBranchName} placeholder="New branch" placeholderTextColor={colors.mutedForeground} /><Pressable disabled={busy || branchName.trim().length < 2} onPress={() => void withBusy(() => createOrganizationBranch(branchName)).then(() => setBranchName(""))} style={styles.addButton}><Feather name="plus" size={19} color="#FFFFFF" /></Pressable></View>
            <View style={styles.panelDivider} />
            <Text style={styles.panelTitle}>Teams</Text>
            <ChipList items={organization.teams.map((team) => team.name)} empty="No teams yet." styles={styles} />
            <View style={styles.inlineForm}><TextInput style={[styles.input, { flex: 1 }]} value={teamName} onChangeText={setTeamName} placeholder="New team" placeholderTextColor={colors.mutedForeground} /><Pressable disabled={busy || teamName.trim().length < 2} onPress={() => void withBusy(() => createOrganizationTeam(teamName)).then(() => setTeamName(""))} style={styles.addButton}><Feather name="plus" size={19} color="#FFFFFF" /></Pressable></View>
          </View>

          <SectionTitle eyebrow="AUDIT" title="Administrator activity" styles={styles} />
          <View style={styles.list}>
            {organization.audit.length ? organization.audit.slice(0, 12).map((event) => (
              <View key={event.id} style={styles.auditRow}>
                <View style={styles.auditDot} />
                <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{humanize(event.action)}</Text><Text style={styles.rowBody}>{event.targetType ? `${event.targetType}${event.targetId ? ` · ${event.targetId}` : ""}` : "Organization"}</Text></View>
                <Text style={styles.rowMeta}>{new Date(event.createdAt).toLocaleDateString()}</Text>
              </View>
            )) : <Text style={styles.emptyInline}>No administrator actions recorded yet.</Text>}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

function OrganizationStatus({ data, styles }: { data: OrgData; styles: ReturnType<typeof makeStyles> }) {
  const activeMembers = data.members.filter((member) => member.status !== "disabled").length;
  const cap = data.profile?.billableSeats || data.profile?.seatLimit || data.seatLimit;
  return (
    <>
      <SectionTitle eyebrow="CONTRACT" title={data.profile?.name || "Organization access"} styles={styles} />
      <View style={styles.metricGrid}>
        <Metric label="Seats in use" value={`${activeMembers}${cap ? ` / ${cap}` : ""}`} styles={styles} />
        <Metric label="Uses" value={String(data.usage.total)} styles={styles} />
        <Metric label="Pending invites" value={String(data.invites.length)} styles={styles} />
        <Metric label="Plan" value={friendlyPlan(data.profile?.billingPlan)} compact styles={styles} />
      </View>
      <View style={styles.contractLine}><Text style={styles.contractLabel}>Status</Text><Text style={styles.contractValue}>{data.profile?.status || "active"}</Text></View>
      {data.profile?.contractRef ? <View style={styles.contractLine}><Text style={styles.contractLabel}>Agreement</Text><Text style={styles.contractValue}>{data.profile.contractRef}</Text></View> : null}
    </>
  );
}

function UsageOverview({ data, styles, colors }: { data: OrgData; styles: ReturnType<typeof makeStyles>; colors: ReturnType<typeof useColors> }) {
  const rows = data.usage.byTool.slice(0, 7);
  const max = Math.max(1, ...rows.map((row) => row.count));
  return (
    <>
      <SectionTitle eyebrow="ADOPTION" title={`Team usage · last ${data.usage.days} days`} styles={styles} />
      <Text style={styles.sectionBody}>Aggregate activity only. This view measures adoption, not the content of anyone's work.</Text>
      <View style={styles.panel}>
        {rows.length ? rows.map((row) => (
          <View key={row.toolName} style={styles.usageRow}>
            <View style={styles.usageLine}><Text numberOfLines={1} style={styles.usageName}>{row.toolName}</Text><Text style={styles.usageCount}>{row.count}</Text></View>
            <View style={styles.usageTrack}><View style={[styles.usageFill, { width: `${Math.max(6, (row.count / max) * 100)}%`, backgroundColor: colors.primary }]} /></View>
          </View>
        )) : <Text style={styles.emptyInline}>No tool activity recorded for this period.</Text>}
      </View>
    </>
  );
}

function MemberControls({ member, currentMemberId, data, styles, colors, disabled, onRole, onEnabled, onAssign, onOffboard }: {
  member: OrgStructuredMember;
  currentMemberId?: number;
  data: OrgData;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useColors>;
  disabled: boolean;
  onRole: (role: "member" | "org_admin") => void;
  onEnabled: (enabled: boolean) => void;
  onAssign: (input: { branchId?: number | null; teamId?: number | null; managerMemberId?: number | null }) => void;
  onOffboard: () => void;
}) {
  const isSelf = member.id === currentMemberId;
  return (
    <View style={styles.controls} testID="admin-member-controls">
      <Text style={styles.panelTitle}>{member.name}</Text>
      <Text style={styles.sectionBody}>Changes apply to company access only. Private Coach content remains outside this workspace.</Text>
      <Text style={styles.inputLabel}>Role</Text>
      <View style={styles.choiceRow}>
        <Choice label="Member" selected={member.role !== "org_admin"} disabled={disabled || isSelf} onPress={() => onRole("member")} styles={styles} />
        <Choice label="Org admin" selected={member.role === "org_admin"} disabled={disabled || isSelf} onPress={() => onRole("org_admin")} styles={styles} />
      </View>
      <Text style={styles.inputLabel}>Branch</Text>
      <View style={styles.choiceWrap}><Choice label="Unassigned" selected={!member.branchId} disabled={disabled} onPress={() => onAssign({ branchId: null })} styles={styles} />{data.branches.map((branch) => <Choice key={branch.id} label={branch.name} selected={member.branchId === branch.id} disabled={disabled} onPress={() => onAssign({ branchId: branch.id })} styles={styles} />)}</View>
      <Text style={styles.inputLabel}>Team</Text>
      <View style={styles.choiceWrap}><Choice label="Unassigned" selected={!member.teamId} disabled={disabled} onPress={() => onAssign({ teamId: null })} styles={styles} />{data.teams.map((team) => <Choice key={team.id} label={team.name} selected={member.teamId === team.id} disabled={disabled} onPress={() => onAssign({ teamId: team.id })} styles={styles} />)}</View>
      <Text style={styles.inputLabel}>Manager</Text>
      <View style={styles.choiceWrap}><Choice label="None" selected={!member.managerMemberId} disabled={disabled} onPress={() => onAssign({ managerMemberId: null })} styles={styles} />{data.members.filter((candidate) => candidate.id !== member.id && candidate.status !== "disabled").map((candidate) => <Choice key={candidate.id} label={candidate.name} selected={member.managerMemberId === candidate.id} disabled={disabled} onPress={() => onAssign({ managerMemberId: candidate.id })} styles={styles} />)}</View>
      {!isSelf ? <View style={styles.dangerRow}><SpartanButton title={member.status === "disabled" ? "Restore seat" : "Disable seat"} variant="outline" onPress={() => onEnabled(member.status === "disabled")} disabled={disabled} style={{ flex: 1 }} /><Pressable disabled={disabled} onPress={onOffboard} style={styles.offboard}><Text style={styles.offboardText}>Offboard</Text></Pressable></View> : <Text style={styles.selfNote}>Your own administrator role and seat cannot be changed from this control.</Text>}
    </View>
  );
}

function PlatformOverview({ data, styles, colors }: { data: PlatformData; styles: ReturnType<typeof makeStyles>; colors: ReturnType<typeof useColors> }) {
  const pending = data.requests.filter((item) => item.status === "pending");
  return <>
    <View style={styles.metricGrid}>
      <Metric label="Pending access" value={String(data.metrics.requests.pending)} styles={styles} />
      <Metric label="Active orgs" value={String(data.metrics.organizations.active)} styles={styles} />
      <Metric label="Active members" value={String(data.metrics.members.active)} styles={styles} />
      <Metric label="Uses · 7 days" value={String(data.metrics.toolUsesLast7Days)} styles={styles} />
    </View>
    <SectionTitle eyebrow="ACCESS DESK" title="Requests needing review" styles={styles} />
    <View style={styles.list}>{pending.length ? pending.slice(0, 8).map((item) => <View key={item.id} style={styles.auditRow}><View style={[styles.avatar, { backgroundColor: colors.primaryMuted }]}><Feather name="user-plus" size={17} color={colors.primary} /></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowBody}>{item.companyName || item.email} · {item.type}</Text></View><Text style={styles.pending}>Pending</Text></View>) : <Text style={styles.emptyInline}>No access requests are waiting.</Text>}</View>
    <SectionTitle eyebrow="CLIENTS" title="Organizations" styles={styles} />
    <View style={styles.list}>{data.organizations.slice(0, 12).map((item) => <View key={item.id} style={styles.auditRow}><View style={styles.avatar}><Text style={styles.avatarText}>{initials(item.name)}</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.name}</Text><Text style={styles.rowBody}>{item.memberCount || 0} members · {item.type}</Text></View><Text style={styles.status}>{item.status}</Text></View>)}</View>
  </>;
}

function Choice({ label, selected, onPress, styles, disabled = false }: { label: string; selected: boolean; onPress: () => void; styles: ReturnType<typeof makeStyles>; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={() => { void Haptics.selectionAsync(); onPress(); }} style={[styles.choice, selected && styles.choiceSelected, disabled && { opacity: 0.5 }]}><Text style={[styles.choiceText, selected && styles.choiceTextSelected]} numberOfLines={1}>{label}</Text></Pressable>;
}

function ChipList({ items, empty, styles }: { items: string[]; empty: string; styles: ReturnType<typeof makeStyles> }) {
  return items.length ? <View style={styles.choiceWrap}>{items.map((item) => <View key={item} style={styles.staticChip}><Text style={styles.staticChipText}>{item}</Text></View>)}</View> : <Text style={styles.emptyInline}>{empty}</Text>;
}

function Metric({ label, value, compact = false, styles }: { label: string; value: string; compact?: boolean; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.metric}><Text selectable style={[styles.metricValue, compact && styles.metricValueCompact]} numberOfLines={2}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

function SectionTitle({ eyebrow, title, styles }: { eyebrow: string; title: string; styles: ReturnType<typeof makeStyles> }) {
  return <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text></View>;
}

function initials(name: string) { return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase(); }
function humanize(value: string) { return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function friendlyPlan(value?: string | null) { if (!value) return "Contract"; if (value.includes("elite")) return "Elite"; if (value.includes("standard")) return "Standard"; if (value === "corporate_contract") return "Contract"; return humanize(value); }

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 20, paddingBottom: 54, gap: 16 },
    centered: { flex: 1, backgroundColor: colors.background, padding: 28, alignItems: "center", justifyContent: "center" },
    brandField: { marginHorizontal: -20, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 24, backgroundColor: colors.heroBackground, gap: 7 },
    kicker: { color: colors.heroMuted, fontSize: 9, letterSpacing: 2.1, ...font("bold") },
    title: { color: colors.heroForeground, fontSize: 31, lineHeight: 36, letterSpacing: -0.9, ...font("heavy") },
    subtitle: { color: colors.heroMuted, fontSize: 14, lineHeight: 21, ...font("regular") },
    privacyCard: { flexDirection: "row", alignItems: "flex-start", gap: 12, borderRadius: 18, borderCurve: "continuous", borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryMuted, padding: 15 },
    privacyIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    privacyTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    privacyBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 4, ...font("regular") },
    metricGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 5 },
    metric: { width: "48%", minHeight: 103, backgroundColor: colors.card, borderRadius: 18, borderCurve: "continuous", padding: 15, justifyContent: "space-between", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    metricValue: { color: colors.foreground, fontSize: 28, fontVariant: ["tabular-nums"], ...font("heavy") },
    metricValueCompact: { fontSize: 18, lineHeight: 22 },
    metricLabel: { color: colors.mutedForeground, fontSize: 11, ...font("medium") },
    contractLine: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    contractLabel: { color: colors.mutedForeground, fontSize: 11, ...font("medium") },
    contractValue: { color: colors.foreground, fontSize: 11, textTransform: "capitalize", ...font("bold") },
    sectionHeading: { marginTop: 12, gap: 4 },
    sectionEyebrow: { color: colors.primary, fontSize: 9, letterSpacing: 1.9, ...font("bold") },
    sectionTitle: { color: colors.foreground, fontSize: 23, letterSpacing: -0.5, ...font("heavy") },
    sectionBody: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17, ...font("regular") },
    panel: { backgroundColor: colors.card, borderRadius: 20, borderCurve: "continuous", padding: 16, gap: 12, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    panelTitle: { color: colors.foreground, fontSize: 15, ...font("bold") },
    panelDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong, marginVertical: 3 },
    inputLabel: { color: colors.mutedForeground, fontSize: 10, letterSpacing: 0.7, textTransform: "uppercase", ...font("bold") },
    input: { minHeight: 50, borderRadius: 14, borderCurve: "continuous", borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.input, color: colors.foreground, paddingHorizontal: 14, fontSize: 15, ...font("regular") },
    inlineForm: { flexDirection: "row", gap: 8, alignItems: "center" },
    addButton: { width: 50, height: 50, borderRadius: 15, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
    list: { backgroundColor: colors.card, borderRadius: 20, borderCurve: "continuous", overflow: "hidden", borderWidth: StyleSheet.hairlineWidth, borderColor: colors.borderStrong },
    memberRow: { minHeight: 78, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    memberRowSelected: { backgroundColor: colors.primaryMuted },
    avatar: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.secondary, alignItems: "center", justifyContent: "center" },
    avatarText: { color: colors.foreground, fontSize: 12, ...font("bold") },
    rowTitleLine: { flexDirection: "row", alignItems: "center", gap: 7 },
    rowTitle: { color: colors.foreground, fontSize: 13, ...font("bold") },
    rowBody: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, marginTop: 2, ...font("regular") },
    rowMeta: { color: colors.mutedForeground, fontSize: 9, lineHeight: 14, marginTop: 2, ...font("regular") },
    roleTag: { color: colors.mutedForeground, backgroundColor: colors.muted, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2, fontSize: 7, letterSpacing: 0.7, ...font("bold") },
    roleTagAdmin: { color: colors.primary, backgroundColor: colors.primaryMuted },
    controls: { borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card, borderRadius: 20, borderCurve: "continuous", padding: 16, gap: 12 },
    choiceRow: { flexDirection: "row", gap: 8 },
    choiceWrap: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
    choice: { minHeight: 40, justifyContent: "center", borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 20, backgroundColor: colors.card, paddingHorizontal: 12, maxWidth: "100%" },
    choiceSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
    choiceText: { color: colors.mutedForeground, fontSize: 10, ...font("semibold") },
    choiceTextSelected: { color: colors.primary },
    staticChip: { minHeight: 34, justifyContent: "center", borderRadius: 17, backgroundColor: colors.muted, paddingHorizontal: 10 },
    staticChipText: { color: colors.foreground, fontSize: 10, ...font("semibold") },
    dangerRow: { flexDirection: "row", gap: 10, alignItems: "center", marginTop: 4 },
    offboard: { minHeight: 48, minWidth: 88, alignItems: "center", justifyContent: "center" },
    offboardText: { color: colors.destructive, fontSize: 11, ...font("bold") },
    selfNote: { color: colors.mutedForeground, fontSize: 10, lineHeight: 15, ...font("regular") },
    usageRow: { gap: 6 },
    usageLine: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
    usageName: { flex: 1, color: colors.foreground, fontSize: 11, ...font("semibold") },
    usageCount: { color: colors.primary, fontSize: 11, fontVariant: ["tabular-nums"], ...font("bold") },
    usageTrack: { height: 6, backgroundColor: colors.muted, borderRadius: 3, overflow: "hidden" },
    usageFill: { height: 6, borderRadius: 3 },
    auditRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
    auditDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
    pending: { color: colors.warning, fontSize: 10, ...font("bold") },
    status: { color: colors.primary, fontSize: 10, textTransform: "capitalize", ...font("bold") },
    emptyInline: { color: colors.mutedForeground, padding: 16, fontSize: 11, lineHeight: 17, ...font("regular") },
    errorCard: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginTop: 8 },
    errorText: { color: colors.destructive, fontSize: 12, lineHeight: 18, ...font("regular") },
    emptyTitle: { color: colors.foreground, fontSize: 22, marginTop: 16, textAlign: "center", ...font("heavy") },
    emptyBody: { color: colors.mutedForeground, fontSize: 14, lineHeight: 20, marginTop: 8, textAlign: "center", ...font("regular") },
  });
}
