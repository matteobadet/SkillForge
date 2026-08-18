---

description: "Task list for feature implementation"
---

# Tasks: Aperçu du contenu d'une ressource

**Input**: Design documents from `/specs/010-apercu-contenu/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: xUnit (extraction backend) et Vitest (composant frontend), cohérent avec les suites déjà en place sur le projet.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Web app existante : `backend/SkillForge.Api/`, `backend/SkillForge.Api.Tests/`, `frontend/src/`, `frontend/tests/`.

---

## Phase 1: Setup

- [X] T001 [P] Ajouter `react-markdown` et `rehype-sanitize` aux dépendances de `frontend/package.json` (`npm install`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Le endpoint de prévisualisation, commun aux deux user stories (US2 n'est qu'un autre état de la même réponse) — bloquant pour les deux.

**⚠️ CRITICAL**: Aucune user story ne peut être validée avant la fin de cette phase.

- [X] T002 [P] Créer `ResourcePreviewDto` dans `backend/SkillForge.Api/Models/Dtos/ResourceDtos.cs` (`available`, `fileName`, `content`, `truncated` — cf. data-model.md)
- [X] T003 Créer `backend/SkillForge.Api/Services/ResourcePreviewService.cs` : extraction depuis un `Stream` d'archive (sélection `SKILL.md`/`README.md` à la racine, insensible à la casse, `SKILL.md` prioritaire ; troncature à 100 000 caractères) — cf. research.md #1, #2, #5 (dépend de T002)
- [X] T004 Enregistrer `ResourcePreviewService` dans `backend/SkillForge.Api/Program.cs` (DI scoped) (dépend de T003)
- [X] T005 Ajouter `GET /api/resources/{id}/preview` dans `backend/SkillForge.Api/Controllers/ResourcesController.cs` : visibilité via `ResourceService.GetVisibleResourceAsync`, téléchargement de l'archive via le client MinIO interne, appel à `ResourcePreviewService` — toujours `200` avec `available:false` si rien trouvé, jamais d'erreur pour ce cas (cf. contracts/preview-endpoint.md) (dépend de T004)
- [X] T006 [P] Ajouter `getResourcePreview(id)` dans `frontend/src/api/resources.ts`

**Checkpoint**: Le endpoint est fonctionnel et testable via `curl` — les deux user stories peuvent démarrer.

---

## Phase 3: User Story 1 - Voir l'aperçu avant de télécharger (Priority: P1) 🎯 MVP

**Goal**: Le contenu de `SKILL.md`/`README.md` s'affiche mis en forme sur la page ressource, sans téléchargement.

**Independent Test**: quickstart.md scénarios 1, 2, 5, 6.

### Tests for User Story 1

- [X] T007 [P] [US1] `backend/SkillForge.Api.Tests/ResourcePreviewServiceTests.cs` : `SKILL.md` seul, priorité sur `README.md` si les deux existent, fichier dans un sous-dossier ignoré, troncature au-delà de 100 000 caractères — zips construits en mémoire (cf. research.md #6) (dépend de T003)

### Implementation for User Story 1

- [X] T008 [US1] Créer `frontend/src/components/ResourcePreview.tsx` : état de chargement, rendu Markdown via `react-markdown`+`rehype-sanitize`, indication si `truncated` (dépend de T001, T006)
- [X] T009 [US1] Intégrer `<ResourcePreview resourceId={...} />` dans `frontend/src/pages/ResourcePage.tsx` (dépend de T008)
- [X] T010 [P] [US1] `frontend/tests/ResourcePreview.test.tsx` : rendu du contenu disponible, indication de troncature (dépend de T008)
- [X] T011 [US1] Valider manuellement les scénarios 1, 2, 5, 6 de quickstart.md (dépend de T009)

**Checkpoint**: US1 testable de bout en bout indépendamment — MVP livrable.

---

## Phase 4: User Story 2 - Absence d'aperçu gérée proprement (Priority: P2)

**Goal**: Une ressource sans fichier candidat affiche un message clair, jamais une erreur ou un vide silencieux.

**Independent Test**: quickstart.md scénarios 3, 4.

### Tests for User Story 2

- [X] T012 [P] [US2] `frontend/tests/ResourcePreview.test.tsx` : cas `available:false` → message "Aucun aperçu disponible pour cette ressource." (dépend de T010, même fichier)

### Implementation for User Story 2

- [X] T013 [US2] Vérifier/finaliser le rendu du cas `available:false` dans `frontend/src/components/ResourcePreview.tsx` (le mécanisme existe déjà depuis T008 — cette tâche porte sur le libellé exact et la distinction visuelle avec une erreur) (dépend de T008)
- [X] T014 [US2] Valider manuellement les scénarios 3 (archive sans fichier candidat) et 4 (visibilité équipe privée → 404) de quickstart.md (dépend de T005, T013)

**Checkpoint**: US1 et US2 fonctionnent ensemble, chacune testable indépendamment.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T015 [P] Mettre à jour `README.md` (racine) : ajouter la feature 010 au tableau roadmap
- [X] T016 Revérifier manuellement via le navigateur que le rendu Markdown (titres, listes, blocs de code, liens) reste lisible en thème clair et sombre, cohérent avec le design system existant

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** : T001 indépendant, peut démarrer immédiatement.
- **Phase 2 (Foundational)** : bloquant pour les deux user stories. Chaîne : T002 → T003 → T004 → T005 ; T006 indépendant (peut être écrit en parallèle contre le contrat déjà documenté).
- **User Story 1 (P1, MVP)** : dépend de Foundational + Setup. T007 en parallèle de T008-T011 (fichiers distincts). T008 → T009 → T011 ; T010 en parallèle de T009 (dépendent tous deux de T008 mais pas l'un de l'autre).
- **User Story 2 (P2)** : dépend de US1 (même composant `ResourcePreview.tsx` et même fichier de test). T012/T013 séquentiels avec T010/T008 respectivement (mêmes fichiers) ; T014 après T013.
- **Phase 5 (Polish)** : après les deux user stories.

## Parallel Execution Examples

- Phase 2 : T002 et T006 en parallèle.
- Phase 3 : T007 en parallèle de T008-T010 (fichiers backend vs frontend distincts) ; T010 en parallèle de T009.
- Phase 5 : T015 en parallèle de T016.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)** : l'aperçu s'affiche pour toute
ressource ayant un `SKILL.md`/`README.md` — le gain UX principal identifié.

**Complet** : + US2 (état vide propre) + Polish, avant de considérer la
feature 010 validée (cf. constitution, principe I).
