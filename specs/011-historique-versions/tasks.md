---

description: "Task list for feature implementation"
---

# Tasks: Historique de versions des ressources

**Input**: Design documents from `/specs/011-historique-versions/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: xUnit (backend) et Vitest (frontend), cohérent avec les suites déjà en place sur le projet.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Web app existante + CLI : `backend/SkillForge.Api/`, `backend/SkillForge.Api.Tests/`, `frontend/src/`, `frontend/tests/`, `cli/src/`.

---

## Phase 1: Setup

Aucune tâche de setup (pas de nouvelle dépendance).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Le modèle de données et les endpoints de versioning sont partagés par les deux user stories (US2 n'ajoute que la façon de fournir une note à un mécanisme déjà complet) — bloquant pour les deux.

**⚠️ CRITICAL**: Aucune user story ne peut être validée avant la fin de cette phase.

- [X] T001 [P] Créer `backend/SkillForge.Api/Models/ResourceVersion.cs` (`ResourceId`, `VersionNumber`, `ObjectKey`, `Note?`, `CreatedByUserId`, `CreatedAt` — cf. data-model.md)
- [X] T002 Configurer `backend/SkillForge.Api/Data/AppDbContext.cs` : `DbSet<ResourceVersion>`, table `resource_versions`, index unique `(ResourceId, VersionNumber)`, cascade delete depuis `Resource` (dépend de T001)
- [X] T003 Générer la migration EF Core `AddResourceVersions` (`dotnet ef migrations add AddResourceVersions`) (dépend de T002)
- [X] T004 [P] Ajouter `ResourceVersionDto` dans `backend/SkillForge.Api/Models/Dtos/ResourceDtos.cs` (`versionNumber`, `note`, `createdAt`, `publisherPseudo`, `isCurrent` — cf. data-model.md)
- [X] T005 Ajouter à `backend/SkillForge.Api/Services/ResourceService.cs` : `CreateInitialVersionAsync` (version 1 à la publication), `RecordNewVersionAsync` (backfill rétroactif de la version 1 si aucune ligne n'existe encore, puis crée la version N+1, met à jour `Resource.ObjectKey`), `ListVersionsAsync` (lignes réelles triées, ou entrée synthétisée si aucune — cf. research.md #2, #3) (dépend de T001, T003)
- [X] T006 Modifier `ResourceService.DeleteResourceAsync` pour retourner la liste de tous les `ObjectKey` de versions à supprimer de MinIO (pas seulement l'actuel) (dépend de T005)
- [X] T007 Modifier `backend/SkillForge.Api/Controllers/ResourcesController.cs` : `Publish` appelle `CreateInitialVersionAsync` ; `Update` accepte `[FromForm] string? note`, n'appelle plus `objectStorage.DeleteAsync` sur l'ancien objet, appelle `RecordNewVersionAsync` à la place ; `Delete` boucle sur les `ObjectKey` retournés par T006 pour tout supprimer de MinIO (dépend de T005, T006)
- [X] T008 [P] Ajouter `GET /api/resources/{id}/versions` dans `ResourcesController.cs` (visibilité via `GetVisibleResourceAsync`, `ListVersionsAsync`) — cf. contracts/versioning-endpoints.md (dépend de T005)
- [X] T009 [P] Ajouter `GET /api/resources/{id}/versions/{versionNumber}/download` dans `ResourcesController.cs` (URL présignée vers l'`ObjectKey` de la version demandée, `404` si le numéro n'existe pas) (dépend de T005)
- [X] T010 [P] Ajouter `listResourceVersions(id)` et `getVersionDownloadUrl(id, versionNumber)` dans `frontend/src/api/resources.ts` ; étendre `updateResource` pour accepter `note?: string`

**Checkpoint**: Les endpoints de versioning sont fonctionnels et testables via `curl` — les deux user stories peuvent démarrer.

---

## Phase 3: User Story 1 - Consulter et télécharger l'historique des versions (Priority: P1) 🎯 MVP

**Goal**: Voir toutes les versions d'une ressource et télécharger n'importe laquelle, pas seulement la dernière.

**Independent Test**: quickstart.md scénarios 1, 3, 4, 5, 6 (création de versions via `skillforge push` répété, sans note — la note est US2).

### Tests for User Story 1

- [X] T011 [P] [US1] `backend/SkillForge.Api.Tests/ResourceVersioningTests.cs` : version 1 créée à la publication, version N+1 créée + `Resource.ObjectKey` mis à jour lors d'un remplacement, backfill rétroactif de la version 1 pour une ressource "legacy" à son premier remplacement, synthèse d'une version unique pour une ressource legacy jamais retouchée, suppression en cascade des versions (lignes + `ObjectKey` retournés), visibilité équipe privée — cf. research.md #7 (dépend de T005, T006, T007)

### Implementation for User Story 1

- [X] T012 [US1] Créer `frontend/src/components/ResourceVersionHistory.tsx` : liste des versions (numéro, date, note si présente), badge "version actuelle" sur la plus récente, bouton de téléchargement par version (dépend de T010)
- [X] T013 [US1] Intégrer `<ResourceVersionHistory resourceId={...} />` dans `frontend/src/pages/ResourcePage.tsx` (dépend de T012)
- [X] T014 [P] [US1] `frontend/tests/ResourceVersionHistory.test.tsx` : plusieurs versions affichées, badge sur la plus récente, présence/absence de note, lien de téléchargement par version (dépend de T012)
- [X] T015 [US1] Valider manuellement les scénarios 1, 3, 4, 5, 6 de quickstart.md (dépend de T013)

**Checkpoint**: US1 testable de bout en bout indépendamment — MVP livrable.

---

## Phase 4: User Story 2 - Décrire ce qui a changé (Priority: P2)

**Goal**: Pouvoir associer une note optionnelle à une nouvelle version, depuis le CLI et depuis le web (dont l'UI de remplacement d'archive n'existe pas encore — cf. research.md #4).

**Independent Test**: quickstart.md scénario 2.

### Implementation for User Story 2

- [X] T016 [P] [US2] Ajouter l'option `--note <texte>` à `cli/src/commands/push.ts` (`PushOptions.note`, transmise au formulaire uniquement sur la branche de mise à jour) et à la commande `push` dans `cli/src/index.ts`
- [X] T017 [US2] Ajouter une section "Remplacer l'archive" (FileInput + champ de note optionnel, réutilisant `frontend/src/components/FileInput.tsx`) dans la zone Gestion de `frontend/src/pages/ResourcePage.tsx`, visible uniquement si `canManage` (dépend de T010)
- [X] T018 [US2] Valider manuellement le scénario 2 de quickstart.md, depuis le CLI et depuis le web (dépend de T016, T017)

**Checkpoint**: US1 et US2 fonctionnent ensemble, chacune testable indépendamment.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T019 [P] Mettre à jour `README.md` (racine) : ajouter la feature 011 au tableau roadmap
- [X] T020 [P] Mettre à jour `cli/README.md` : documenter l'option `--note` de `push`
- [X] T021 Revérifier manuellement via le navigateur que `ResourceVersionHistory` reste lisible en thème clair et sombre, cohérent avec le design system existant

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** : aucune tâche.
- **Phase 2 (Foundational)** : bloquant pour les deux user stories. Chaîne : T001 → T002 → T003 ; T004 en parallèle ; T005 dépend de T001/T003 ; T006 dépend de T005 ; T007 dépend de T005/T006 ; T008/T009 en parallèle entre eux (fichiers/méthodes distincts du même contrôleur, mais indépendantes) dès T005 fait ; T010 indépendant (contrat déjà documenté).
- **User Story 1 (P1, MVP)** : dépend de Foundational. T011 en parallèle de T012-T014 (backend vs frontend). T012 → T013 → T015 ; T014 en parallèle de T013.
- **User Story 2 (P2)** : dépend de Foundational (pas de US1, réellement indépendante — CLI et UI de remplacement n'ont pas besoin de l'historique visuel pour fonctionner). T016 et T017 en parallèle (fichiers distincts) ; T018 après les deux.
- **Phase 5 (Polish)** : après les deux user stories.

## Parallel Execution Examples

- Phase 2 : T001 et T004 en parallèle ; T008 et T009 en parallèle une fois T005 fait ; T010 en parallèle du reste.
- Phase 3 : T011 en parallèle de T012-T014.
- Phase 4 : T016 et T017 en parallèle.
- Phase 5 : T019 et T020 en parallèle.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)** : plus aucune perte d'archive
lors d'un remplacement, historique consultable et téléchargeable — la
valeur principale demandée. US2 (note de version) est un raffinement
indépendant qui peut suivre séparément.

**Complet** : + US2 (note + UI web de remplacement d'archive) + Polish,
avant de considérer la feature 011 validée (cf. constitution, principe I).
