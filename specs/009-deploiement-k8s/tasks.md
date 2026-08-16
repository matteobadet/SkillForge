---

description: "Task list for feature implementation"
---

# Tasks: Déploiement production sur VPS via Kubernetes

**Input**: Design documents from `/specs/009-deploiement-k8s/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Pas de suite automatisée dédiée — validation par les scénarios bout-en-bout de `quickstart.md` (application réelle, pas de mock).

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Infrastructure ajoutée à l'application web existante : `k8s/` (manifests), `frontend/Dockerfile.prod` + `frontend/nginx.conf` (nouveaux), `.github/workflows/` (CI/CD). Aucun changement à `backend/`, `frontend/src/`, `cli/`.

---

## Phase 1: Setup

**Purpose**: Provisionner le cluster de base sur le VPS, avant tout manifest applicatif.

- [X] T001 Installer k3s sur le VPS (`curl -sfL https://get.k3s.io | sh -`), vérifier `kubectl get nodes` en état Ready — suivre [quickstart.md](quickstart.md) étape 1
- [X] T002 Installer cert-manager sur le cluster (manifest officiel release), vérifier `kubectl -n cert-manager rollout status deployment/cert-manager` — quickstart.md étape 2 (dépend de T001)
- [X] T003 [P] Vérifier que `skillforge.mbadet.fr` et `api.skillforge.mbadet.fr` résolvent bien vers l'IP du VPS (`dig +short`) avant de poursuivre vers l'Ingress/TLS

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Namespace, secrets et stockage — bloquant pour toutes les user stories.

**⚠️ CRITICAL**: Aucune user story ne peut être validée avant la fin de cette phase.

- [X] T004 Créer le namespace `skillforge` et les 4 secrets (`skillforge-postgres`, `skillforge-minio`, `skillforge-api`, `ghcr-pull-secret`) via commandes `kubectl create secret` impératives, jamais commitées — quickstart.md étape 3 (dépend de T001)
- [X] T005 [P] Créer `k8s/kustomization.yaml` (point d'entrée assemblant les ressources listées ci-dessous)
- [X] T006 [P] Créer `k8s/postgres/pvc.yaml` (PVC 2Gi, StorageClass `local-path`)
- [X] T007 [P] Créer `k8s/minio/pvc.yaml` (PVC 5Gi, StorageClass `local-path`)
- [X] T008 [P] Créer `k8s/cert-manager/cluster-issuer.yaml` (ClusterIssuer `letsencrypt-prod`, challenge HTTP-01 via la classe d'ingress `traefik`, cf. research.md #6)

**Checkpoint**: Cluster provisionné, secrets et PVC définis — les user stories peuvent démarrer.

---

## Phase 3: User Story 1 - Accéder à SkillForge en production (Priority: P1) 🎯 MVP

**Goal**: Frontend et API joignables en HTTPS sur leurs domaines, parcours utilisateur complet fonctionnel, résilience à un redémarrage de pod isolé (AC3).

**Independent Test**: quickstart.md étapes 4-5 (apply, curl des health checks, parcours navigateur réel depuis un poste externe).

### Implementation for User Story 1

- [X] T009 [P] [US1] Créer `frontend/Dockerfile.prod` (build multi-stage `node:24-alpine` → `nginx:alpine`, `ARG VITE_API_URL=https://api.skillforge.mbadet.fr`, cf. research.md #7) — `frontend/Dockerfile` existant reste inchangé (dev local)
- [X] T010 [P] [US1] Créer `frontend/nginx.conf` (fallback SPA vers `index.html`, gzip)
- [X] T011 [US1] Builder et pousser manuellement les images initiales `ghcr.io/matteobadet/skillforge-api:sha-<commit>` et `skillforge-frontend:sha-<commit>` (bootstrap unique avant que le CI/CD de US2 existe) (dépend de T009, T010)
- [X] T012 [P] [US1] Créer `k8s/postgres/deployment.yaml` + `k8s/postgres/service.yaml` (image `postgres:16-alpine`, `resources` 128Mi/384Mi cf. research.md #9, probe TCP 5432, env depuis secret `skillforge-postgres`, volume sur PVC `postgres-data`) (dépend de T004, T006)
- [X] T013 [P] [US1] Créer `k8s/minio/deployment.yaml` + `k8s/minio/service.yaml` (image `minio/minio:latest`, `resources` 128Mi/256Mi, probe HTTP `/minio/health/live`, env depuis secret `skillforge-minio`, volume sur PVC `minio-data`) (dépend de T004, T007)
- [X] T014 [US1] Créer `k8s/api/deployment.yaml` + `k8s/api/service.yaml` (image GHCR, `resources` 150Mi/350Mi, readiness+liveness probe HTTP `/health`, env vers les Services `postgres`/`minio` internes + secrets `skillforge-postgres`/`skillforge-minio`/`skillforge-api`, `imagePullSecrets: ghcr-pull-secret`) (dépend de T011, T012, T013)
- [X] T015 [P] [US1] Créer `k8s/frontend/deployment.yaml` + `k8s/frontend/service.yaml` (image GHCR, `resources` 16Mi/64Mi, readiness+liveness probe HTTP `/`, `imagePullSecrets: ghcr-pull-secret`) (dépend de T011)
- [X] T016 [US1] Créer `k8s/ingress.yaml` (host `skillforge.mbadet.fr` → Service `frontend`, host `api.skillforge.mbadet.fr` → Service `api`, annotation `cert-manager.io/cluster-issuer: letsencrypt-prod`, blocs `tls`) (dépend de T003, T008, T014, T015)
- [X] T017 [US1] Appliquer `kubectl apply -k k8s/`, vérifier les 4 pods `Running`/`1/1 Ready` — quickstart.md étape 4 (dépend de T002, T005, T016)
- [X] T018 [US1] Valider bout-en-bout : `curl` `/health` et le frontend, parcours navigateur complet (connexion, publication d'une ressource de test, téléchargement) — quickstart.md étape 5 (dépend de T017)
- [X] T019 [US1] Valider la résilience à un pod isolé : `kubectl delete pod` sur l'API ou le frontend, vérifier le retour automatique en moins d'une minute sans perte de données (AC3) (dépend de T018)

**Checkpoint**: US1 testable de bout en bout indépendamment — MVP livrable.

---

## Phase 4: User Story 2 - Publier une nouvelle version en poussant sur `main` (Priority: P2)

**Goal**: Chaque push sur `main` modifiant le backend ou le frontend build, publie et déploie automatiquement, sans coupure de service.

**Independent Test**: quickstart.md étape 7 (push d'un commit trivial, observation du workflow, vérification du nouveau tag déployé).

### Implementation for User Story 2

- [X] T020 [US2] Créer `.github/workflows/deploy.yml` : build + push des deux images taguées `sha-<commit>` et `latest` sur `ghcr.io`, déclenché sur push `main` modifiant `backend/` ou `frontend/` (cf. contracts/deployment-interface.md)
- [X] T021 [US2] Ajouter l'étape de déploiement SSH dans `deploy.yml` (`kubectl set image` + `kubectl rollout status --timeout=120s`, le job échoue si le rollout échoue, sans jamais couper le pod précédent qui fonctionne) (dépend de T020)
- [X] T022 [US2] Configurer les secrets GitHub Actions requis (`VPS_SSH_PRIVATE_KEY`, PAT GHCR si nécessaire) dans les settings du repo — action manuelle utilisateur, référencée en commentaire dans `deploy.yml` (dépend de T020)
- [X] T023 [US2] Valider : pousser un commit trivial sur `main`, observer le workflow dans l'onglet Actions, vérifier le nouveau tag d'image déployé — quickstart.md étape 7 (dépend de T021, T022, et US1 complète)

**Checkpoint**: US2 testable indépendamment (suppose US1 déjà déployée, puisque le workflow met à jour un déploiement existant).

---

## Phase 5: User Story 3 - Les données survivent aux redémarrages et mises à jour (Priority: P1)

**Goal**: Un redémarrage complet du VPS (pas seulement d'un pod) ne perd aucune donnée Postgres/MinIO.

**Independent Test**: quickstart.md étape 6 (`sudo reboot`, vérification du retour des pods et de l'intégrité des données créées en T018).

### Implementation for User Story 3

- [X] T024 [US3] Revoir/ajuster les `resources.requests`/`limits` mémoire des 4 Deployments (`k8s/postgres/deployment.yaml`, `k8s/minio/deployment.yaml`, `k8s/api/deployment.yaml`, `k8s/frontend/deployment.yaml`) selon `kubectl top pods` réel, en gardant le total sous l'enveloppe du research.md #9 (dépend de T017, US1 complète)
- [X] T025 [US3] Exécuter le test de redémarrage complet du VPS et vérifier le retour de tous les pods + intégrité des données de T018 — quickstart.md étape 6 (dépend de T024)
- [X] T026 [US3] Documenter dans `quickstart.md` le temps de retour observé et toute limite constatée (ex. réattachement `local-path`) (dépend de T025)

**Checkpoint**: Les trois user stories sont fonctionnelles indépendamment.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T027 [P] Mettre à jour `README.md` (racine) : section "Déploiement production" (URL publique, lien vers specs/009-deploiement-k8s) + ligne 009 dans le tableau roadmap
- [X] T028 [P] Créer `k8s/secrets.example.yaml` (schéma documenté des 4 secrets, valeurs `<GENERATE_ME>`, fichier de référence non appliqué — jamais de vraies valeurs)

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** : T003 indépendant ; T001 puis T002 séquentiels (cert-manager nécessite le cluster).
- **Phase 2 (Foundational)** : bloquant pour toutes les user stories ; T004 dépend de T001, T005-T008 indépendants entre eux.
- **User Story 1 (P1, MVP)** : dépend de Foundational. Chaîne interne : Dockerfiles (T009-T010) → build/push (T011) → manifests stateful (T012-T013, parallèles) → manifest API (T014) → manifest frontend (T015, parallèle à T012-T014 dès T011 fait) → Ingress (T016) → apply (T017) → validation (T018-T019).
- **User Story 2 (P2)** : dépend de US1 complète (le workflow met à jour un déploiement existant). Interne : T020 → T021/T022 → T023.
- **User Story 3 (P1)** : dépend de US1 complète (édite les mêmes fichiers Deployment). Interne : T024 → T025 → T026.
- **Phase 6 (Polish)** : après toutes les user stories désirées.

## Parallel Execution Examples

- Phase 1 : T003 en parallèle de T001/T002.
- Phase 2 : T005, T006, T007, T008 en parallèle (fichiers distincts).
- Phase 3 : T009 et T010 en parallèle ; puis T012 et T013 en parallèle ; T015 peut suivre dès T011 fait, en parallèle de T012-T014.
- Phase 6 : T027 et T028 en parallèle (fichiers distincts).

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)** : l'application est en production, joignable en HTTPS, fonctionnelle et résiliente à un crash de pod isolé — la valeur livrée la plus significative.

**Complet** : + US2 (automatisation CI/CD) + US3 (résilience redémarrage complet du VPS) + Polish, avant de considérer la feature 009 validée (cf. constitution, principe I).
