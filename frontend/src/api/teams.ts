import { apiFetch, apiJson } from "./client";

export type TeamVisibility = "Public" | "Prive";
export type TeamRole = "Owner" | "Member";

export interface TeamSummary {
  id: string;
  name: string;
  description: string | null;
  visibility: TeamVisibility;
  memberCount: number;
  myRole: TeamRole | null;
}

export interface TeamMember {
  userId: string;
  pseudo: string;
  avatarUrl: string | null;
  role: TeamRole;
}

export interface TeamDetail extends TeamSummary {
  createdAt: string;
  members: TeamMember[];
}

export function createTeam(name: string, description: string, visibility: TeamVisibility) {
  return apiJson<TeamDetail>("/api/teams", {
    method: "POST",
    body: JSON.stringify({ name, description: description || null, visibility }),
  });
}

export function listPublicTeams() {
  return apiJson<TeamSummary[]>("/api/teams");
}

export function listMyTeams() {
  return apiJson<TeamSummary[]>("/api/teams/mine");
}

export function getTeam(id: string) {
  return apiJson<TeamDetail>(`/api/teams/${id}`);
}

export function updateTeam(id: string, patch: Partial<{ name: string; description: string; visibility: TeamVisibility }>) {
  return apiJson<TeamDetail>(`/api/teams/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
}

export async function deleteTeam(id: string) {
  const res = await apiFetch(`/api/teams/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete_failed");
}

export async function leaveTeam(id: string) {
  const res = await apiFetch(`/api/teams/${id}/leave`, { method: "POST" });
  if (!res.ok) throw new Error("leave_failed");
}

export async function removeMember(teamId: string, userId: string) {
  const res = await apiFetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("remove_member_failed");
}

export function getInviteLink(teamId: string) {
  return apiJson<{ inviteUrl: string | null }>(`/api/teams/${teamId}/invite-link`);
}

export function regenerateInviteLink(teamId: string) {
  return apiJson<{ inviteUrl: string | null }>(`/api/teams/${teamId}/invite-link/regenerate`, { method: "POST" });
}

export function joinTeam(token: string) {
  return apiJson<TeamDetail>(`/api/teams/join/${token}`, { method: "POST" });
}
