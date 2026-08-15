# Data Model: Modération admin

Aucune nouvelle entité ni migration. Extension des règles d'autorisation
sur les entités existantes (`Resource`, feature 003 ; `Team`, feature 002).

## Résumé des règles d'autorisation modifiées

| Action | Avant (features 002/003) | Après (cette feature) |
|---|---|---|
| `DELETE /api/resources/{id}` | Publieur OU owner d'équipe | Publieur OU owner d'équipe OU **Admin** |
| `PATCH /api/resources/{id}` | Publieur OU owner d'équipe | Inchangé (Admin non inclus, cf. FR-002) |
| `GET /api/teams` (annuaire) | Équipes `Public` uniquement | Équipes `Public` uniquement, **sauf pour un Admin : toutes les équipes** |
| `GET /api/teams/{id}`, `GET /api/teams/mine`, `GET /api/resources`, `GET /api/resources/{id}` | Déjà dérogatoires pour Admin (features 002/003) | Inchangé |

## ResourceDetailDto (champ ajouté)

| Champ | Type | Description |
|---|---|---|
| `canDelete` | bool | `true` si l'appelant est publieur, owner de l'équipe, ou Admin. Distinct de `canManage` (édition, inchangé). |
