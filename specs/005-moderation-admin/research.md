# Phase 0 Research: Modération admin

Aucune ambiguïté produit restante (scope déjà validé en amont). Deux
décisions techniques mineures.

## 1. Séparer droit d'édition et droit de suppression

- **Decision**: le champ `ResourceDetailDto.CanManage` (édition, PATCH)
  reste réservé au publieur/owner ; un nouveau champ `CanDelete` (=
  `CanManage OR compte Admin`) pilote l'affichage du bouton de suppression
  côté frontend. Côté backend, `ResourcesController.Delete` autorise
  explicitly `CanManageAsync(...) || IsAdmin`, sans toucher à `Update`
  (PATCH), qui reste strictement `CanManageAsync(...)`.
- **Rationale**: correspond exactement à FR-002 (la modération Admin est un
  droit de suppression, pas un droit d'édition de contenu tiers) ; éviter
  de réutiliser `CanManage` tel quel pour la suppression aurait
  silencieusement élargi aussi les droits d'édition d'un Admin, non
  souhaité.
- **Alternatives considered**: un seul champ `CanManage` couvrant les deux
  actions pour un Admin — rejeté, contredit FR-002 explicitement validé.

## 2. Annuaire des équipes : réutiliser le filtrage existant

- **Decision**: `TeamService.ListPublicTeamsAsync()` est remplacé par
  `ListDirectoryTeamsAsync(bool isAdmin)`, qui renvoie soit `db.Teams`
  (Admin) soit `db.Teams.Where(Visibility == Public)` (sinon) — même
  logique conditionnelle que `VisibleTeamsQuery` déjà utilisée pour
  `GET /api/teams/{id}` et `GET /api/teams/mine`, simplement appliquée à
  l'endpoint d'annuaire qui ne le faisait pas encore.
- **Rationale**: corrige l'écart identifié avec FR-008 de la feature 002 en
  restant cohérent avec le pattern déjà en place ailleurs dans
  `TeamService`, plutôt que d'introduire une nouvelle façon de filtrer.
- **Alternatives considered**: garder deux endpoints séparés
  (`/api/teams` public-only et un nouvel `/api/teams/all` réservé Admin) —
  rejeté, complexifie l'API pour un besoin que le filtrage conditionnel
  couvre déjà simplement (principe Scope Discipline).

**Output**: aucune inconnue technique ne subsiste.
