# skillforge-cli

CLI de synchronisation manuelle pour [SkillForge](../README.md) : connecte
un dossier Claude local (`~/.claude` par défaut) aux Skills/MCP/Agents
publiés dans les équipes d'une instance SkillForge.

## Installation

```bash
npm install -g @matteobadet/skillforge-cli
```

La commande installée s'appelle `skillforge` (seul le nom du paquet npm est
scopé, pas la commande).

## Installation (développement local du CLI)

Pour travailler sur le CLI lui-même plutôt que l'installer depuis npm :

```bash
cd cli
npm install
npm run build
npm link   # rend la commande "skillforge" disponible globalement
```

## Commandes

### `skillforge login`

Invite email + mot de passe, stocke la session dans
`~/.skillforge/credentials.json`.

### `skillforge logout`

Supprime la session locale.

### `skillforge teams [--json]`

Liste les équipes dont vous êtes membre (nom + identifiant, nécessaire pour
`pull`/`push`). `--json` sort un tableau JSON brut, pratique pour scripter
une synchronisation multi-équipes (voir
[examples/hooks/session-start-sync](../examples/hooks/session-start-sync)).

### `skillforge pull <teamId> [--dir <chemin>]`

Télécharge et décompresse toutes les ressources visibles de l'équipe dans
`<dir>/skills|mcp|agents/<nom-ressource>/` (`~/.claude` par défaut, remplace
tout dossier local existant du même nom).

### `skillforge push <teamId> <chemin> --name <nom> [--type <Skill|MCP|Agent>] [--description <texte>] [--note <texte>]`

Compresse `<chemin>` (fichier ou dossier) et publie une nouvelle ressource,
ou met à jour celle existante du même nom dans l'équipe. `--type` est requis
uniquement pour une nouvelle ressource. Chaque remplacement d'archive
devient une nouvelle version consultable/téléchargeable individuellement
sur la page de la ressource — l'historique n'est jamais écrasé. `--note`
(300 caractères max) décrit ce qui a changé dans cette version ; ignoré
lors d'une première publication (il n'y a rien à décrire par rapport à une
version antérieure).

### Options globales

- `--api-url <url>` : cible une autre instance SkillForge (sinon
  `SKILLFORGE_API_URL`, sinon `http://localhost:5080`).

## Exemple

```bash
skillforge login
skillforge teams
skillforge push <TEAM_ID> ./mon-skill --name "Mon Skill" --type Skill
skillforge pull <TEAM_ID> --dir ~/.claude
```
