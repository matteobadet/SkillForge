import { describe, expect, it } from "vitest";
import { filterResources, filterTeams } from "../src/lib/filter";
import type { ResourceSummary } from "../src/api/resources";
import type { TeamSummary } from "../src/api/teams";

function makeResource(overrides: Partial<ResourceSummary>): ResourceSummary {
  return {
    id: "r1",
    teamId: "t1",
    teamName: "Les Copains",
    name: "Mon Skill",
    description: null,
    type: "Skill",
    publisherPseudo: "ami1",
    upvoteCount: 0,
    upvotedByMe: false,
    iconPreset: null,
    iconUrl: null,
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeTeam(overrides: Partial<TeamSummary>): TeamSummary {
  return {
    id: "t1",
    name: "Les Copains",
    description: null,
    visibility: "Public",
    memberCount: 1,
    myRole: null,
    iconPreset: null,
    iconUrl: null,
    ...overrides,
  };
}

describe("filterResources", () => {
  const resources = [
    makeResource({ id: "1", name: "Analyseur JSON", teamName: "Devs", publisherPseudo: "alice", type: "Skill" }),
    makeResource({ id: "2", name: "Serveur MCP Fichiers", teamName: "Infra", publisherPseudo: "bob", type: "MCP" }),
    makeResource({ id: "3", name: "Agent Support", teamName: "Devs", publisherPseudo: "alice", type: "Agent" }),
  ];

  it("returns all resources when query and type are empty", () => {
    expect(filterResources(resources, { query: "", type: "" })).toHaveLength(3);
  });

  it("filters by name, case-insensitive", () => {
    const result = filterResources(resources, { query: "json", type: "" });
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("filters by team name", () => {
    const result = filterResources(resources, { query: "infra", type: "" });
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("filters by publisher", () => {
    const result = filterResources(resources, { query: "alice", type: "" });
    expect(result.map((r) => r.id).sort()).toEqual(["1", "3"]);
  });

  it("filters by description", () => {
    const withDescription = [
      makeResource({ id: "1", name: "Analyseur JSON", description: "Parse et valide du JSON" }),
      makeResource({ id: "2", name: "Serveur MCP Fichiers", description: null }),
    ];
    const result = filterResources(withDescription, { query: "valide", type: "" });
    expect(result.map((r) => r.id)).toEqual(["1"]);
  });

  it("filters by type alone", () => {
    const result = filterResources(resources, { query: "", type: "MCP" });
    expect(result.map((r) => r.id)).toEqual(["2"]);
  });

  it("combines query and type (intersection)", () => {
    const result = filterResources(resources, { query: "alice", type: "Agent" });
    expect(result.map((r) => r.id)).toEqual(["3"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterResources(resources, { query: "zzz", type: "" })).toHaveLength(0);
  });
});

describe("filterTeams", () => {
  const teams = [
    makeTeam({ id: "1", name: "Les Copains Devs" }),
    makeTeam({ id: "2", name: "Secret Team" }),
  ];

  it("returns all teams when query is empty", () => {
    expect(filterTeams(teams, { query: "" })).toHaveLength(2);
  });

  it("filters by name, case-insensitive", () => {
    const result = filterTeams(teams, { query: "SECRET" });
    expect(result.map((t) => t.id)).toEqual(["2"]);
  });

  it("filters by description", () => {
    const withDescription = [
      makeTeam({ id: "1", name: "Les Copains Devs", description: "Backend et infra" }),
      makeTeam({ id: "2", name: "Secret Team", description: null }),
    ];
    const result = filterTeams(withDescription, { query: "infra" });
    expect(result.map((t) => t.id)).toEqual(["1"]);
  });

  it("returns empty array when nothing matches", () => {
    expect(filterTeams(teams, { query: "zzz" })).toHaveLength(0);
  });
});
