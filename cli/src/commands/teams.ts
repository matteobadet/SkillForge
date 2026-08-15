import { ApiClient } from "../apiClient.js";

interface TeamSummary {
  id: string;
  name: string;
  visibility: "Public" | "Prive";
}

export async function teamsCommand(client: ApiClient, opts: { json?: boolean } = {}): Promise<void> {
  const teams = await client.requestJson<TeamSummary[]>("/api/teams/mine");

  if (opts.json) {
    console.log(JSON.stringify(teams));
    return;
  }

  if (teams.length === 0) {
    console.log("Aucune équipe.");
    return;
  }

  console.log("ID                                   | Nom                  | Visibilité");
  console.log("-".repeat(70));
  for (const t of teams) {
    console.log(`${t.id} | ${t.name.padEnd(20)} | ${t.visibility === "Public" ? "Publique" : "Privée"}`);
  }
}
