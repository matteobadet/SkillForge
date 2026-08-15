#!/usr/bin/env node
import { Command } from "commander";
import { resolveApiUrl, resolveTargetDir } from "./config.js";
import { ApiClient, CliError } from "./apiClient.js";
import { loginCommand } from "./commands/login.js";
import { logoutCommand } from "./commands/logout.js";
import { teamsCommand } from "./commands/teams.js";
import { pullCommand } from "./commands/pull.js";
import { pushCommand } from "./commands/push.js";
import { isResourceType } from "./resourceTypeFolders.js";

const program = new Command();

program
  .name("skillforge")
  .description("CLI de synchronisation SkillForge (login, pull, push)")
  .option("--api-url <url>", "URL de l'API SkillForge");

program
  .command("login")
  .description("Se connecter à SkillForge")
  .action(async () => {
    await loginCommand(resolveApiUrl(program.opts().apiUrl));
  });

program
  .command("logout")
  .description("Supprimer la session locale")
  .action(() => {
    logoutCommand();
  });

program
  .command("teams")
  .description("Lister mes équipes")
  .action(async () => {
    const apiUrl = resolveApiUrl(program.opts().apiUrl);
    await teamsCommand(new ApiClient(apiUrl));
  });

program
  .command("pull <teamId>")
  .description("Télécharger les ressources d'une équipe vers le dossier local")
  .option("--dir <chemin>", "Dossier cible (défaut : ~/.claude)")
  .action(async (teamId: string, opts: { dir?: string }) => {
    const apiUrl = resolveApiUrl(program.opts().apiUrl);
    await pullCommand(new ApiClient(apiUrl), teamId, resolveTargetDir(opts.dir));
  });

program
  .command("push <teamId> <chemin>")
  .description("Publier ou mettre à jour une ressource depuis un chemin local")
  .requiredOption("--name <nom>", "Nom de la ressource")
  .option("--type <type>", "Type (Skill|MCP|Agent) — requis pour une nouvelle ressource")
  .option("--description <texte>", "Description")
  .action(async (teamId: string, chemin: string, opts: { name: string; type?: string; description?: string }) => {
    const apiUrl = resolveApiUrl(program.opts().apiUrl);
    if (opts.type && !isResourceType(opts.type)) {
      throw new CliError("Type invalide : utilisez Skill, MCP ou Agent.");
    }
    await pushCommand(new ApiClient(apiUrl), teamId, chemin, {
      name: opts.name,
      type: opts.type as "Skill" | "MCP" | "Agent" | undefined,
      description: opts.description,
    });
  });

program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof CliError) {
    console.error(err.message);
    process.exit(err.exitCode);
  }
  console.error("Erreur inattendue :", err instanceof Error ? err.message : err);
  process.exit(1);
});
