# API Contract: Resources (`/api/teams/{teamId}/resources`, `/api/resources`)

Tous les endpoints requièrent `Authorization: Bearer <access_token>` (🔒).
Erreurs : `{ "error": "<code>", "message": "<texte>" }`.

## POST /api/teams/{teamId}/resources 🔒

Publie une ressource dans l'équipe `teamId` (l'appelant doit en être membre).

**Body**: `multipart/form-data` — champs `name`, `description` (optionnel),
`type` (`Skill` | `MCP` | `Agent`), `file` (archive `.zip`, ≤ 50 Mo)

**Responses**:
- `201 Created` → `ResourceDetailDto`
- `400 Bad Request` → nom manquant, type invalide, fichier absent/non-`.zip`/trop volumineux
- `403 Forbidden` → appelant non-membre de l'équipe
- `409 Conflict` → nom déjà utilisé dans cette équipe

## GET /api/teams/{teamId}/resources 🔒

Liste les ressources de l'équipe (si l'équipe est visible par l'appelant,
cf. contracts/teams-api.md).

**Responses**:
- `200 OK` → `ResourceSummaryDto[]`
- `404 Not Found` → équipe privée et appelant non-membre/non-Admin

## GET /api/resources 🔒

Vue "store" : toutes les ressources visibles par l'appelant, toutes équipes
confondues, triées par `createdAt` décroissant (FR-005).

**Responses**:
- `200 OK` → `ResourceSummaryDto[]`

## GET /api/resources/{id} 🔒

**Responses**:
- `200 OK` → `ResourceDetailDto` (si visible)
- `404 Not Found` → ressource inexistante ou équipe privée et appelant non-membre/non-Admin

## GET /api/resources/{id}/download 🔒

**Responses**:
- `200 OK` → `{ "downloadUrl": string }` (URL MinIO présignée, expire après 1h — même pattern que les avatars)
- `404 Not Found` → non visible

## PATCH /api/resources/{id} 🔒 (publieur ou owner d'équipe uniquement)

**Body**: `multipart/form-data` — champs optionnels `name`, `description`,
`file` (remplace l'archive si fourni)

**Responses**:
- `200 OK` → `ResourceDetailDto`
- `403 Forbidden` → ni publieur ni owner
- `409 Conflict` → nouveau nom déjà pris dans l'équipe

## DELETE /api/resources/{id} 🔒 (publieur ou owner d'équipe uniquement)

**Responses**:
- `204 No Content`
- `403 Forbidden` → ni publieur ni owner

## POST /api/resources/{id}/upvote 🔒

Bascule l'upvote de l'appelant sur cette ressource (FR-006).

**Responses**:
- `200 OK` → `{ "upvoteCount": number, "upvotedByMe": boolean }`
- `404 Not Found` → non visible

## DTOs

```json
// ResourceSummaryDto
{
  "id": "uuid",
  "teamId": "uuid",
  "teamName": "string",
  "name": "string",
  "description": "string | null",
  "type": "Skill | MCP | Agent",
  "publisherPseudo": "string",
  "upvoteCount": 0,
  "upvotedByMe": false,
  "createdAt": "ISO-8601"
}

// ResourceDetailDto (extends ResourceSummaryDto)
{
  "...ResourceSummaryDto",
  "updatedAt": "ISO-8601",
  "canManage": false
}
```
