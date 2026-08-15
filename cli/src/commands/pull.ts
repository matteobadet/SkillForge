import AdmZip from "adm-zip";
import { mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { ApiClient, CliError } from "../apiClient.js";
import { folderForType, isResourceType, slugify } from "../resourceTypeFolders.js";

interface ResourceSummary {
  id: string;
  name: string;
  type: string;
}

export async function pullCommand(client: ApiClient, teamId: string, targetDir: string): Promise<void> {
  let resources: ResourceSummary[];
  try {
    resources = await client.requestJson<ResourceSummary[]>(`/api/teams/${teamId}/resources`);
  } catch (err) {
    if (err instanceof CliError) throw new CliError("Équipe introuvable ou non accessible.");
    throw err;
  }

  for (const resource of resources) {
    if (!isResourceType(resource.type)) continue;

    const { downloadUrl } = await client.requestJson<{ downloadUrl: string }>(`/api/resources/${resource.id}/download`);
    const archiveRes = await fetch(downloadUrl);
    if (!archiveRes.ok) {
      console.warn(`  ! Échec du téléchargement de "${resource.name}", ignorée.`);
      continue;
    }
    const buffer = Buffer.from(await archiveRes.arrayBuffer());

    const destination = join(targetDir, folderForType(resource.type), slugify(resource.name));
    rmSync(destination, { recursive: true, force: true });
    mkdirSync(destination, { recursive: true });
    new AdmZip(buffer).extractAllTo(destination, true);
  }

  console.log(`${resources.length} ressource(s) synchronisée(s) dans ${targetDir}.`);
}
