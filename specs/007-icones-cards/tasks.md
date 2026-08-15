---
description: "Task list for feature implementation"
---

# Tasks: Icônes équipes/ressources et affichage en cards

**Input**: Design documents from `/specs/007-icones-cards/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/icons-api-delta.md, quickstart.md

**Tests**: xUnit pour la logique d'exclusivité preset/upload et les droits.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Extension du monorepo existant : `backend/SkillForge.Api/`, `frontend/src/`.

---

## Phase 1: Setup

- [x] T001 Ajouter `MINIO_BUCKET_ICONS` à `Options/MinioOptions.cs`, `.env.example`, `docker-compose.yml`
- [x] T002 [P] Créer `frontend/src/icons/presets.ts` : palette ~20 icônes `lucide-react` (cf. research.md #1), mapping type de ressource → icône par défaut, icône par défaut équipe

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schéma de données et bucket — bloquant pour toutes les user stories.

- [x] T003 Ajouter `IconPreset`/`IconObjectKey` à `backend/SkillForge.Api/Models/Team.cs` et `Resource.cs`
- [x] T004 Générer la migration `dotnet ef migrations add AddIcons` dans `backend/SkillForge.Api/Data/Migrations/`
- [x] T005 Mettre à jour `backend/SkillForge.Api/Program.cs` : créer le bucket `icons` au démarrage (même mécanisme que `avatars`/`resources`)
- [x] T006 [P] Ajouter `SetIconPresetAsync(entity, preset)`/`SetIconObjectKeyAsync(entity, key)` (exclusivité mutuelle, cf. research.md #2) dans `backend/SkillForge.Api/Services/TeamService.cs` et `ResourceService.cs`

---

## Phase 3: User Story 1 - Choisir une icône de palette (Priority: P1) 🎯 MVP

**Goal**: `iconPreset` acceptable à la création/modification d'équipe et de ressource, exposé dans les DTOs.

**Independent Test**: cf. quickstart.md, User Story 1.

- [x] T007 [US1] Ajouter `iconPreset`/`iconUrl` à `TeamSummaryDto`/`TeamDetailDto` (`backend/SkillForge.Api/Models/Dtos/TeamDtos.cs`) et calculer `iconUrl` dans `TeamsController`
- [x] T008 [US1] Accepter `iconPreset` dans `CreateTeamRequest`/`UpdateTeamRequest` et l'appliquer via `TeamService` dans `TeamsController.Create`/`Update` (validation contre la palette connue → 400 sinon)
- [x] T009 [US1] [P] Mêmes changements pour `ResourceSummaryDto`/`ResourceDetailDto`, `ResourcesController.Publish`/`Update` (`backend/SkillForge.Api/Models/Dtos/ResourceDtos.cs`, `ResourcesController.cs`)
- [x] T010 [US1] Créer `frontend/src/components/IconPicker.tsx` : grille de boutons palette (contrôlée, `value: {preset?: string; file?: File}`)
- [x] T011 [US1] Intégrer `IconPicker` (mode palette) dans `frontend/src/pages/CreateTeamPage.tsx` et `PublishResourcePage.tsx`, envoyer `iconPreset` avec la requête de création
- [x] T012 [US1] Afficher l'icône choisie (ou par défaut) en en-tête de `frontend/src/pages/TeamPage.tsx` et `ResourcePage.tsx`

**Checkpoint**: US1 testable de bout en bout indépendamment.

---

## Phase 4: User Story 2 - Uploader sa propre icône (Priority: P2)

**Goal**: Upload d'image en alternative à la palette, exclusivité respectée.

**Independent Test**: cf. quickstart.md, User Story 2.

- [x] T013 [US2] Ajouter `POST /api/teams/{id}/icon` dans `TeamsController.cs` (Owner uniquement, valide type/taille, appelle `ObjectStorageService` + `TeamService.SetIconObjectKeyAsync`)
- [x] T014 [US2] [P] Ajouter `POST /api/resources/{id}/icon` dans `ResourcesController.cs` (publieur/owner uniquement, même logique)
- [x] T015 [US2] Ajouter le mode upload dans `IconPicker.tsx` (`<input type="file">`, mutuellement exclusif avec la sélection palette dans l'état local du composant)
- [x] T016 [US2] Câbler l'upload d'icône dans `frontend/src/pages/TeamPage.tsx` et `ResourcePage.tsx` (section Gestion, appelle le nouvel endpoint, gère le cas création avec upload immédiat après création — cf. research.md #4)

**Checkpoint**: US2 testable de bout en bout (dépend de US1 pour l'affichage).

---

## Phase 5: User Story 3 - Cards dans Store/annuaire/ressources d'équipe (Priority: P1)

**Goal**: Remplacer les listes par des grilles de cards avec icône.

**Independent Test**: cf. quickstart.md, User Story 3.

- [x] T017 [P] [US3] Ajouter les classes `.card-grid`/`.icon-card`/`.icon-circle` à `frontend/src/index.css` (cf. research.md #5)
- [x] T018 [US3] Restyler `frontend/src/pages/StorePage.tsx` en grille de cards (icône, nom, équipe, publieur, upvotes, type)
- [x] T019 [US3] [P] Restyler `frontend/src/pages/TeamsDirectoryPage.tsx` en grille de cards (icône, nom, visibilité, membres)
- [x] T020 [US3] [P] Restyler la section "Ressources" de `frontend/src/pages/TeamPage.tsx` en grille de cards (même présentation que le Store)

**Checkpoint**: Les 3 vues concernées utilisent des cards avec icône.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T021 [P] Ajouter des tests xUnit (`TeamServiceTests.cs`/`ResourceServiceTests.cs`) : définir un preset efface un object key existant et vice versa (SC-002) ; droits de modification d'icône (SC-003)
- [x] T022 Corriger le fallback avatar cassé constaté lors de l'audit visuel (feature 006) : ajouter un `onError` sur les `<img className="avatar">` (Profile/TeamPage) qui bascule sur les initiales plutôt qu'une image vide
- [x] T023 Revérifier manuellement via l'extension Chrome (captures d'écran) que le bug de bouton hors formulaire (icône collée au texte) constaté lors de l'audit est bien résolu partout, pas seulement sur la page corrigée en premier
- [x] T024 Mettre à jour `README.md` (racine) : ajouter la feature 007 au tableau roadmap (post-MVP)

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2** : bloquant.
- **Phase 3 (US1)** : dépend de Phase 2. MVP minimal.
- **Phase 4 (US2)** : dépend de US1 (affichage de l'icône déjà en place).
- **Phase 5 (US3)** : dépend de Phase 2 uniquement (a besoin des champs icône dans les DTOs, pas forcément de l'UI de sélection) ; peut avancer en parallèle de US1/US2 côté CSS/structure, mais son rendu complet dépend de T007/T009 (DTOs).
- **Phase 6 (Polish)** : après toutes les user stories.

## Parallel Execution Examples

- Phase 2 : T003 (deux entités) puis T006 en parallèle par service.
- Phase 3 : T007 et T009 en parallèle (Team vs Resource, fichiers distincts).
- Phase 5 : T017 puis T018/T019/T020 en parallèle (pages distinctes).

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 5 (US3)** : icônes de
palette + affichage en cards — répond à la demande visuelle principale.

**Complet** : + US2 (upload) + Polish, avant de considérer la feature 007
validée (cf. constitution, principe I).
