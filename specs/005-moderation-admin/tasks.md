---
description: "Task list for feature implementation"
---

# Tasks: Modération admin

**Input**: Design documents from `/specs/005-moderation-admin/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/admin-moderation-delta.md, quickstart.md

**Tests**: xUnit, extension des suites existantes.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Extension du monorepo existant : `backend/SkillForge.Api/`, `frontend/src/`.

---

## Phase 1: Setup

Aucune tâche de setup — extension de code existant uniquement (pas de
nouvelle dépendance, pas de migration).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Corriger la méthode de service partagée par l'annuaire — bloquant pour User Story 2.

- [x] T001 Remplacer `ListPublicTeamsAsync()` par `ListDirectoryTeamsAsync(bool isAdmin)` dans `backend/SkillForge.Api/Services/TeamService.cs` (cf. research.md #2)

---

## Phase 3: User Story 1 - Un Admin supprime n'importe quelle ressource (Priority: P1) 🎯 MVP

**Goal**: `DELETE /api/resources/{id}` autorisé pour un Admin même sans être publieur/owner ; `PATCH` reste refusé.

**Independent Test**: cf. quickstart.md, User Story 1.

- [x] T002 [US1] Modifier `ResourcesController.Delete` dans `backend/SkillForge.Api/Controllers/ResourcesController.cs` : autoriser aussi `IsAdmin` (en plus de `CanManageAsync`), sans toucher à `Update`
- [x] T003 [US1] Ajouter le champ `CanDelete` à `ResourceDetailDto` (`backend/SkillForge.Api/Models/Dtos/ResourceDtos.cs`) et le calculer dans `ResourcesController.ToDetailDtoAsync` (`CanManage || IsAdmin`, cf. data-model.md)
- [x] T004 [US1] Mettre à jour `frontend/src/api/resources.ts` (`ResourceDetail.canDelete`) et `frontend/src/pages/ResourcePage.tsx` (bouton "Supprimer" visible si `canDelete`, formulaire d'édition toujours conditionné à `canManage`)

**Checkpoint**: US1 testable de bout en bout indépendamment.

---

## Phase 4: User Story 2 - Un Admin voit toutes les équipes dans l'annuaire (Priority: P2)

**Goal**: `GET /api/teams` renvoie toutes les équipes pour un Admin.

**Independent Test**: cf. quickstart.md, User Story 2.

- [x] T005 [US2] Mettre à jour `TeamsController.ListPublic` (`backend/SkillForge.Api/Controllers/TeamsController.cs`) pour appeler `teamService.ListDirectoryTeamsAsync(IsAdmin)` (cf. T001)

**Checkpoint**: US2 testable de bout en bout indépendamment (ne dépend pas de US1).

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T006 [P] Étendre `backend/SkillForge.Api.Tests/ResourceServiceTests.cs` ou ajouter un test dédié : `CanManageAsync` reste `false` pour un Admin non-publieur/non-owner (confirme que la dérogation Admin est bien gérée au niveau contrôleur, pas dans le service, cf. research.md #1)
- [x] T007 [P] Étendre `backend/SkillForge.Api.Tests/TeamServiceTests.cs` : `ListDirectoryTeamsAsync(isAdmin: true)` renvoie équipes publiques + privées ; `ListDirectoryTeamsAsync(isAdmin: false)` ne renvoie que les publiques
- [x] T008 Mettre à jour `README.md` (racine) : cocher la feature 005 dans le tableau roadmap — dernière feature du MVP

---

## Dependencies & Execution Order

- **Phase 2** : bloquant pour Phase 4 (US2) uniquement — US1 n'en dépend pas.
- **Phase 3 (US1)** et **Phase 4 (US2)** sont indépendantes l'une de l'autre (fichiers différents : `ResourcesController.cs`/`ResourceDtos.cs` vs `TeamsController.cs`/`TeamService.cs`) et peuvent être développées dans n'importe quel ordre ou en parallèle.
- **Phase 5 (Polish)** : après les deux user stories.

## Parallel Execution Examples

- Phase 3 (US1) et Phase 4 (US2) entièrement parallélisables (aucun fichier partagé).
- Phase 5 : T006 et T007 en parallèle (fichiers de test distincts).

## Implementation Strategy

**MVP = Phase 2 + Phase 3 (US1)** : capacité de modération effective
(suppression de contenu tiers par un Admin) — le cœur de cette dernière
feature.

**Complet** : US1 + US2 + Polish, ce qui clôt l'intégralité du périmètre
MVP défini dans le brief initial (cf. constitution, principe I).
