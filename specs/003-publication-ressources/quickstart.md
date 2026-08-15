# Quickstart: Publication / store de ressources

Prérequis : stack démarrée, un utilisateur connecté (`ACCESS_TOKEN`) membre
d'une équipe (`TEAM_ID`, cf. feature 002).

## User Story 1 — Publier une ressource

```bash
echo "contenu factice" > skill.txt && zip test-skill.zip skill.txt

curl -s -X POST http://localhost:5080/api/teams/$TEAM_ID/resources \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -F "name=Mon Skill" -F "description=Un skill de test" -F "type=Skill" \
  -F "file=@test-skill.zip;type=application/zip"
# -> 201, ResourceDetailDto
```

## User Story 2 — Télécharger

```bash
curl -s http://localhost:5080/api/resources/$RESOURCE_ID/download \
  -H "Authorization: Bearer $ACCESS_TOKEN_2"
# -> 200 { "downloadUrl": "..." } si visible, 404 sinon (équipe privée, non-membre)
```

## User Story 3 — Store transverse

```bash
curl -s http://localhost:5080/api/resources -H "Authorization: Bearer $ACCESS_TOKEN"
# -> liste des ressources visibles, triées par date décroissante
```

## User Story 4 — Upvote (bascule)

```bash
curl -s -X POST http://localhost:5080/api/resources/$RESOURCE_ID/upvote -H "Authorization: Bearer $ACCESS_TOKEN_2"
# -> { "upvoteCount": 1, "upvotedByMe": true }
curl -s -X POST http://localhost:5080/api/resources/$RESOURCE_ID/upvote -H "Authorization: Bearer $ACCESS_TOKEN_2"
# -> { "upvoteCount": 0, "upvotedByMe": false }
```

## User Story 5 — Mise à jour / suppression

```bash
curl -s -o /dev/null -w "%{http_code}\n" -X PATCH http://localhost:5080/api/resources/$RESOURCE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN_2" -F "name=Nouveau nom"
# -> 403 si ni publieur ni owner

curl -s -o /dev/null -w "%{http_code}\n" -X DELETE http://localhost:5080/api/resources/$RESOURCE_ID \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# -> 204 si publieur ou owner
```
