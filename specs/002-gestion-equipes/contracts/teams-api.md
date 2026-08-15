# API Contract: Teams (`/api/teams`)

Tous les endpoints requièrent `Authorization: Bearer <access_token>` (🔒),
sauf mention contraire. Erreurs : `{ "error": "<code>", "message": "<texte>" }`.

## POST /api/teams 🔒

Crée une équipe ; l'appelant en devient `Owner`.

**Body**: `{ "name": string, "description"?: string, "visibility": "Public" | "Prive" }`

**Responses**:
- `201 Created` → `TeamDetailDto`
- `400 Bad Request` → nom manquant/vide, visibilité invalide

## GET /api/teams 🔒

Annuaire des équipes publiques (FR-007).

**Responses**:
- `200 OK` → `TeamSummaryDto[]`

## GET /api/teams/mine 🔒

Équipes dont l'appelant est membre (publiques et privées, FR-010b).

**Responses**:
- `200 OK` → `TeamSummaryDto[]` (inclut `myRole` pour chaque équipe)

## GET /api/teams/{id} 🔒

**Responses**:
- `200 OK` → `TeamDetailDto` (si publique, ou si l'appelant est membre/Admin)
- `404 Not Found` → équipe privée et appelant non-membre/non-Admin (le 404
  masque volontairement l'existence de l'équipe — pas de 403 qui
  confirmerait qu'elle existe)

## PATCH /api/teams/{id} 🔒 (Owner uniquement)

**Body** (champs optionnels): `{ "name"?: string, "description"?: string, "visibility"?: "Public" | "Prive" }`

**Responses**:
- `200 OK` → `TeamDetailDto`
- `403 Forbidden` → appelant non-owner

## DELETE /api/teams/{id} 🔒 (Owner uniquement)

**Responses**:
- `204 No Content`
- `403 Forbidden` → appelant non-owner

## POST /api/teams/{id}/leave 🔒

**Responses**:
- `204 No Content`
- `409 Conflict` → l'appelant est owner (doit supprimer l'équipe plutôt que
  la quitter, cf. FR-006)

## DELETE /api/teams/{id}/members/{userId} 🔒 (Owner uniquement)

**Responses**:
- `204 No Content`
- `403 Forbidden` → appelant non-owner
- `400 Bad Request` → tentative de retirer l'owner lui-même

## POST /api/teams/{id}/invite-link/regenerate 🔒 (Owner uniquement)

Révoque le lien actif (s'il existe) et en crée un nouveau.

**Responses**:
- `200 OK` → `{ "inviteUrl": string }`
- `403 Forbidden` → appelant non-owner

## GET /api/teams/{id}/invite-link 🔒 (Owner uniquement)

**Responses**:
- `200 OK` → `{ "inviteUrl": string | null }` (`null` si jamais généré)
- `403 Forbidden` → appelant non-owner

## POST /api/teams/join/{token} 🔒

Rejoint l'équipe associée à un jeton d'invitation valide (FR-004).

**Responses**:
- `200 OK` → `TeamDetailDto` (idempotent si déjà membre)
- `404 Not Found` → jeton invalide, révoqué

## DTOs

```json
// TeamSummaryDto
{
  "id": "uuid",
  "name": "string",
  "description": "string | null",
  "visibility": "Public | Prive",
  "memberCount": 0,
  "myRole": "Owner | Member | null"
}

// TeamDetailDto (extends TeamSummaryDto)
{
  "...TeamSummaryDto",
  "createdAt": "ISO-8601",
  "members": [
    { "userId": "uuid", "pseudo": "string", "avatarUrl": "string | null", "role": "Owner | Member" }
  ]
}
```
