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
  iconPreset: string | null;
  iconUrl: string | null;
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

export function createTeam(name: string, description: string, visibility: TeamVisibility, iconPreset?: string | null) {
  return apiJson<TeamDetail>("/api/teams", {
    method: "POST",
    body: JSON.stringify({ name, description: description || null, visibility, iconPreset: iconPreset ?? null }),
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

export function updateTeam(id: string, patch: Partial<{ name: string; description: string; visibility: TeamVisibility; iconPreset: string }>) {
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

export async function uploadTeamIcon(teamId: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch(`/api/teams/${teamId}/icon`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("upload_icon_failed");
  return (await res.json()) as TeamDetail;
}
