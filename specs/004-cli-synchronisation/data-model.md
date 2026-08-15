# Data Model: CLI de synchronisation

Aucune entité serveur nouvelle (cf. spec.md FR-008). Uniquement des
structures locales côté CLI.

## Credentials (fichier local `~/.skillforge/credentials.json`)

| Champ | Type | Description |
|---|---|---|
| `apiUrl` | string | URL de base de l'API utilisée lors du `login` (permet de changer d'instance en refaisant un `login`) |
| `accessToken` | string | JWT access token courant |
| `refreshToken` | string | Refresh token courant (remplacé à chaque rotation, cf. feature 001) |

## Config résolue (en mémoire, par commande)

| Champ | Source | Défaut |
|---|---|---|
| `apiUrl` | flag `--api-url` \| env `SKILLFORGE_API_URL` \| `credentials.apiUrl` | `http://localhost:5080` |
| `targetDir` | flag `--dir` | `~/.claude` |

## Résultat d'une commande `pull`

Pas de structure persistée — effet de bord uniquement : pour chaque
ressource retournée par `GET /api/teams/{teamId}/resources`, téléchargement
de l'archive (`GET /api/resources/{id}/download`) et extraction dans
`<targetDir>/<dossier-type>/<nom-ressource>/` (remplace le dossier existant
s'il y en a un).
