---
description: "Task list for feature implementation"
---

# Tasks: Publication / store de ressources

**Input**: Design documents from `/specs/003-publication-ressources/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/resources-api.md, quickstart.md

**Tests**: xUnit ciblés sur `ResourceService` (droits, visibilité, bascule d'upvote) en Polish.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Extension du monorepo existant : `backend/SkillForge.Api/`, `frontend/src/`.

---

## Phase 1: Setup

- [x] T001 [P] Créer `backend/SkillForge.Api/Models/Resource.cs` (enum `ResourceType`), `ResourceUpvote.cs` (champs selon data-model.md)
- [x] T002 [P] Créer `backend/SkillForge.Api/Models/Dtos/ResourceDtos.cs` (`ResourceSummaryDto`, `ResourceDetailDto`, `UpvoteResponse`)
- [x] T003 Ajouter `MINIO_BUCKET_RESOURCES` à `Options/MinioOptions.cs`, `.env.example`, `docker-compose.yml`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Généraliser le stockage MinIO, schéma de données, service de droits — bloquant pour toutes les user stories.

- [x] T004 Renommer/généraliser `backend/SkillForge.Api/Services/AvatarStorageService.cs` en `ObjectStorageService.cs` paramétré par bucket (cf. research.md #1) : `EnsureBucketExistsAsync(bucket)`, `UploadAsync(bucket, objectKey, stream, size, contentType)`, `GetPresignedUrlAsync(bucket, objectKey)`, `DeleteAsync(bucket, objectKey)`
- [x] T005 Mettre à jour `backend/SkillForge.Api/Controllers/UsersController.cs` pour utiliser `ObjectStorageService` avec le bucket `avatars` (remplace les appels à l'ancien `AvatarStorageService`)
- [x] T006 Mettre à jour `backend/SkillForge.Api/Program.cs` : enregistrer `ObjectStorageService`, créer le bucket `resources` au démarrage (même mécanisme que `avatars`)
- [x] T007 Ajouter les `DbSet<Resource>`, `DbSet<ResourceUpvote>` et leurs contraintes (unique `(TeamId, Name)`, unique `(ResourceId, UserId)`) dans `backend/SkillForge.Api/Data/AppDbContext.cs`
- [x] T008 Générer la migration `dotnet ef migrations add AddResources` dans `backend/SkillForge.Api/Data/Migrations/`
- [x] T009 Créer `backend/SkillForge.Api/Services/ResourceService.cs` : création (validation appartenance équipe), requêtes de visibilité filtrées (réutilise le pattern de `TeamService.VisibleTeamsQuery`, cf. research.md #5), vérification droits d'écriture (publieur OU owner d'équipe), bascule d'upvote
- [x] T010 [P] Créer `frontend/src/api/resources.ts` : fonctions typées `publishResource`, `listTeamResources`, `listStoreResources`, `getResource`, `getDownloadUrl`, `updateResource`, `deleteResource`, `toggleUpvote`

---

## Phase 3: User Story 1 - Publier une ressource (Priority: P1) 🎯 MVP

**Goal**: Un membre d'équipe publie une ressource avec une archive ZIP.

**Independent Test**: `POST /api/teams/{teamId}/resources` par un membre, puis vérifier qu'elle apparaît dans `GET /api/teams/{teamId}/resources` (cf. quickstart.md, User Story 1).

- [x] T011 [US1] Créer `backend/SkillForge.Api/Controllers/ResourcesController.cs` avec `POST /api/teams/{teamId}/resources` (403 si non-membre, 400 si fichier absent/non-.zip/>50 Mo, 409 si nom déjà pris dans l'équipe)
- [x] T012 [US1] Ajouter `GET /api/teams/{teamId}/resources` dans `ResourcesController.cs` (404 si équipe privée et appelant non-membre/non-Admin)
- [x] T013 [US1] Créer `frontend/src/pages/PublishResourcePage.tsx` (formulaire nom/description/type/fichier, route `/teams/:teamId/resources/new`)
- [x] T014 [US1] Ajouter la liste des ressources et le lien "Publier une ressource" dans `frontend/src/pages/TeamPage.tsx` (visible seulement si l'appelant est membre)
- [x] T015 [US1] Câbler la route `/teams/:teamId/resources/new` (protégée) dans `frontend/src/main.tsx`

**Checkpoint**: US1 testable de bout en bout indépendamment.

---

## Phase 4: User Story 2 - Télécharger une ressource (Priority: P1)

**Goal**: Télécharger l'archive d'une ressource visible ; refus (404) sinon.

**Independent Test**: `GET /api/resources/{id}/download` par un membre/équipe publique (200) puis par un non-membre d'équipe privée (404) (cf. quickstart.md, User Story 2).

- [x] T016 [US2] Ajouter `GET /api/resources/{id}` et `GET /api/resources/{id}/download` dans `ResourcesController.cs`, appuyés sur les requêtes filtrées de `ResourceService`
- [x] T017 [US2] Créer `frontend/src/pages/ResourcePage.tsx` (détail, bouton télécharger qui ouvre `downloadUrl`)
- [x] T018 [US2] Câbler la route `/resources/:id` (protégée) dans `frontend/src/main.tsx`

**Checkpoint**: US2 testable de bout en bout (nécessite US1 pour avoir une ressource).

---

## Phase 5: User Story 3 - Parcourir le store (Priority: P2)

**Goal**: Vue transverse de toutes les ressources visibles par l'appelant.

**Independent Test**: `GET /api/resources` liste les ressources des équipes publiques + des équipes privées de l'appelant, aucune autre (cf. quickstart.md, User Story 3).

- [x] T019 [US3] Ajouter `GET /api/resources` dans `ResourcesController.cs` (tri par `createdAt` décroissant, réutilise `ResourceService`)
- [x] T020 [US3] Créer `frontend/src/pages/StorePage.tsx` (liste globale, lien vers chaque `ResourcePage`)
- [x] T021 [US3] Câbler la route `/store` (protégée, page d'accueil après connexion) dans `frontend/src/main.tsx` ; ajouter le lien "Store" dans la nav de `frontend/src/pages/ProfilePage.tsx`

**Checkpoint**: Store navigable de bout en bout.

---

## Phase 6: User Story 4 - Upvoter une ressource (Priority: P2)

**Goal**: Bascule d'upvote sur une ressource visible ; refus sur ressource non visible.

**Independent Test**: Upvote deux fois de suite (ajout puis retrait), vérifier le compteur (cf. quickstart.md, User Story 4).

- [x] T022 [US4] Ajouter `POST /api/resources/{id}/upvote` dans `ResourcesController.cs`
- [x] T023 [US4] Ajouter le bouton upvote (avec compteur) dans `frontend/src/pages/ResourcePage.tsx` et `frontend/src/pages/StorePage.tsx`

**Checkpoint**: Upvote fonctionnel de bout en bout.

---

## Phase 7: User Story 5 - Mettre à jour ou supprimer une ressource (Priority: P3)

**Goal**: Le publieur ou l'owner d'équipe modifie/supprime une ressource ; refus sinon.

**Independent Test**: PATCH/DELETE par le publieur (200/204), par l'owner (200/204), par un autre membre (403) (cf. quickstart.md, User Story 5).

- [x] T024 [US5] Ajouter `PATCH /api/resources/{id}` et `DELETE /api/resources/{id}` dans `ResourcesController.cs` (403 si ni publieur ni owner, 409 si nouveau nom déjà pris)
- [x] T025 [US5] Ajouter les actions "Modifier"/"Supprimer" dans `frontend/src/pages/ResourcePage.tsx` (visibles seulement si `canManage`)

**Checkpoint**: Cycle de vie complet d'une ressource (publier → mettre à jour → supprimer).

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T026 [P] Ajouter `backend/SkillForge.Api.Tests/ResourceServiceTests.cs` : droits d'écriture (publieur/owner/autre), bascule d'upvote idempotente dans les deux sens, filtrage de visibilité (équipe privée absente pour un non-membre)
- [x] T027 Vérifier qu'aucune ressource d'équipe privée ne fuite dans `GET /api/resources` ni `GET /api/resources/{id}` pour un utilisateur non-membre/non-Admin (test dédié SC-003)
- [x] T028 Mettre à jour `README.md` (racine) : cocher la feature 003 dans le tableau roadmap

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2** : bloquant (la généralisation du stockage, T004-T006, est un prérequis partagé).
- **Phase 3 (US1)** : dépend de Phase 2. MVP minimal de cette feature.
- **Phase 4 (US2)** : dépend de US1 (il faut une ressource à télécharger).
- **Phase 5 (US3)** : dépend de Phase 2 uniquement ; peut avancer en parallèle de US1/US2 côté backend, mais son test manuel complet nécessite des ressources existantes.
- **Phase 6 (US4)** : dépend de US1 (il faut une ressource à upvoter).
- **Phase 7 (US5)** : dépend de US1.
- **Phase 8 (Polish)** : après toutes les user stories.

## Parallel Execution Examples

- Phase 1 : T001, T002 en parallèle (fichiers distincts) ; T003 indépendant.
- Phase 2 : T004-T006 (stockage) séquentiels entre eux (même fichier `Program.cs` touché par T006 après T004) ; T007-T009 (données) peuvent avancer en parallèle du frontend T010.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2)** : publier et
télécharger une ressource — cœur fonctionnel du "store".

**Incrément recommandé pour une démo complète** : US1 → US2 → US3 (store) →
US4 (upvote) → US5 (gestion) → Polish, avant de considérer la feature 003
validée (cf. constitution, principe I).
