# Implementation Plan: Aperçu du contenu d'une ressource

**Branch**: `010-apercu-contenu` | **Date**: 2026-08-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/010-apercu-contenu/spec.md`

## Summary

Ajouter un endpoint `GET /api/resources/{id}/preview` qui lit l'archive déjà
stockée dans MinIO, y cherche `SKILL.md` ou `README.md` à la racine
(insensible à la casse, `SKILL.md` prioritaire), et retourne son contenu
(tronqué au-delà de 100 Ko) — en respectant les mêmes règles de visibilité
que le téléchargement. Le frontend affiche ce contenu rendu en Markdown
assaini directement sur `ResourcePage`, avec un état clair si aucun fichier
n'est trouvé. Aucune extraction à la publication, aucune nouvelle table :
tout est calculé à la demande depuis l'archive existante.

## Technical Context

**Language/Version**: C# / .NET 9 (API), TypeScript / React 19 (frontend) — inchangé

**Primary Dependencies** : backend — `System.IO.Compression.ZipArchive` (BCL, déjà implicitement disponible, aucun package ajouté) ; frontend — nouvelle dépendance `react-markdown` + `rehype-sanitize` (rendu Markdown → JSX avec assainissement du HTML résultant contre l'injection de script, cf. FR-008)

**Storage**: Aucun changement de schéma — le contenu est lu à la demande depuis l'archive déjà stockée dans le bucket `resources` de MinIO, jamais persisté séparément

**Testing**: xUnit (backend) pour l'extraction/sélection de fichier et le respect de la visibilité ; Vitest (frontend) pour le rendu du composant de prévisualisation (états : disponible / tronqué / absent) — suites existantes, pas de nouveau framework

**Target Platform**: Inchangé (API ASP.NET Core en conteneur, SPA React) ; le rendu Markdown est entièrement côté navigateur, donc aucun impact sur les ressources du VPS de production (specs/009-deploiement-k8s)

**Project Type**: Ajout à l'application web existante (backend + frontend)

**Performance Goals**: Aperçu affiché en moins d'une seconde perçue (SC-002) — implique de lire l'archive depuis MinIO et d'en extraire une seule entrée sans télécharger l'archive complète sur le poste client (le téléchargement/extraction a lieu côté API, pas côté navigateur)

**Constraints**: Les archives peuvent atteindre 50 Mo (limite existante, feature 003) — l'extraction se fait en mémoire côté API pour une seule entrée à la fois, sans mise en cache ni fichier temporaire disque ; le VPS de production a un budget mémoire serré (research.md #9 de la feature 009) donc l'implémentation doit libérer la mémoire du flux d'archive dès l'entrée extraite

**Scale/Scope**: Un seul nouvel endpoint, un seul nouveau composant frontend ; aucune nouvelle entité de données

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Spec-Driven Development** — ✅ `spec.md` validé avant ce `plan.md`.
- **II. Scope Discipline (YAGNI)** — ✅ Pas de cache, pas de nouvelle table, pas de traitement différencié par type de ressource, pas de support de sous-dossiers dans l'archive : le strict nécessaire pour livrer US1/US2.
- **III. Explicit Over Assumed** — ✅ Aucune ambiguïté à impact produit restante ; les choix d'implémentation (lecture à la demande, ordre de priorité des fichiers, limite de taille) étaient déjà documentés en Assumptions du spec.
- **IV. Security & Data Ownership by Default** — ✅ Le nouvel endpoint réutilise `ResourceService.GetVisibleResourceAsync` (même garde de visibilité que `GetById`/`Download` existants) — une ressource d'équipe privée reste invisible à un non-membre, y compris pour son aperçu (FR-004/SC-004).
- **V. Consistent, Boring Stack** — ✅ Backend : `System.IO.Compression` fait partie du BCL .NET, aucune dépendance ajoutée. Frontend : **`react-markdown` + `rehype-sanitize` sont de nouvelles dépendances**, justifiées car aucun outil déjà adopté ne fait de rendu Markdown sûr (React seul ne parse pas le Markdown, et injecter du HTML non assaini via `dangerouslySetInnerHTML` violerait FR-008) — combo standard et maintenu dans l'écosystème React pour ce besoin exact.
- **VI. Reproducible Local Environment** — ✅ Aucun changement à `docker-compose.yml` ni au flux de développement local ; le endpoint utilise le même client MinIO interne déjà configuré.

Aucune violation nécessitant la table Complexity Tracking.

## Project Structure

### Documentation (this feature)

```text
specs/010-apercu-contenu/
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
├── Services/
│   └── ResourcePreviewService.cs   # NOUVEAU : extraction du fichier candidat depuis un flux d'archive
├── Controllers/
│   └── ResourcesController.cs      # + GET /api/resources/{id}/preview
└── Models/Dtos/
    └── ResourceDtos.cs             # + ResourcePreviewDto

backend/SkillForge.Api.Tests/
└── ResourcePreviewServiceTests.cs  # NOUVEAU

frontend/
├── package.json                     # + react-markdown, rehype-sanitize
├── src/
│   ├── api/resources.ts             # + getResourcePreview(id)
│   ├── components/
│   │   └── ResourcePreview.tsx      # NOUVEAU : composant d'affichage (chargement/disponible/tronqué/absent)
│   └── pages/ResourcePage.tsx       # + <ResourcePreview resourceId={...} />
└── tests/
    └── ResourcePreview.test.tsx     # NOUVEAU
```

**Structure Decision**: Application web existante (frontend + backend séparés,
inchangé). Cette feature ajoute un service d'extraction ciblé côté backend
et un composant d'affichage côté frontend, sans toucher à la structure des
features précédentes (résolution, teams, CLI).

## Complexity Tracking

*Aucune violation à justifier — section non applicable.*
