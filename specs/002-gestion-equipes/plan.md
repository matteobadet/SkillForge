# Implementation Plan: Gestion des équipes

**Branch**: `002-gestion-equipes` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-gestion-equipes/spec.md`

## Summary

Ajouter au socle (feature 001) la gestion des équipes : création (visibilité
publique/privée), adhésion via lien d'invitation permanent régénérable,
gestion des membres et du lien par l'owner, annuaire des équipes publiques,
et liste des équipes de l'utilisateur courant. Aucune gestion de ressources
(Skills/MCP/Agents) ici — uniquement l'équipe et ses membres (cf. FR-010).

## Technical Context

**Language/Version**: C# / .NET 9 (backend, même projet `SkillForge.Api`),
TypeScript / React + Vite (frontend, même projet)

**Primary Dependencies**: Aucune nouvelle dépendance — réutilise EF Core/
Npgsql, l'authentification JWT et `AppDbContext` déjà en place (feature 001).

**Storage**: PostgreSQL, nouvelles tables `teams`, `team_members`,
`team_invite_links`.

**Testing**: xUnit (AuthService-style tests unitaires pour la logique de
rôle/lien d'invitation), Vitest pour les composants frontend critiques.

**Target Platform**: Identique à la feature 001 (Docker Compose local).

**Project Type**: Extension du projet web existant (pas de nouveau projet).

**Performance Goals**: Inchangé (usage entre amis, pas d'exigence de charge).

**Constraints**: Toute action de gestion d'équipe doit être vérifiée côté
serveur (rôle `Owner` sur l'équipe ciblée, ou rôle global `Admin` pour la
consultation en lecture seule des équipes privées).

**Scale/Scope**: Dizaines d'équipes, quelques membres chacune.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md validé (4 clarifications tranchées avec l'utilisateur) avant ce plan. |
| II. Scope Discipline (YAGNI) | PASS | Pas de transfert de propriété, pas de rôles d'équipe supplémentaires, pas de gestion de ressources ici (réservée à la feature 003) — tout explicitement écarté dans spec.md/Assumptions. |
| III. Explicit Over Assumed | PASS | Rôles d'équipe, mécanique du lien d'invitation, visibilité publique, création d'équipe : tous validés avec l'utilisateur. |
| IV. Security & Data Ownership | PASS | Jeton d'invitation haché en base (même approche que les refresh tokens, feature 001) ; visibilité privée strictement vérifiée côté serveur (FR-008/SC-003) ; rôle Owner vérifié côté serveur pour toute action de gestion (FR-009). |
| V. Consistent, Boring Stack | PASS | Même stack, même projet API/Front, aucune nouvelle dépendance. |
| VI. Reproducible Local Environment | PASS | Nouvelle migration EF Core appliquée automatiquement au démarrage (mécanisme déjà en place depuis la feature 001), aucun changement à `docker-compose.yml`. |

Aucune violation → Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/002-gestion-equipes/
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
│   ├── Team.cs                       # nouveau
│   ├── TeamMember.cs                 # nouveau
│   └── TeamInviteLink.cs             # nouveau
├── Models/Dtos/
│   └── TeamDtos.cs                   # nouveau
├── Controllers/
│   └── TeamsController.cs            # nouveau
├── Services/
│   └── TeamService.cs                # nouveau (rôles, jeton d'invitation)
├── Data/
│   ├── AppDbContext.cs               # modifié : DbSets Teams/TeamMembers/TeamInviteLinks
│   └── Migrations/                   # + migration AddTeams
└── Extensions/
    └── (réutilise ClaimsPrincipalExtensions existant)

frontend/src/
├── pages/
│   ├── TeamsDirectoryPage.tsx        # nouveau (annuaire équipes publiques + mes équipes)
│   ├── CreateTeamPage.tsx            # nouveau
│   ├── TeamPage.tsx                  # nouveau (détail équipe, membres, gestion si owner)
│   └── JoinTeamPage.tsx              # nouveau (route /invite/:token)
└── api/
    └── teams.ts                      # nouveau (appels API équipes, typé)
```

**Structure Decision**: Extension du même projet `SkillForge.Api` /
`frontend` (pas de nouveau microservice) — cohérent avec la décision de la
feature 001 de ne pas sur-découper l'architecture à cette échelle. Les
nouveaux modèles/contrôleurs/services suivent exactement les mêmes
conventions de dossiers que `User`/`AuthController`/`AuthService`.

## Complexity Tracking

Aucune violation de la constitution à justifier.
