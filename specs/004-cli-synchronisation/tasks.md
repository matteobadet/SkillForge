---
description: "Task list for feature implementation"
---

# Tasks: CLI de synchronisation

**Input**: Design documents from `/specs/004-cli-synchronisation/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/cli-commands.md, quickstart.md

**Tests**: Vitest sur les modules purs (config, credentials, mapping de dossiers) en Polish ; pas de test d'intégration réseau automatisé (validation manuelle via quickstart.md).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Nouveau package `cli/` à la racine (ni backend, ni frontend, cf. plan.md).

---

## Phase 1: Setup

- [x] T001 Scaffolder `cli/package.json` (nom `skillforge-cli`, bin `skillforge` → `dist/index.js`), `cli/tsconfig.json` (cible Node 24, `outDir: dist`)
- [x] T002 Ajouter les dépendances à `cli/package.json` : `commander`, `prompts`, `adm-zip` (+ types `@types/prompts`, `@types/adm-zip`)
- [x] T003 [P] Ajouter Vitest à `cli/package.json` (devDependency, script `test`), cohérent avec `frontend/package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Config, credentials, client API avec refresh — bloquant pour toutes les commandes.

- [x] T004 [P] Créer `cli/src/config.ts` : résolution `apiUrl` (flag > env `SKILLFORGE_API_URL` > credentials stockées > défaut `http://localhost:5080`) et `targetDir` (flag `--dir` > défaut `~/.claude`)
- [x] T005 [P] Créer `cli/src/credentials.ts` : lecture/écriture/suppression de `~/.skillforge/credentials.json` (création du dossier si absent, permissions restreintes cf. research.md #4)
- [x] T006 Créer `cli/src/apiClient.ts` : wrapper `fetch` avec `Authorization: Bearer`, retry automatique sur 401 via `POST /api/auth/refresh` (met à jour `credentials.json` avec les nouveaux tokens), erreurs formatées lisibles (cf. contracts/cli-commands.md)
- [x] T007 [P] Créer `cli/src/resourceTypeFolders.ts` : mapping `Skill`→`skills`, `MCP`→`mcp`, `Agent`→`agents`, et fonction de slug (cf. research.md #7)
- [x] T008 Créer `cli/src/index.ts` : point d'entrée `commander`, déclare les sous-commandes (implémentation dans Phase 3+), option globale `--api-url`

---

## Phase 3: User Story 1 - S'authentifier (Priority: P1) 🎯 MVP

**Goal**: `login`/`logout` fonctionnels, refresh transparent.

**Independent Test**: `skillforge login` puis `skillforge teams` (une fois implémentée en Phase 4) sans ressaisie (cf. quickstart.md, User Story 1).

- [x] T009 [US1] Créer `cli/src/commands/login.ts` : prompts email/mot de passe (masqué) via `prompts`, appelle `POST /api/auth/login`, écrit `credentials.json`, message de succès/échec (cf. contracts/cli-commands.md)
- [x] T010 [US1] Créer `cli/src/commands/logout.ts` : supprime `credentials.json`
- [x] T011 [US1] Câbler `login`/`logout` dans `cli/src/index.ts`

**Checkpoint**: US1 testable de bout en bout (login, puis un appel protégé simple type `GET /api/users/me` pour valider manuellement les tokens).

---

## Phase 4: User Story 2 - Lister ses équipes (Priority: P2)

**Goal**: `skillforge teams` affiche les équipes de l'utilisateur.

**Independent Test**: cf. quickstart.md (implicite dans User Story 1) — comparer la sortie à `GET /api/teams/mine`.

- [x] T012 [US2] Créer `cli/src/commands/teams.ts` : appelle `GET /api/teams/mine`, affiche un tableau `ID | Nom | Visibilité`
- [x] T013 [US2] Câbler `teams` dans `cli/src/index.ts`

**Checkpoint**: US2 testable de bout en bout (dépend de US1 pour être connecté).

---

## Phase 5: User Story 3 - Pull (Priority: P1)

**Goal**: Télécharger et décompresser toutes les ressources d'une équipe.

**Independent Test**: cf. quickstart.md, User Story 3.

- [x] T014 [US3] Créer `cli/src/commands/pull.ts` : `GET /api/teams/{teamId}/resources`, pour chaque ressource `GET /api/resources/{id}/download` puis téléchargement + extraction `adm-zip` dans `<dir>/<dossier-type>/<slug-nom>/` (remplace le dossier existant)
- [x] T015 [US3] Câbler `pull <teamId>` (options `--dir`) dans `cli/src/index.ts`
- [x] T016 [US3] Gérer les erreurs de `pull` (équipe non visible → 404, message clair, code de sortie 1 — cf. contracts/cli-commands.md)

**Checkpoint**: US3 testable de bout en bout (dépend de US1 ; nécessite des ressources existantes, cf. feature 003).

---

## Phase 6: User Story 4 - Push (Priority: P1)

**Goal**: Publier ou mettre à jour une ressource depuis un chemin local.

**Independent Test**: cf. quickstart.md, User Story 4.

- [x] T017 [US4] Créer `cli/src/commands/push.ts` : compresse `<chemin>` (fichier ou dossier) via `adm-zip`, cherche une ressource existante de ce nom via `GET /api/teams/{teamId}/resources`, puis `POST` (création) ou `PATCH` (mise à jour) sur `/api/resources`
- [x] T018 [US4] Câbler `push <teamId> <chemin>` (options `--name`, `--type`, `--description`) dans `cli/src/index.ts`
- [x] T019 [US4] Gérer les erreurs de `push` (chemin introuvable, droits insuffisants 403, équipe non visible 403/404 — messages clairs cf. contracts/cli-commands.md)

**Checkpoint**: Cycle complet `push` → `pull` → contenu identique (SC-002).

---

## Phase 7: Polish & Cross-Cutting Concerns

- [x] T020 [P] Ajouter `cli/tests/resourceTypeFolders.test.ts` (mapping + slug) et `cli/tests/config.test.ts` (priorité flag > env > credentials > défaut)
- [x] T021 [P] Ajouter `cli/tests/credentials.test.ts` (écriture/lecture/suppression, utilise un dossier temporaire injecté plutôt que le vrai `~/.skillforge`)
- [x] T022 Ajouter `cli/README.md` : installation (`npm install -g skillforge-cli` une fois publié, ou `npm link` en local), toutes les commandes (reprend contracts/cli-commands.md)
- [x] T023 Mettre à jour `README.md` (racine) : cocher la feature 004 dans le tableau roadmap, section "CLI" pointant vers `cli/README.md`

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2** : bloquant (config/credentials/apiClient partagés par toutes les commandes).
- **Phase 3 (US1)** : dépend de Phase 2. MVP minimal (sans elle, aucune autre commande ne peut s'authentifier).
- **Phase 4 (US2)** : dépend de US1.
- **Phase 5 (US3)** : dépend de US1 (auth) ; indépendante de US2 (n'a pas besoin de `teams`, l'utilisateur peut connaître l'ID autrement, ex: URL du store web).
- **Phase 6 (US4)** : dépend de US1 ; indépendante de US2/US3, mais son test de bout en bout (SC-002) utilise US3 pour vérifier le round-trip.
- **Phase 7 (Polish)** : après toutes les user stories.

## Parallel Execution Examples

- Phase 2 : T004, T005, T007 en parallèle (fichiers distincts, aucune dépendance entre eux) ; T006 dépend de T005 (credentials) ; T008 dépend de tous.
- Phase 7 : T020, T021 en parallèle (fichiers de test distincts).

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)** : authentification fonctionnelle
— pas encore utile seule, mais valide la fondation (config, credentials,
refresh token).

**Incrément recommandé pour une démo complète** : US1 → US3 (pull) → US4
(push) → US2 (teams, utilitaire) → Polish, avant de considérer la feature
004 validée (cf. constitution, principe I).
