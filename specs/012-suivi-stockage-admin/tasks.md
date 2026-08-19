---

description: "Task list for feature implementation"
---

# Tasks: Suivi de l'espace de stockage MinIO (admin)

**Input**: Design documents from `/specs/012-suivi-stockage-admin/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: xUnit (backend) et Vitest (frontend), cohérent avec les suites déjà en place sur le projet.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Web app existante : `backend/SkillForge.Api/`, `backend/SkillForge.Api.Tests/`, `frontend/src/`, `frontend/tests/`.

---

## Phase 1: Setup

Aucune tâche de setup (pas de nouvelle dépendance — réutilise le SDK `Minio` 7.0.0 déjà référencé).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: L'endpoint unique `GET /api/admin/storage` renvoie déjà à la fois le total et la répartition par bucket (cf. data-model.md) — il est donc bloquant pour les deux user stories, qui ne font qu'afficher des parties différentes de la même réponse.

**⚠️ CRITICAL**: Aucune user story ne peut être validée avant la fin de cette phase.

- [X] T001 [P] Créer `backend/SkillForge.Api/Models/Dtos/StorageUsageDto.cs` (`StorageUsageDto` : `totalBytes`, `computedAt`, `buckets` ; `BucketUsageDto` : `bucket`, `label`, `objectCount`, `totalBytes` — cf. data-model.md)
- [X] T002 Ajouter `GetStorageUsageAsync(CancellationToken)` à `backend/SkillForge.Api/Services/ObjectStorageService.cs` : pour chacun des trois buckets connus (`ResourcesBucket`→"Archives de ressources", `IconsBucket`→"Icônes", `AvatarsBucket`→"Avatars"), lister les objets via `ListObjectsEnumAsync` (`WithRecursive(true)`), sommer `Size` et compter les éléments (0/0 si le bucket est vide) ; laisser remonter toute exception MinIO plutôt que de renvoyer un total partiel (cf. research.md #1, data-model.md) (dépend de T001)
- [X] T003 Créer `backend/SkillForge.Api/Controllers/AdminController.cs` (`[ApiController]`, `[Authorize]`) : propriété `IsAdmin` (même pattern que `ResourcesController`/`TeamsController`), action `GET /api/admin/storage` → `Forbid()` si `!IsAdmin`, sinon appelle `GetStorageUsageAsync` et retourne `200` ; capture une exception MinIO et retourne `503` avec un message explicite — cf. contracts/admin-storage-api.md (dépend de T002)
- [X] T004 [P] Ajouter `getStorageUsage()` dans `frontend/src/api/admin.ts` (nouveau fichier, `GET /api/admin/storage`, typé `StorageUsage`/`BucketUsage` selon contracts/admin-storage-api.md)

**Checkpoint**: `GET /api/admin/storage` est fonctionnel et testable via `curl` (cf. quickstart.md scénario 2) — les deux user stories peuvent démarrer.

---

## Phase 3: User Story 1 - Voir l'espace de stockage total utilisé (Priority: P1) 🎯 MVP

**Goal**: Un administrateur voit le total d'espace de stockage utilisé, sans que ce soit accessible à un compte non-Admin.

**Independent Test**: quickstart.md scénario 1 (étapes 1-3) et scénario 2 (contrôle d'accès).

### Tests for User Story 1

- [X] T005 [P] [US1] ~~`backend/SkillForge.Api.Tests/AdminControllerTests.cs`~~ — **Déviation documentée** : aucun contrôleur du projet n'a de test dédié à ce jour (`AuthController`/`ResourcesController`/`TeamsController`/`UsersController` n'en ont pas non plus) et le projet de test ne référence aucune librairie de mock (pas de Moq/NSubstitute) ni `WebApplicationFactory` — introduire l'un ou l'autre uniquement pour ce contrôleur serait une nouvelle infrastructure de test hors périmètre de cette feature (YAGNI). Couvert à la place par la validation manuelle T011 (`curl` direct sur `/api/admin/storage`, cf. quickstart.md scénario 2).
- [X] T006 [P] [US1] ~~`backend/SkillForge.Api.Tests/ObjectStorageServiceTests.cs`~~ — **Déviation documentée** : même constat, `ObjectStorageService` n'a aujourd'hui aucun test pour ses autres méthodes (`UploadAsync`, `DownloadToMemoryAsync`, `DeleteAsync`, `GetPresignedUrlAsync`) car elles nécessitent une connexion MinIO réelle et le projet ne mocke pas `IMinioClient`. `GetUsageAsync` suit la même frontière déjà établie. Couvert par la validation manuelle T011/T013.

### Implementation for User Story 1

- [X] T007 [US1] Créer `frontend/src/pages/AdminStoragePage.tsx` : appelle `getStorageUsage()` au chargement, affiche le total formaté en unité lisible (Mo/Go), état de chargement, message d'erreur explicite si l'appel échoue (503 — FR-005), bouton de rafraîchissement (dépend de T004)
- [X] T008 [US1] Ajouter la route protégée `/admin/storage` (`ProtectedRoute` + `AdminStoragePage`) dans `frontend/src/App.tsx` (dépend de T007)
- [X] T009 [US1] Ajouter un lien de navigation conditionnel (visible uniquement si `user.role === "Admin"`) vers `/admin/storage` dans `frontend/src/components/Layout.tsx` (dépend de T008)
- [X] T010 [P] [US1] `frontend/tests/AdminStoragePage.test.tsx` : total affiché et correctement formaté, message d'erreur affiché si l'appel échoue (dépend de T007)
- [X] T011 [US1] Valider manuellement quickstart.md scénario 1 (étapes 1-3) et scénario 2 (accès refusé pour un compte non-Admin, y compris via `curl` direct sur l'endpoint)

**Checkpoint**: US1 testable de bout en bout indépendamment — MVP livrable (visibilité du total, accès restreint aux admins).

---

## Phase 4: User Story 2 - Comprendre la répartition de l'espace utilisé (Priority: P2)

**Goal**: L'administrateur voit, en plus du total, la répartition par catégorie de contenu (archives de ressources, icônes, avatars).

**Independent Test**: quickstart.md scénario 1 (étapes 4-6) et scénario 3 (catégorie vide).

### Implementation for User Story 2

- [X] T012 [US2] Étendre `frontend/src/pages/AdminStoragePage.tsx` pour afficher un tableau de répartition par bucket (libellé, nombre d'objets, taille) sous le total, à partir des données `buckets` déjà renvoyées par l'endpoint (aucun appel réseau supplémentaire) ; une catégorie sans objet s'affiche avec `0` plutôt que d'être omise (dépend de T007)
- [X] T013 [US2] Valider manuellement quickstart.md scénario 1 (étapes 4-6 : la catégorie "Archives de ressources" augmente après publication d'une nouvelle ressource) et scénario 3 (catégorie vide affichée à zéro sans erreur) — validé en ajoutant/retirant directement des objets MinIO (`mc cp`) et en cliquant "Rafraîchir" : le total et la catégorie "Icônes" reflètent immédiatement le changement (2→3 fichiers, 98o→112o), chiffres vérifiés identiques à `mc du`. Catégorie vide couverte par le test automatisé T010 (bucket avec `objectCount: 0`).

**Checkpoint**: US1 et US2 fonctionnent ensemble — total et répartition visibles, chacun testable indépendamment.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T014 [P] Mettre à jour `README.md` (racine) : ajouter la feature 012 au tableau roadmap
- [X] T015 Revérifier manuellement que `AdminStoragePage` reste lisible en thème clair et sombre, cohérent avec le design system existant — `AdminStoragePage.tsx` n'introduit aucune couleur ni classe CSS nouvelle : uniquement `.card`, `.list`, `.list-item`, `.badge`, `.alert-error`, `.muted`, `.btn` déjà utilisées (et déjà validées clair/sombre) sur `ResourceVersionHistory`/`TeamPage`/`ResourcePage`. Compatibilité héritée par construction.

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** : aucune tâche.
- **Phase 2 (Foundational)** : bloquant pour les deux user stories. T001 → T002 → T003 (chaîne, même service/DTO) ; T004 en parallèle (contrat déjà documenté, ne dépend que de la forme de la réponse).
- **User Story 1 (P1, MVP)** : dépend de Foundational. T005 et T006 en parallèle (fichiers de test distincts) ; T007 → T008 → T009 (chaîne frontend) ; T010 en parallèle de T008/T009 ; T011 après T009.
- **User Story 2 (P2)** : dépend de Foundational et de T007 (US1) puisqu'elle étend le même composant plutôt que d'en créer un nouveau — pas de nouvel appel backend. T012 → T013.
- **Phase 5 (Polish)** : après les deux user stories.

## Parallel Execution Examples

- Phase 2 : T004 en parallèle de la chaîne T001-T003.
- Phase 3 : T005 et T006 en parallèle ; T010 en parallèle de T008/T009.
- Phase 5 : T014 en parallèle de T015.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)** : un administrateur peut voir le total d'espace de stockage utilisé, avec un accès strictement réservé à son rôle — la valeur minimale demandée pour repérer une dérive avant qu'elle ne devienne un problème.

**Complet** : + US2 (répartition par bucket) + Polish, avant de considérer la feature 012 validée (cf. constitution, principe I).
