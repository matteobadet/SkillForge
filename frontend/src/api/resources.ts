import { apiFetch, apiJson } from "./client";

export type ResourceType = "Skill" | "MCP" | "Agent";

export interface ResourceSummary {
  id: string;
  teamId: string;
  teamName: string;
  name: string;
  description: string | null;
  type: ResourceType;
  publisherPseudo: string;
  upvoteCount: number;
  upvotedByMe: boolean;
  iconPreset: string | null;
  iconUrl: string | null;
  createdAt: string;
}

export interface ResourceDetail extends ResourceSummary {
  updatedAt: string;
  canManage: boolean;
  canDelete: boolean;
}

export function publishResource(teamId: string, name: string, description: string, type: ResourceType, file: File, iconPreset?: string | null) {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("description", description);
  formData.append("type", type);
  formData.append("file", file);
  if (iconPreset) formData.append("iconPreset", iconPreset);
  return apiJson<ResourceDetail>(`/api/teams/${teamId}/resources`, { method: "POST", body: formData });
}

export function listTeamResources(teamId: string) {
  return apiJson<ResourceSummary[]>(`/api/teams/${teamId}/resources`);
}

export function listStoreResources() {
  return apiJson<ResourceSummary[]>("/api/resources");
}

export function getResource(id: string) {
  return apiJson<ResourceDetail>(`/api/resources/${id}`);
}

export function getDownloadUrl(id: string) {
  return apiJson<{ downloadUrl: string }>(`/api/resources/${id}/download`);
}

export interface ResourcePreview {
  available: boolean;
  fileName: string | null;
  content: string | null;
  truncated: boolean;
}

export function getResourcePreview(id: string) {
  return apiJson<ResourcePreview>(`/api/resources/${id}/preview`);
}

export function updateResource(id: string, patch: { name?: string; description?: string; iconPreset?: string; file?: File }) {
  const formData = new FormData();
  if (patch.name !== undefined) formData.append("name", patch.name);
  if (patch.description !== undefined) formData.append("description", patch.description);
  if (patch.iconPreset !== undefined) formData.append("iconPreset", patch.iconPreset);
  if (patch.file) formData.append("file", patch.file);
  return apiJson<ResourceDetail>(`/api/resources/${id}`, { method: "PATCH", body: formData });
}

export async function deleteResource(id: string) {
  const res = await apiFetch(`/api/resources/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("delete_failed");
}

export function toggleUpvote(id: string) {
  return apiJson<{ upvoteCount: number; upvotedByMe: boolean }>(`/api/resources/${id}/upvote`, { method: "POST" });
}

export async function uploadResourceIcon(id: string, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiFetch(`/api/resources/${id}/icon`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("upload_icon_failed");
  return (await res.json()) as ResourceDetail;
}
