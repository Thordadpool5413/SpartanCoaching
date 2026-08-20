import { apiGet, apiPatch, apiPost, type OrgMemberSummary } from "@/lib/api";

export type OrgBranchSummary = {
  id: number;
  name: string;
  code?: string | null;
  status: string;
};

export type OrgTeamSummary = {
  id: number;
  name: string;
  branchId?: number | null;
  status: string;
};

export type OrgStructuredMember = OrgMemberSummary & {
  branchId?: number | null;
  teamId?: number | null;
  managerMemberId?: number | null;
};

export type OrgAuditEvent = {
  id: number;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  createdAt: string;
};

export type OrgAdminProfile = {
  id: number;
  name: string;
  type: string;
  status: string;
  seatLimit: number;
  billableSeats?: number | null;
  billingPlan?: string | null;
  billingStatus?: string | null;
  activeMembers: number;
  contractRef?: string | null;
};

export async function fetchOrgAdminDetail() {
  const [profile, structure, audit] = await Promise.all([
    apiGet<{ organization: OrgAdminProfile }>("/api/org/profile"),
    apiGet<{
      branches: OrgBranchSummary[];
      teams: OrgTeamSummary[];
      members: OrgStructuredMember[];
    }>("/api/org/structure"),
    apiGet<{ events: OrgAuditEvent[] }>("/api/org/audit"),
  ]);
  return {
    profile: profile.organization,
    branches: structure.branches || [],
    teams: structure.teams || [],
    members: structure.members || [],
    audit: audit.events || [],
  };
}

export async function setOrganizationMemberRole(memberId: number, role: "member" | "org_admin") {
  return apiPost<{ ok: boolean }>(`/api/org/members/${memberId}/role`, { role });
}

export async function offboardOrganizationMember(memberId: number, note = "Offboarded from iOS organization admin") {
  return apiPost<{ ok: boolean }>(`/api/org/members/${memberId}/offboard`, { note });
}

export async function assignOrganizationMember(
  memberId: number,
  input: { branchId?: number | null; teamId?: number | null; managerMemberId?: number | null },
) {
  return apiPatch<{ ok: boolean }>(`/api/org/members/${memberId}/assignment`, input);
}

export async function createOrganizationBranch(name: string) {
  return apiPost<{ ok: boolean; branch: OrgBranchSummary }>("/api/org/branches", { name: name.trim() });
}

export async function createOrganizationTeam(name: string, branchId?: number | null) {
  return apiPost<{ ok: boolean; team: OrgTeamSummary }>("/api/org/teams", {
    name: name.trim(),
    branchId: branchId ?? null,
  });
}
