---
description: "Task list for feature implementation"
---

# Tasks: Passe de style UI

**Input**: Design documents from `/specs/006-design-ui/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Aucun nouveau test — les suites existantes (Vitest, xUnit)
doivent continuer de passer sans modification de leur intention (FR-005).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Frontend uniquement : `frontend/src/`.

---

## Phase 1: Setup

- [x] T001 Ajouter `lucide-react` aux dépendances de `frontend/package.json`
- [x] T002 Supprimer `frontend/src/App.css` (contenu par défaut Vite, non utilisé)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Design system et composant de navigation — bloquant pour toutes les pages.

- [x] T003 Réécrire `frontend/src/index.css` : variables CSS (couleurs, typographie, espacement, rayons, ombres, cf. research.md #2-3), styles de base (body, headings, links), classes partagées (`.btn`, `.btn-primary`, `.btn-danger`, `.card`, `.field`, `.alert`, `.alert-error`, `.list`, `.badge`)
- [x] T004 Créer `frontend/src/components/Layout.tsx` : nav supérieure fixe avec icônes `lucide-react` (Store, Users, User, LogOut), lien actif visuellement distingué (`useLocation`), enveloppe `children` dans un conteneur stylé

---

## Phase 3: User Story 1 - Navigation cohérente avec icônes (Priority: P1) 🎯 MVP

**Goal**: Menu à icônes visible et fonctionnel sur toutes les pages authentifiées.

**Independent Test**: cf. quickstart.md, User Story 1.

- [x] T005 [US1] Modifier `frontend/src/App.tsx` : envelopper les routes authentifiées (`/profile`, `/store`, `/teams`, `/teams/new`, `/teams/:id`, `/teams/:teamId/resources/new`, `/resources/:id`, `/invite/:token`) dans `<Layout>` via `ProtectedRoute`
- [x] T006 [US1] Retirer les `<nav>` ad hoc précédemment ajoutées dans `frontend/src/pages/ProfilePage.tsx`, `StorePage.tsx`, `TeamsDirectoryPage.tsx` (remplacées par `Layout`)

**Checkpoint**: US1 testable de bout en bout indépendamment (navigation visible et fonctionnelle, même si les pages ne sont pas encore restylées en détail).

---

## Phase 4: User Story 2 - Habillage visuel cohérent (Priority: P1)

**Goal**: Les 10 pages utilisent les classes du design system (T003) au lieu de HTML non stylé.

**Independent Test**: cf. quickstart.md, User Story 2.

- [x] T007 [P] [US2] Restyler `frontend/src/pages/ProfilePage.tsx` (classes `.card`/`.field`/`.btn`, sans changement de comportement)
- [x] T008 [P] [US2] Restyler `frontend/src/pages/TeamsDirectoryPage.tsx`
- [x] T009 [P] [US2] Restyler `frontend/src/pages/CreateTeamPage.tsx`
- [x] T010 [P] [US2] Restyler `frontend/src/pages/TeamPage.tsx`
- [x] T011 [P] [US2] Restyler `frontend/src/pages/JoinTeamPage.tsx`
- [x] T012 [P] [US2] Restyler `frontend/src/pages/StorePage.tsx`
- [x] T013 [P] [US2] Restyler `frontend/src/pages/PublishResourcePage.tsx`
- [x] T014 [P] [US2] Restyler `frontend/src/pages/ResourcePage.tsx`

**Checkpoint**: Les 10 pages partagent visuellement le même design system.

---

## Phase 5: User Story 3 - Pages de connexion/inscription dédiées (Priority: P2)

**Goal**: Login/Signup centrées, sans menu applicatif, cohérentes avec le design system.

**Independent Test**: cf. quickstart.md — consulter `/login`/`/signup` déconnecté.

- [x] T015 [P] [US3] Restyler `frontend/src/pages/LoginPage.tsx` (mise en page centrée dédiée, hors `Layout`)
- [x] T016 [P] [US3] Restyler `frontend/src/pages/SignupPage.tsx` (idem)

**Checkpoint**: Parcours d'entrée dans l'app (avant authentification) visuellement soigné.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T017 Lancer `cd frontend && npm run test` — corriger les sélecteurs de `LoginPage.test.tsx` si la structure DOM a changé (jamais le comportement testé, cf. FR-005)
- [x] T018 Lancer `cd backend && dotnet test` — confirmer l'absence de régression (aucun changement backend attendu dans cette feature)
- [x] T019 Revérifier manuellement tous les parcours listés dans quickstart.md (User Story 2, étapes 1-6) via `docker compose up --build` + navigateur
- [x] T020 Mettre à jour `README.md` (racine) : ajouter la feature 006 au tableau roadmap (post-MVP)

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2** : bloquant (le design system et `Layout` sont des prérequis partagés par toutes les pages).
- **Phase 3 (US1)** : dépend de Phase 2 (`Layout`).
- **Phase 4 (US2)** : dépend de Phase 2 (classes CSS) ; peut démarrer en parallèle de Phase 3 (fichiers distincts), mais son test manuel complet bénéficie d'avoir la nav déjà en place (Phase 3).
- **Phase 5 (US3)** : dépend de Phase 2 (design system) uniquement, indépendante de US1/US2 (pages hors `Layout`).
- **Phase 6 (Polish)** : après toutes les user stories.

## Parallel Execution Examples

- Phase 4 : T007-T014 entièrement parallélisables (fichiers distincts, aucune dépendance entre pages).
- Phase 5 : T015, T016 en parallèle.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)** : navigation à icônes en place
— répond directement à l'exigence explicite du brief.

**Complet** : US1 + US2 + US3 + Polish, ce qui clôt la passe de style sur
l'ensemble de l'application (cf. constitution, principe I).
