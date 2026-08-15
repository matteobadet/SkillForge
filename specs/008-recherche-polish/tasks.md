---
description: "Task list for feature implementation"
---

# Tasks: Recherche/filtres et corrections de champs

**Input**: Design documents from `/specs/008-recherche-polish/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Vitest pour `lib/filter.ts` (fonctions pures).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Frontend uniquement : `frontend/src/`.

---

## Phase 1: Setup

Aucune tâche de setup (pas de nouvelle dépendance).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Corriger le sélecteur CSS — bloquant pour User Story 1, sans quoi les corrections ponctuelles de type="text" resteraient fragiles.

- [x] T001 Élargir le sélecteur d'input dans `frontend/src/index.css` (cf. research.md #1) : `input:not([type='checkbox']):not([type='radio']):not([type='file']):not([type='range'])`

---

## Phase 3: User Story 1 - Corriger le style des champs de texte (Priority: P1) 🎯 MVP

**Goal**: Tous les champs de texte sans `type` explicite héritent du style du design system.

**Independent Test**: cf. quickstart.md, User Story 1/2 (étape 1).

- [x] T002 [P] [US1] Ajouter `type="text"` explicite sur les inputs Nom de `frontend/src/pages/CreateTeamPage.tsx`, `TeamPage.tsx`, `PublishResourcePage.tsx`, `ResourcePage.tsx`
- [x] T003 [P] [US1] Ajouter `type="text"` explicite sur l'input Pseudo de `frontend/src/pages/ProfilePage.tsx`

**Checkpoint**: US1 testable de bout en bout indépendamment (le fix CSS de Phase 2 suffit déjà seul, T002/T003 sont un renfort de bonne pratique).

---

## Phase 4: User Story 2 - Corriger le style des champs de fichier (Priority: P2)

**Goal**: Upload avatar/archive avec une présentation stylée cohérente.

**Independent Test**: cf. quickstart.md, User Story 1/2 (étape 2).

- [x] T004 [US2] Créer `frontend/src/components/FileInput.tsx` (extrait du motif `IconPicker`, cf. research.md #2)
- [x] T005 [P] [US2] Utiliser `FileInput` dans `frontend/src/pages/ProfilePage.tsx` (upload avatar)
- [x] T006 [P] [US2] Utiliser `FileInput` dans `frontend/src/pages/PublishResourcePage.tsx` (upload archive)

**Checkpoint**: US2 testable de bout en bout indépendamment.

---

## Phase 5: User Story 3 - Recherche/filtre Store (Priority: P1)

**Goal**: Recherche texte + filtre type sur le Store, combinables.

**Independent Test**: cf. quickstart.md, User Story 3.

- [x] T007 [US3] Créer `frontend/src/lib/filter.ts` : `filterResources(resources, { query, type })` (cf. research.md #3)
- [x] T008 [US3] Ajouter le champ de recherche + le filtre type dans `frontend/src/pages/StorePage.tsx`, message "Aucun résultat" distinct de "Aucune ressource"

**Checkpoint**: US3 testable de bout en bout indépendamment.

---

## Phase 6: User Story 4 - Recherche annuaire équipes (Priority: P1)

**Goal**: Recherche texte sur l'annuaire des équipes, appliquée aux deux sections.

**Independent Test**: cf. quickstart.md, User Story 4.

- [x] T009 [US4] Ajouter `filterTeams(teams, { query })` dans `frontend/src/lib/filter.ts`
- [x] T010 [US4] Ajouter le champ de recherche dans `frontend/src/pages/TeamsDirectoryPage.tsx`, appliqué à "Mes équipes" et "Équipes publiques"

**Checkpoint**: US4 testable de bout en bout indépendamment.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T011 [P] Ajouter `frontend/tests/filter.test.ts` : `filterResources`/`filterTeams` (recherche seule, filtre seul, combinés, insensible à la casse, terme vide)
- [x] T012 Revérifier manuellement via l'extension Chrome que les 5 champs texte et les 2 champs fichier sont visuellement corrigés
- [x] T013 Mettre à jour `README.md` (racine) : ajouter la feature 008 au tableau roadmap (post-MVP)

---

## Dependencies & Execution Order

- **Phase 2** : bloquant pour Phase 3 en pratique (le fix CSS résout déjà visuellement US1 ; T002/T003 sont indépendants et peuvent suivre).
- **Phase 3 (US1)**, **Phase 4 (US2)**, **Phase 5 (US3)**, **Phase 6 (US4)** : toutes indépendantes entre elles (fichiers distincts), peuvent être menées dans n'importe quel ordre après Phase 2.
- **Phase 7 (Polish)** : après toutes les user stories.

## Parallel Execution Examples

- Phase 3 : T002 et T003 en parallèle.
- Phase 4 : T005 et T006 en parallèle (après T004).
- Phases 3-6 : entièrement parallélisables entre elles (aucun fichier partagé, hors `lib/filter.ts` partagé par T007/T009 — à séquencer entre eux).

## Implementation Strategy

**MVP = Phase 2 + Phase 3** : corrige le bug le plus visible et le plus
simple.

**Complet** : + US2 (fichiers) + US3/US4 (recherche/filtre) + Polish, avant
de considérer la feature 008 validée (cf. constitution, principe I).
