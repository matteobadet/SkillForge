# CLI Contract: Commandes `skillforge`

## `skillforge login`

Invite interactive email + mot de passe (masqué). Appelle `POST
/api/auth/login`. Écrit `~/.skillforge/credentials.json`.

- Succès : `Connecté en tant que <pseudo>.` — code de sortie 0.
- Échec (401) : `Email ou mot de passe incorrect.` — code de sortie 1.

## `skillforge logout`

Supprime `~/.skillforge/credentials.json` s'il existe. Toujours code 0.

## `skillforge teams`

Appelle `GET /api/teams/mine`. Affiche un tableau `ID | Nom | Visibilité`.

- Échec (401, pas de session) : `Non connecté. Lancez "skillforge login".` — code 1.

## `skillforge pull <teamId> [--dir <chemin>] [--api-url <url>]`

Appelle `GET /api/teams/{teamId}/resources`, puis pour chaque ressource
`GET /api/resources/{id}/download`, télécharge et extrait dans
`<dir>/<type>/<nom>/`.

- Succès : `N ressource(s) synchronisée(s) dans <dir>.` — code 0.
- Équipe non visible (404) : `Équipe introuvable ou non accessible.` — code 1.

## `skillforge push <teamId> <chemin> --name <nom> --type <Skill|MCP|Agent> [--description <texte>]`

Compresse `<chemin>` (fichier ou dossier) en `.zip` en mémoire/temporaire.
Cherche une ressource existante de ce nom via `GET
/api/teams/{teamId}/resources` :
- Absente → `POST /api/teams/{teamId}/resources` (création).
- Présente → `PATCH /api/resources/{id}` avec la nouvelle archive (mise à
  jour).

- Succès (création) : `Ressource "<nom>" publiée.` — code 0.
- Succès (mise à jour) : `Ressource "<nom>" mise à jour.` — code 0.
- Droits insuffisants (403) : `Vous n'avez pas le droit de publier/modifier cette ressource.` — code 1.
- Chemin local introuvable : `Chemin introuvable : <chemin>` — code 1.

## Options globales

- `--api-url <url>` : surcharge ponctuelle de l'URL de l'API (sinon
  `SKILLFORGE_API_URL`, sinon celle stockée au login, sinon
  `http://localhost:5080`).
- `--dir <chemin>` (pour `pull`) : dossier cible (sinon `~/.claude`).
