import type { ResourceSummary, ResourceType } from "../api/resources";
import type { TeamSummary } from "../api/teams";

export interface ResourceFilter {
  query: string;
  type: ResourceType | "";
}

export function filterResources(resources: ResourceSummary[], { query, type }: ResourceFilter): ResourceSummary[] {
  const q = query.trim().toLowerCase();
  return resources.filter((r) => {
    if (type && r.type !== type) return false;
    if (!q) return true;
    return (
      r.name.toLowerCase().includes(q) ||
      r.teamName.toLowerCase().includes(q) ||
      r.publisherPseudo.toLowerCase().includes(q) ||
      (r.description ?? "").toLowerCase().includes(q)
    );
  });
}

export interface TeamFilter {
  query: string;
}

export function filterTeams(teams: TeamSummary[], { query }: TeamFilter): TeamSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return teams;
  return teams.filter((t) => t.name.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q));
}
