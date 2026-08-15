# Quickstart: Modération admin

Prérequis : stack démarrée, un compte promu `Admin` en base (cf.
[001-socle-auth-bdd/quickstart.md](../001-socle-auth-bdd/quickstart.md#bootstrap-du-premier-compte-admin-fr-012)) :

```sql
UPDATE users SET "Role" = 'Admin' WHERE "Email" = 'admin@example.com';
```

## User Story 1 — Suppression de contenu tiers par un Admin

```bash
# Connexion Admin
ADMIN_TOKEN=$(curl -s -X POST http://localhost:5080/api/auth/login \
  -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"..."}' \
  | python -c "import sys,json;print(json.load(sys.stdin)['accessToken'])")

# Suppression d'une ressource publiée par un autre utilisateur, équipe dont l'Admin n'est pas membre
curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:5080/api/resources/$RESOURCE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# -> 204

# L'Admin ne peut PAS éditer ce même contenu tiers (FR-002)
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:5080/api/resources/$OTHER_RESOURCE_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" -F "name=Modifie par admin"
# -> 403
```

## User Story 2 — Annuaire complet pour un Admin

```bash
curl -s http://localhost:5080/api/teams -H "Authorization: Bearer $ADMIN_TOKEN" | python -m json.tool
# -> inclut les équipes privées

curl -s http://localhost:5080/api/teams -H "Authorization: Bearer $USER_TOKEN" | python -m json.tool
# -> équipes publiques uniquement (comportement inchangé)
```
