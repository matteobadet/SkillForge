#!/usr/bin/env node
// Appelé par un hook Claude Code "SessionStart". Synchronise toutes les
// équipes SkillForge de l'utilisateur connecté (skillforge login) dans
// <SKILLFORGE_SYNC_DIR>/<Nom de l'équipe>/{skills,mcp,agents}/...
import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const baseDir = process.env.SKILLFORGE_SYNC_DIR || join(homedir(), "Desktop", "CLAUDE");

// Liste blanche stricte (lettres/chiffres/espace/underscore/point/tiret) : le
// nom d'équipe vient d'autres membres et peut circuler dans une commande
// shell (cf. shell:true ci-dessous) — on exclut donc tout métacaractère de
// shell (&, |, ;, $, `, etc.), pas seulement les caractères invalides pour
// un chemin Windows.
function sanitize(name) {
  const cleaned = name.replace(/[^\p{L}\p{N} _.-]/gu, "_").trim();
  return cleaned || "equipe";
}

// Sur Windows, le binaire global npm "skillforge" est un shim .cmd, que
// execFileSync ne peut spawn qu'avec shell:true (sinon EINVAL). Sûr ici
// uniquement parce que tous les arguments passés (GUID d'équipe, chemin
// passé par sanitize()) sont exempts de métacaractères shell.
const useShell = process.platform === "win32";

let teams;
try {
  const teamsJson = execFileSync("skillforge", ["teams", "--json"], { encoding: "utf8", shell: useShell });
  teams = JSON.parse(teamsJson);
} catch (err) {
  console.error("skillforge sync-teams: impossible de lister les équipes (êtes-vous connecté ? `skillforge login`)");
  process.exit(0); // ne bloque jamais le démarrage de Claude Code
}

for (const team of teams) {
  const target = join(baseDir, sanitize(team.name));
  mkdirSync(target, { recursive: true });
  try {
    execFileSync("skillforge", ["pull", team.id, "--dir", target], { stdio: "inherit", shell: useShell });
  } catch (err) {
    console.error(`skillforge sync-teams: échec de la synchronisation de "${team.name}", ignorée.`);
  }
}
