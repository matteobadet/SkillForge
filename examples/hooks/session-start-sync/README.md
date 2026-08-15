# Hook Claude Code : sync auto des équipes SkillForge

À l'ouverture d'une session Claude Code (hook `SessionStart`), synchronise
toutes les équipes SkillForge dont vous êtes membre, chacune dans son propre
sous-dossier :

```text
<SKILLFORGE_SYNC_DIR>/
  <Nom équipe 1>/
    skills/...
    mcp/...
    agents/...
  <Nom équipe 2>/
    ...
```

C'est une ressource comme une autre publiée dans une équipe SkillForge :
`skillforge pull` la récupère au même titre qu'un Skill/MCP/Agent, chaque
membre l'installe ensuite chez lui — rien n'est partagé côté identifiants ou
configuration globale.

## Installation (par personne, une fois)

1. Avoir le CLI `skillforge` installé et être connecté : `skillforge login`.
2. Récupérer ce dossier (`skillforge pull <teamId>` une fois publié, cf.
   plus bas), et copier `sync-teams.mjs` où vous voulez (ex.
   `~/CLAUDE/sync-teams.mjs`).
3. (Optionnel) Définir `SKILLFORGE_SYNC_DIR` pour choisir le dossier cible —
   par défaut `~/Desktop/CLAUDE` (`%USERPROFILE%\Desktop\CLAUDE` sous
   Windows).
4. Copier le contenu de `settings.snippet.json` dans votre
   `~/.claude/settings.json` (fusionner la clé `hooks.SessionStart` si elle
   existe déjà), en adaptant le chemin vers votre copie de
   `sync-teams.mjs`.

À la prochaine ouverture de Claude Code, la synchronisation se lance
automatiquement et silencieusement (elle n'interrompt jamais le démarrage,
même en cas d'erreur réseau ou de session expirée).

## Publier ce hook dans une équipe SkillForge

Depuis la racine du dépôt SkillForge :

```bash
skillforge push <TEAM_ID> ./examples/hooks/session-start-sync \
  --name "Hook auto-pull (SessionStart)" \
  --type Skill \
  --description "Synchronise automatiquement toutes vos équipes SkillForge à l'ouverture de Claude Code."
```

(`Skill` est le type le plus proche disponible — SkillForge n'a pas de
catégorie dédiée aux hooks, et ça n'en vaut pas la peine pour un seul
exemple.)

Chaque coéquipier peut ensuite faire `skillforge pull <TEAM_ID>` pour le
récupérer et suivre l'installation ci-dessus.
