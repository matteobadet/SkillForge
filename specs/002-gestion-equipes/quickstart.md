# Quickstart: Gestion des équipes

Prérequis : stack démarrée (`docker compose up`, cf. feature 001) et un
utilisateur connecté (`ACCESS_TOKEN`).

## User Story 1 — Créer une équipe

```bash
curl -s -X POST http://localhost:5080/api/teams \
  -H "Authorization: Bearer $ACCESS_TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Les Copains Devs","description":"Notre équipe","visibility":"Public"}'
# -> 201, TeamDetailDto avec members=[{..., role:"Owner"}]
```

## User Story 2 — Rejoindre via lien d'invitation

```bash
# En tant qu'owner : récupérer/générer le lien
curl -s -X POST http://localhost:5080/api/teams/$TEAM_ID/invite-link/regenerate \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# -> 200 { "inviteUrl": "http://localhost:5173/invite/<token>" }

# En tant qu'un autre utilisateur connecté (ACCESS_TOKEN_2) :
curl -s -X POST http://localhost:5080/api/teams/join/<token> \
  -H "Authorization: Bearer $ACCESS_TOKEN_2"
# -> 200, TeamDetailDto avec l'utilisateur listé en Member
```

## User Story 3 — Gérer membres et lien

```bash
# Retirer un membre (owner uniquement)
curl -s -X DELETE http://localhost:5080/api/teams/$TEAM_ID/members/$USER_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# -> 204

# Un non-owner tente de régénérer le lien -> 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5080/api/teams/$TEAM_ID/invite-link/regenerate \
  -H "Authorization: Bearer $ACCESS_TOKEN_2"
```

## User Story 4 — Annuaire des équipes publiques

```bash
curl -s http://localhost:5080/api/teams -H "Authorization: Bearer $ACCESS_TOKEN_2"
# -> 200, liste incluant l'équipe publique créée ci-dessus

curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5080/api/teams/$PRIVATE_TEAM_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN_2"
# -> 404 pour une équipe privée dont ACCESS_TOKEN_2 n'est pas membre
```

## User Story 5 — Quitter une équipe

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5080/api/teams/$TEAM_ID/leave \
  -H "Authorization: Bearer $ACCESS_TOKEN_2"
# -> 204

# L'owner ne peut pas quitter
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5080/api/teams/$TEAM_ID/leave \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# -> 409
```
