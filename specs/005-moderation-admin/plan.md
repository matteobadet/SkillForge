# Implementation Plan: Modération admin

**Branch**: `005-moderation-admin` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-moderation-admin/spec.md`

## Summary

Dernière feature du MVP : accorder au rôle `Admin` le droit de supprimer
n'importe quelle ressource (moderation, feature 003), et corriger l'annuaire
des équipes (`GET /api/teams`, feature 002) pour qu'il respecte enfin sa
propre spec (FR-008 : Admin voit aussi les équipes privées). Aucune
nouvelle entité, aucun nouveau projet — extension ciblée de l'autorisation
existante.

## Technical Context

**Language/Version**: C# / .NET 9 (backend, même projet).

**Primary Dependencies**: Aucune nouvelle dépendance.

**Storage**: Inchangé (pas de migration nécessaire — aucune nouvelle
colonne/table).

**Testing**: xUnit, extension de `TeamServiceTests`/`ResourceServiceTests`
existants.

**Target Platform**: Identique aux features précédentes.

**Project Type**: Extension du backend existant uniquement (frontend :
petit ajustement d'affichage conditionnel, pas de nouvelle page).

**Performance Goals**: Non applicable.

**Constraints**: Ne pas élargir le pouvoir Admin au-delà de la suppression
(FR-002) — un Admin ne doit pas pouvoir éditer le contenu d'un tiers.

**Scale/Scope**: Changement ciblé sur 2 endpoints existants.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md rédigé à partir du scope "admin minimal" déjà validé par l'utilisateur avant la feature 001 — aucune nouvelle question bloquante, cohérent avec une feature de fermeture de MVP. |
| II. Scope Discipline (YAGNI) | PASS | Pas de bannissement, pas de file de signalements, pas de suppression d'équipe, pas de tableau de bord dédié — tous explicitement écartés dans spec.md/Assumptions, conformes au choix "minimal" déjà fait. |
| III. Explicit Over Assumed | PASS | Aucune ambiguïté produit restante à ce stade ; le seul point technique (portée exacte : suppression seule, pas édition) est explicité en FR-002. |
| IV. Security & Data Ownership | PASS | Le droit de suppression Admin est vérifié côté serveur (nouvelle condition dans `ResourcesController.Delete`), jamais côté client ; le rôle `Admin` reste non auto-attribuable (feature 001, FR-012, inchangé). |
| V. Consistent, Boring Stack | PASS | Aucun nouvel outil, extension de code existant uniquement. |
| VI. Reproducible Local Environment | PASS | Aucun changement de schéma de données, donc aucun impact sur `docker compose up` / migrations. |

Aucune violation → Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/005-moderation-admin/
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
├── Services/
│   └── TeamService.cs                # modifié : ListPublicTeamsAsync -> ListDirectoryTeamsAsync(isAdmin)
├── Controllers/
│   ├── TeamsController.cs            # modifié : ListPublic utilise ListDirectoryTeamsAsync(IsAdmin)
│   └── ResourcesController.cs        # modifié : Delete autorise aussi IsAdmin ; ToDetailDtoAsync expose CanDelete
└── Models/Dtos/
    └── ResourceDtos.cs               # modifié : ResourceDetailDto + champ CanDelete

frontend/src/
├── api/resources.ts                  # modifié : ResourceDetail + canDelete
└── pages/ResourcePage.tsx            # modifié : bouton Supprimer visible si canDelete (au lieu de canManage)
```

**Structure Decision**: Aucun nouveau fichier de premier niveau — cette
feature modifie des fichiers déjà existants des features 002/003, cohérent
avec son caractère de correctif ciblé + petite extension, pas de nouvelle
sous-structure à justifier.

## Complexity Tracking

Aucune violation de la constitution à justifier.
