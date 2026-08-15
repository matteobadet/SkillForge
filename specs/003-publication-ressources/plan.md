# Implementation Plan: Publication / store de ressources

**Branch**: `003-publication-ressources` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-publication-ressources/spec.md`

## Summary

Ajouter la publication et le téléchargement de ressources (Skills/MCP/Agents,
archives ZIP génériques non validées) dans l'espace d'une équipe, une vue
"store" transverse listant toutes les ressources visibles par l'utilisateur,
et un système d'upvote à bascule. Réutilise MinIO (feature 001) pour le
stockage de fichiers et le modèle de visibilité publique/privée (feature 002)
pour l'accès en lecture.

## Technical Context

**Language/Version**: C# / .NET 9 (backend, même projet), TypeScript / React
+ Vite (frontend, même projet)

**Primary Dependencies**: Aucune nouvelle dépendance — réutilise le SDK
`Minio` (feature 001, avec le même découpage client interne/public pour les
URLs de téléchargement) et EF Core/Npgsql déjà en place.

**Storage**: PostgreSQL, nouvelles tables `resources`, `resource_upvotes` ;
MinIO, nouveau bucket `resources` (archives ZIP).

**Testing**: xUnit pour `ResourceService` (droits d'accès, visibilité,
bascule d'upvote) ; Vitest pour un composant frontend critique.

**Target Platform**: Identique aux features précédentes (Docker Compose
local).

**Project Type**: Extension du projet web existant.

**Performance Goals**: Inchangé (usage entre amis).

**Constraints**: Taille max d'archive 50 Mo (cf. spec.md Assumptions) ;
toute lecture/écriture doit re-vérifier la visibilité d'équipe côté serveur,
jamais côté client.

**Scale/Scope**: Dizaines de ressources par équipe au plus.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md validé (1 clarification tranchée : format ZIP générique non validé) avant ce plan. |
| II. Scope Discipline (YAGNI) | PASS | Pas de validation de contenu ZIP, pas d'historique de versions, pas de tags/recherche, pas de quotas — tous explicitement écartés dans spec.md/Assumptions, cohérent avec les choix "scope minimal" déjà validés par l'utilisateur. |
| III. Explicit Over Assumed | PASS | Seul point réellement ambigu (format de package) validé avec l'utilisateur ; le reste découle directement de décisions déjà actées dans les features 001/002 ou de choix de scope déjà faits. |
| IV. Security & Data Ownership | PASS | Visibilité d'équipe re-vérifiée côté serveur pour chaque lecture/écriture de ressource (FR-003/FR-009) ; téléchargement via URL MinIO présignée publique (même pattern que les avatars) ; droits d'écriture limités au publieur ou à l'owner d'équipe (FR-007). |
| V. Consistent, Boring Stack | PASS | Même stack, mêmes projets, réutilisation directe du pattern MinIO existant. |
| VI. Reproducible Local Environment | PASS | Nouvelle migration EF Core appliquée automatiquement au démarrage ; nouveau bucket MinIO créé automatiquement au démarrage (même mécanisme que le bucket `avatars`). |

Aucune violation → Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/003-publication-ressources/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/SkillForge.Api/
├── Models/
│   ├── Resource.cs                   # nouveau
│   └── ResourceUpvote.cs             # nouveau
├── Models/Dtos/
│   └── ResourceDtos.cs               # nouveau
├── Controllers/
│   └── ResourcesController.cs        # nouveau
├── Services/
│   ├── ResourceService.cs            # nouveau (droits, visibilité, upvote)
│   └── AvatarStorageService.cs       # renommé conceptuellement réutilisé : voir research.md #1
├── Data/
│   ├── AppDbContext.cs               # modifié : DbSets Resources/ResourceUpvotes
│   └── Migrations/                   # + migration AddResources
└── Options/
    └── MinioOptions.cs               # modifié : + bucket ressources

frontend/src/
├── pages/
│   ├── StorePage.tsx                 # nouveau (vue transverse "store")
│   ├── PublishResourcePage.tsx       # nouveau (formulaire publication, dans le contexte d'une équipe)
│   └── ResourcePage.tsx              # nouveau (détail, téléchargement, upvote, édition/suppression si autorisé)
├── pages/TeamPage.tsx                # modifié : liste des ressources de l'équipe + lien "publier"
└── api/
    └── resources.ts                  # nouveau
```

**Structure Decision**: Extension du même projet `SkillForge.Api` /
`frontend`, mêmes conventions que les features 001/002. Le service de
stockage MinIO générique (upload/presigned URL/delete) introduit en feature
001 pour les avatars est factorisé (cf. research.md #1) plutôt que dupliqué
pour les archives de ressources — cohérent avec le principe Scope
Discipline (éviter deux implémentations quasi identiques).

## Complexity Tracking

Aucune violation de la constitution à justifier.
