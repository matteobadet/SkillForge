# API Contract Delta: Icônes

Étend contracts/teams-api.md (feature 002) et contracts/resources-api.md
(feature 003).

## POST /api/teams 🔒 et PATCH /api/teams/{id} 🔒

**Body** (champ ajouté, optionnel) : `iconPreset?: string` (doit
correspondre à un identifiant de la palette connue, sinon 400). Le
définir efface un éventuel `iconObjectKey` existant (et supprime l'objet
MinIO correspondant).

## POST /api/teams/{id}/icon 🔒 (nouveau, Owner uniquement)

**Body**: `multipart/form-data`, champ `file` (jpeg/png/webp, ≤ 2 Mo)

**Responses**:
- `200 OK` → `TeamDetailDto` mis à jour (`iconObjectKey` défini, `iconPreset` effacé)
- `400 Bad Request` → fichier absent/format/taille invalide
- `403 Forbidden` → appelant non-owner

## POST /api/teams/{teamId}/resources 🔒 et PATCH /api/resources/{id} 🔒

**Body** (champ ajouté, optionnel dans le `multipart/form-data` existant) :
`iconPreset?: string`. Même règle d'exclusivité que pour les équipes.

## POST /api/resources/{id}/icon 🔒 (nouveau, publieur ou owner d'équipe)

**Body**: `multipart/form-data`, champ `file` (jpeg/png/webp, ≤ 2 Mo)

**Responses**:
- `200 OK` → `ResourceDetailDto` mis à jour
- `400 Bad Request` → fichier invalide
- `403 Forbidden` → ni publieur ni owner (Admin exclu, cf. data-model.md)

## DTOs (champs ajoutés)

```json
// TeamSummaryDto / TeamDetailDto / ResourceSummaryDto / ResourceDetailDto
{
  "...": "champs existants",
  "iconPreset": "string | null",
  "iconUrl": "string | null"
}
```

`iconUrl` est calculé côté serveur (URL présignée) si `icon_object_key` est
défini ; sinon `null` (le frontend résout l'icône par défaut/preset via
`iconPreset` ou le type de ressource).
