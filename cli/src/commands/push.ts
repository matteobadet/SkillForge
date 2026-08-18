import AdmZip from "adm-zip";
import { existsSync, lstatSync } from "node:fs";
import { ApiClient, CliError, describeError } from "../apiClient.js";
import type { ResourceType } from "../resourceTypeFolders.js";

interface ResourceSummary {
  id: string;
  name: string;
}

export interface PushOptions {
  name: string;
  type?: ResourceType;
  description?: string;
  note?: string;
}

function buildArchive(localPath: string): Buffer {
  const zip = new AdmZip();
  const stat = lstatSync(localPath);
  if (stat.isDirectory()) {
    zip.addLocalFolder(localPath);
  } else {
    zip.addLocalFile(localPath);
  }
  return zip.toBuffer();
}

export async function pushCommand(client: ApiClient, teamId: string, localPath: string, options: PushOptions): Promise<void> {
  if (!existsSync(localPath)) {
    throw new CliError(`Chemin introuvable : ${localPath}`);
  }

  const archive = buildArchive(localPath);
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(archive)], { type: "application/zip" }), "resource.zip");
  form.append("name", options.name);
  form.append("description", options.description ?? "");

  let existing: ResourceSummary | undefined;
  try {
    const teamResources = await client.requestJson<ResourceSummary[]>(`/api/teams/${teamId}/resources`);
    existing = teamResources.find((r) => r.name.toLowerCase() === options.name.toLowerCase());
  } catch (err) {
    if (err instanceof CliError) throw new CliError("Équipe introuvable ou non accessible.");
    throw err;
  }

  if (existing) {
    if (options.note) form.append("note", options.note);
    const res = await client.request(`/api/resources/${existing.id}`, { method: "PATCH", body: form });
    if (!res.ok) throw new CliError(await describeError(res));
    console.log(`Ressource "${options.name}" mise à jour.`);
  } else {
    if (!options.type) {
      throw new CliError('Nouvelle ressource : --type <Skill|MCP|Agent> est requis.');
    }
    form.append("type", options.type);
    const res = await client.request(`/api/teams/${teamId}/resources`, { method: "POST", body: form });
    if (!res.ok) throw new CliError(await describeError(res));
    console.log(`Ressource "${options.name}" publiée.`);
  }
}
