# Implementation Plan: Déploiement production sur VPS via Kubernetes

**Branch**: `009-deploiement-k8s` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-deploiement-k8s/spec.md`

## Summary

Déployer les 4 composants existants de SkillForge (API ASP.NET Core, frontend
React, PostgreSQL, MinIO) sur un cluster k3s mono-nœud tournant sur le VPS
existant (`ubuntu@152.228.239.129`), exposés en HTTPS sur
`skillforge.mbadet.fr` (frontend) et `api.skillforge.mbadet.fr` (API) via
Traefik + cert-manager/Let's Encrypt, avec persistance des données via
`local-path-provisioner`, secrets gérés comme Kubernetes Secrets (jamais
commités), images publiées sur GHCR, et un pipeline GitHub Actions qui
build/push/déploie automatiquement à chaque push sur `main`.

## Technical Context

**Language/Version**: Bash (scripts d'installation/déploiement), YAML (manifests Kubernetes, GitHub Actions) — aucun changement de langage sur l'app existante (.NET 9 / React+TS)

**Primary Dependencies**: k3s (canal stable), Traefik (ingress, inclus avec k3s), cert-manager (émission/renouvellement TLS Let's Encrypt), Kustomize (inclus dans `kubectl`, pour l'override de tags d'image par environnement de déploiement)

**Storage**: PostgreSQL et MinIO inchangés dans leur usage applicatif ; persistance via PersistentVolumeClaim sur la StorageClass `local-path` (fournie par k3s, backée par le disque local du VPS)

**Testing**: `quickstart.md` de cette feature (validation manuelle bout-en-bout : `kubectl get pods`, `curl` des health checks, parcours navigateur réel) ; les suites xUnit/Vitest existantes ne changent pas et restent la référence pour la correction applicative

**Target Platform**: Linux (Ubuntu 26.04 LTS x86_64), VPS unique, 4 vCPU / 3.7 Go RAM / 38 Go disque

**Project Type**: Ajout d'infrastructure de déploiement à une web application existante (frontend + backend déjà présents)

**Performance Goals**: Aucune exigence de performance nouvelle au-delà de l'existant ; les seules cibles sont celles du spec (SC-002 : retour à un état fonctionnel en < 5 min après redémarrage complet du VPS ; SC-003 : nouvelle version en prod en < 10 min après un push sur `main`)

**Constraints**: Budget mémoire total de 3.7 Go RAM partagé entre k3s (composants système), Traefik, cert-manager, et les 4 pods applicatifs (Postgres, MinIO, API, frontend) — chaque composant DOIT déclarer des `resources.requests`/`limits` sobres ; 38 Go de disque partagés entre images de conteneurs, données Postgres/MinIO et logs

**Scale/Scope**: Cluster mono-nœud, une seule réplique par composant (pas de haute disponibilité requise pour un usage cercle d'amis), un seul environnement (`main` = production, pas de staging séparé)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Spec-Driven Development** — ✅ `spec.md` validé avant ce `plan.md`, `tasks.md` suivra avant toute implémentation.
- **II. Scope Discipline (YAGNI)** — ✅ Mono-nœud, mono-réplique, pas de staging, pas de sauvegarde automatisée, pas d'autoscaling : le strict nécessaire pour mettre l'app en prod sur ce VPS (documenté dans les Assumptions du spec).
- **III. Explicit Over Assumed** — ✅ Toutes les décisions à impact produit (VPS, distro k8s, registry, domaines, TLS) ont été validées par clarification avec l'utilisateur avant l'écriture du spec. Les décisions restantes (ex. StorageClass, contrat de health check, format de tag d'image) sont des détails d'implémentation sans conséquence produit, documentés en Phase 0 (research.md) plutôt que soumis à clarification.
- **IV. Security & Data Ownership by Default** — ✅ Secrets (mot de passe Postgres, clé JWT, identifiants MinIO) créés comme Kubernetes Secrets via commande impérative, jamais commités ; console MinIO non exposée (FR-010) ; le modèle d'auth applicatif (hash de mot de passe, JWT, rôles) n'est pas modifié par cette feature.
- **V. Consistent, Boring Stack** — ✅ k3s est explicitement anticipé par la constitution ("Kubernetes as the eventual orchestration target"). Traefik est fourni nativement par k3s (pas un nouveau choix). **cert-manager est un nouveau composant** : justifié car c'est le mécanisme standard et éprouvé pour l'émission/le renouvellement automatique de certificats Let's Encrypt dans un cluster Kubernetes — l'alternative (script `certbot` en cron, copie manuelle du certificat) est plus fragile, plus manuelle, et non idiomatique Kubernetes. Aucune autre alternative déjà adoptée ne couvre ce besoin.
- **VI. Reproducible Local Environment** — ✅ Le développement local continue de fonctionner via `docker compose up` sans changement ; cette feature ajoute des artefacts de déploiement production (`k8s/`, `frontend/Dockerfile.prod`, workflow GitHub Actions) qui n'affectent pas le flux local.

Aucune violation nécessitant la table Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/009-deploiement-k8s/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md         # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/            # Phase 1 output
└── tasks.md              # Phase 2 output (/speckit-tasks — not created here)
```

### Source Code (repository root)

```text
backend/SkillForge.Api/
└── Dockerfile             # Déjà prêt pour la prod (multi-stage sdk→aspnet), inchangé

frontend/
├── Dockerfile              # Existant, dev only (npm run dev) — INCHANGÉ, reste utilisé par docker-compose local
├── Dockerfile.prod          # NOUVEAU : build multi-stage (npm run build) → serveur statique léger
└── nginx.conf                # NOUVEAU : config minimale du serveur statique (SPA fallback, gzip)

k8s/
├── kustomization.yaml       # Point d'entrée : assemble les manifests, override des tags d'image en CI
├── namespace.yaml
├── postgres/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── minio/
│   ├── deployment.yaml
│   ├── service.yaml
│   └── pvc.yaml
├── api/
│   ├── deployment.yaml
│   └── service.yaml
├── frontend/
│   ├── deployment.yaml
│   └── service.yaml
├── ingress.yaml              # Deux hosts (skillforge.mbadet.fr, api.skillforge.mbadet.fr) + TLS cert-manager
└── cert-manager/
    └── cluster-issuer.yaml   # ClusterIssuer Let's Encrypt (HTTP-01 via Traefik)

.github/workflows/
└── deploy.yml                 # NOUVEAU : build+push GHCR (API, frontend) + déploiement SSH sur push main
```

**Structure Decision**: Application web existante (Option 2 : frontend + backend séparés). Cette
feature ajoute un dossier `k8s/` à la racine (manifests, structurés par
composant, assemblés via Kustomize) et un nouveau Dockerfile de production
pour le frontend, sans toucher à la structure applicative existante
(`backend/`, `frontend/src/`, `cli/`).

## Complexity Tracking

*Aucune violation à justifier — section non applicable.*
