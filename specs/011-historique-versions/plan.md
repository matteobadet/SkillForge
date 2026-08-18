# Implementation Plan: Historique de versions des ressources

**Branch**: `011-historique-versions` | **Date**: 2026-08-18 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-historique-versions/spec.md`

## Summary

Ajouter une table `resource_versions` qui enregistre chaque archive publiée
pour une ressource (au lieu de l'écraser). Le endpoint de mise à jour
existant (`PATCH /api/resources/{id}`) ne supprime plus l'ancien fichier
MinIO lors d'un remplacement d'archive — il devient la version précédente,
avec une note optionnelle. Un nouvel endpoint liste l'historique et permet
de télécharger n'importe quelle version. Les ressources déjà publiées sans
aucune ligne de version affichent une version unique synthétisée à la
volée depuis leurs champs existants — zéro migration de données requise.

## Technical Context

**Language/Version**: C# / .NET 9 (API, migration EF Core), TypeScript / React 19 (frontend) — inchangé

**Primary Dependencies**: Aucune nouvelle dépendance. EF Core (déjà en place) pour la nouvelle table et sa migration.

**Storage**: Nouvelle table `resource_versions` (PostgreSQL, migration EF Core `AddResourceVersions`) ; les archives de chaque version restent dans le bucket MinIO `resources` existant, sous leurs clés déjà uniques par upload (aucun changement de convention de nommage nécessaire — cf. research.md #1)

**Testing**: xUnit (backend) pour la création/lecture de versions, le fallback synthétisé, le cascade de suppression ; Vitest (frontend) pour l'affichage de l'historique et le champ de note optionnel — suites existantes

**Target Platform**: Inchangé (API ASP.NET Core en conteneur, SPA React, déploiement k3s existant)

**Project Type**: Ajout à l'application web existante (backend + frontend + CLI)

**Performance Goals**: La liste des versions d'une ressource DOIT se charger aussi vite que le reste de la page (requête indexée simple, pas de lecture d'archive)

**Constraints**: Croissance du stockage MinIO au fil des mises à jour de ressources (accepté et documenté en Assumptions du spec, pas de purge automatique en v1) ; le VPS de production a un budget mémoire/disque serré (specs/009-deploiement-k8s) mais cette feature n'ajoute aucune charge mémoire nouvelle par requête (pas de lecture d'archive en mémoire, contrairement à la feature 010)

**Scale/Scope**: Nouvelle table à une seule relation (Resource 1—* ResourceVersion), deux nouveaux endpoints, un nouveau composant frontend, une nouvelle UI de remplacement d'archive sur le web (absente aujourd'hui — cf. research.md #4), une option CLI supplémentaire

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Spec-Driven Development** — ✅ `spec.md` validé avant ce `plan.md`.
- **II. Scope Discipline (YAGNI)** — ✅ Pas de purge automatique, pas de restauration en un clic, pas de détection de doublon binaire, pas de diff de contenu entre versions : le strict nécessaire pour ne plus perdre l'historique (documenté en Assumptions du spec).
- **III. Explicit Over Assumed** — ✅ Aucune ambiguïté à impact produit restante dans le spec. Une lacune technique a été découverte pendant la recherche (pas d'UI web existante pour remplacer une archive) et traitée comme un pré-requis à combler plutôt qu'une extension de périmètre — cf. research.md #4.
- **IV. Security & Data Ownership by Default** — ✅ L'historique et le téléchargement de version réutilisent `ResourceService.GetVisibleResourceAsync` (même garde de visibilité que les endpoints existants) — une ressource d'équipe privée reste invisible, historique inclus, à un non-membre (FR-005). Seul un utilisateur `CanManageAsync` peut publier une nouvelle version (comportement inchangé de `Update`).
- **V. Consistent, Boring Stack** — ✅ Aucune nouvelle dépendance ; réutilise EF Core, MinIO, et les patterns déjà en place (clés d'objet déjà uniques par upload, cf. research.md #1).
- **VI. Reproducible Local Environment** — ✅ La migration EF Core s'applique automatiquement au démarrage (`db.Database.Migrate()`, déjà en place) — aucune étape manuelle supplémentaire pour `docker compose up`.

Aucune violation nécessitant la table Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/011-historique-versions/
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
├── Models/
│   └── ResourceVersion.cs               # NOUVEAU
├── Models/Dtos/
│   └── ResourceDtos.cs                  # + ResourceVersionDto
├── Data/
│   ├── AppDbContext.cs                  # + DbSet<ResourceVersion>, config relation/cascade
│   └── Migrations/                      # + migration AddResourceVersions (auto-générée)
├── Services/
│   └── ResourceService.cs               # + CreateInitialVersionAsync, RecordNewVersionAsync (préserve l'historique legacy au premier update), ListVersionsAsync (avec fallback synthétisé)
└── Controllers/
    └── ResourcesController.cs           # Publish : + version 1 ; Update : ne supprime plus l'ancien objet, accepte `note` optionnelle ; + GET /versions, GET /versions/{n}/download

backend/SkillForge.Api.Tests/
└── ResourceVersioningTests.cs            # NOUVEAU

cli/src/
├── commands/push.ts                      # + option --note (transmise au PATCH)
└── index.ts                              # + option --note sur `push`

cli/tests/
└── (pas de nouveau fichier — option simple transmise telle quelle)

frontend/
├── src/api/resources.ts                  # + listResourceVersions, getVersionDownloadUrl ; updateResource accepte `note`
├── src/components/
│   └── ResourceVersionHistory.tsx        # NOUVEAU : liste des versions, badge "actuelle", téléchargement, note
├── src/pages/ResourcePage.tsx             # + <ResourceVersionHistory> ; + UI de remplacement d'archive (FileInput + note optionnelle) dans la section Gestion — absente aujourd'hui
└── tests/
    └── ResourceVersionHistory.test.tsx    # NOUVEAU
```

**Structure Decision**: Application web existante (frontend + backend + CLI,
inchangée dans sa structure globale). Cette feature ajoute une table liée à
`Resource`, deux endpoints, et comble une lacune découverte : il n'existait
pas encore de moyen web de remplacer l'archive d'une ressource (seul le CLI
le permettait) — cette feature l'ajoute puisque la note de version (US2)
doit être utilisable depuis les deux points d'entrée.

## Complexity Tracking

*Aucune violation à justifier — section non applicable.*
