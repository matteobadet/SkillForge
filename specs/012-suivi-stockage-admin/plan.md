# Implementation Plan: Suivi de l'espace de stockage MinIO (admin)

**Branch**: `main` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/012-suivi-stockage-admin/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Donner aux administrateurs une vue en lecture seule de l'espace de stockage MinIO utilisé par l'application (total + répartition par bucket : ressources, icônes, avatars), calculée en temps réel à la demande — sans nouvelle table ni migration, sans automatisation de nettoyage ni d'alerte. Approche technique : un nouvel endpoint `GET /api/admin/storage` (nouveau `AdminController`, premier endpoint strictement admin-only du projet) qui liste les objets de chaque bucket via le SDK MinIO déjà utilisé et somme leurs tailles ; une nouvelle page frontend dédiée `/admin/storage`, visible uniquement pour le rôle Admin.

## Technical Context

**Language/Version**: C# / .NET 9 (backend, `net9.0`), TypeScript 5 / React 19 (frontend, déjà en place)

**Primary Dependencies**: ASP.NET Core 9 (contrôleurs REST existants), SDK `Minio` 7.0.0 (déjà référencé, `ObjectStorageService.cs`), React + Vite + `react-router-dom` (routes protégées existantes), `lucide-react` (icônes déjà utilisées dans `Layout.tsx`)

**Storage**: MinIO (S3-compatible) — lecture seule, pas de PostgreSQL impliqué (aucune nouvelle entité, cf. data-model.md)

**Testing**: xUnit (backend, `SkillForge.Api.Tests`, 41 tests existants avant cette feature), Vitest (frontend, déjà en place pour les composants existants)

**Target Platform**: Linux server (conteneurs Docker/k3s, cohérent avec la feature 009)

**Project Type**: Web application (frontend + backend, structure déjà en place)

**Performance Goals**: Réponse de l'endpoint de mesure en quelques secondes pour des centaines d'objets par bucket (SC-001 : < 10s perçues côté utilisateur, listing + somme incluse) — pas d'exigence de temps réel sub-seconde, cohérent avec un usage occasionnel par un admin.

**Constraints**: Pas de nouvelle colonne/table (cohérence avec 010/011) ; pas de nouvelle dépendance externe (pas de scraping Prometheus, pas de binaire `mc` — cf. research.md #1) ; garde d'accès Admin au même style que l'existant (propriété `IsAdmin` calculée, pas d'attribut `[Authorize(Roles=...)]`).

**Scale/Scope**: Projet « friends-scale » — quelques dizaines à quelques centaines de ressources/versions/icônes au total (cohérent avec le contexte du VPS à 38 Go déjà documenté en feature 009). Un seul nouvel endpoint, une seule nouvelle page.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Spec-Driven Development** : spec.md validé avant ce plan.md ; tasks.md et implémentation suivront après validation utilisateur de ce plan. ✅
- **II. Scope Discipline (YAGNI)** : pas de tableau de bord admin élargi, pas d'historique/graphique, pas d'alerte automatique, pas d'action de nettoyage — strictement la visibilité demandée (cf. spec.md Assumptions). ✅
- **III. Explicit Over Assumed** : les points laissés ouverts par l'utilisateur (granularité, calcul temps réel vs colonne BDD, périmètre VPS vs MinIO) ont été tranchés en Assumptions du spec avec justification, aucun n'avait d'impact produit assez fort pour bloquer sur une question — cohérent avec le mode de travail déjà validé sur les features 010/011. ✅
- **IV. Security & Data Ownership by Default** : nouvel endpoint strictement réservé au rôle Admin, vérifié côté serveur (`IsAdmin`, jamais fait confiance au client) ; aucune donnée d'équipe privée exposée par cet endpoint (il n'expose que des tailles agrégées par bucket technique, pas de contenu ni de noms de fichiers). ✅
- **V. Consistent, Boring Stack** : réutilise le SDK MinIO déjà adopté, aucun nouvel outil introduit (cf. research.md #1, alternatives Prometheus/`mc` rejetées). ✅
- **VI. Reproducible Local Environment** : aucun nouveau service, variable d'environnement ou étape manuelle — fonctionne immédiatement via `docker compose up` existant. ✅

Aucune violation à justifier — Complexity Tracking non applicable.

## Project Structure

### Documentation (this feature)

```text
specs/012-suivi-stockage-admin/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   └── admin-storage-api.md
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
backend/SkillForge.Api/
├── Controllers/
│   └── AdminController.cs          # NEW — GET /api/admin/storage, garde IsAdmin
├── Services/
│   └── ObjectStorageService.cs     # EXTEND — nouvelle méthode de calcul d'usage par bucket
└── Models/Dtos/
    └── StorageUsageDto.cs          # NEW — StorageUsageDto, BucketUsageDto (cf. data-model.md)

backend/SkillForge.Api.Tests/
├── AdminControllerTests.cs         # NEW — 403 non-admin, 200 forme attendue
└── ObjectStorageServiceTests.cs    # EXTEND (ou NEW) — somme correcte, bucket vide, erreur MinIO

frontend/src/
├── pages/
│   └── AdminStoragePage.tsx        # NEW — vue /admin/storage
├── api/
│   └── admin.ts                    # NEW — appel GET /api/admin/storage
├── components/Layout.tsx           # EXTEND — lien nav conditionnel (role === "Admin")
└── App.tsx                         # EXTEND — route protégée /admin/storage
```

**Structure Decision**: Web application existante (frontend React/Vite + backend ASP.NET Core), aucune nouvelle structure de projet. Le nouveau contrôleur/service backend et la nouvelle page/route frontend suivent exactement les conventions déjà en place (cf. `ResourcesController.cs`, `TeamPage.tsx`, `App.tsx`).

## Complexity Tracking

*Aucune violation — section non applicable.*
