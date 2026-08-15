---
description: "Task list for feature implementation"
---

# Tasks: Gestion des équipes

**Input**: Design documents from `/specs/002-gestion-equipes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/teams-api.md, quickstart.md

**Tests**: Non explicitement demandés dans la spec — tests xUnit ciblés sur
`TeamService` (rôles, visibilité, lien d'invitation) en Polish.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Extension du monorepo existant (cf. plan.md) : `backend/SkillForge.Api/`, `frontend/src/`.

---

## Phase 1: Setup

- [x] T001 [P] Créer `backend/SkillForge.Api/Models/Team.cs`, `TeamMember.cs`, `TeamInviteLink.cs` (champs selon data-model.md)
- [x] T002 [P] Créer `backend/SkillForge.Api/Models/Dtos/TeamDtos.cs` (`CreateTeamRequest`, `UpdateTeamRequest`, `TeamSummaryDto`, `TeamDetailDto`, `TeamMemberDto`, `InviteLinkResponse`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schéma de données et service de rôles — bloquant pour toutes les user stories.

- [x] T003 Ajouter les `DbSet<Team>`, `DbSet<TeamMember>`, `DbSet<TeamInviteLink>` et leurs contraintes (unique `(TeamId, UserId)`, unique `TokenHash`) dans `backend/SkillForge.Api/Data/AppDbContext.cs`
- [x] T004 Générer la migration `dotnet ef migrations add AddTeams` dans `backend/SkillForge.Api/Data/Migrations/`
- [x] T005 Créer `backend/SkillForge.Api/Services/TeamService.cs` : création d'équipe (owner auto), vérification de rôle (`IsOwnerAsync`), génération/rotation du jeton d'invitation (stocké en clair, cf. research.md #1), requêtes de visibilité filtrées (Public OR membre OR Admin — cf. research.md #5)
- [x] T006 [P] Créer `frontend/src/api/teams.ts` : fonctions typées `createTeam`, `listPublicTeams`, `listMyTeams`, `getTeam`, `updateTeam`, `deleteTeam`, `leaveTeam`, `removeMember`, `regenerateInviteLink`, `getInviteLink`, `joinTeam`

---

## Phase 3: User Story 1 - Créer une équipe (Priority: P1) 🎯 MVP

**Goal**: Un utilisateur connecté crée une équipe et en devient owner.

**Independent Test**: `POST /api/teams` puis vérifier que l'appelant apparaît en `Owner` dans la réponse (cf. quickstart.md, User Story 1).

- [x] T007 [US1] Créer `backend/SkillForge.Api/Controllers/TeamsController.cs` avec `POST /api/teams` (validation nom non vide, création `Team` + `TeamMember` Owner en une transaction)
- [x] T008 [US1] Créer `frontend/src/pages/CreateTeamPage.tsx` (formulaire nom/description/visibilité, appel `createTeam`, redirection vers la page équipe créée)
- [x] T009 [US1] Câbler la route `/teams/new` (protégée) dans `frontend/src/main.tsx`

**Checkpoint**: US1 testable de bout en bout indépendamment.

---

## Phase 4: User Story 2 - Rejoindre une équipe via lien d'invitation (Priority: P1)

**Goal**: Un utilisateur rejoint une équipe via un lien d'invitation valide.

**Independent Test**: Générer un lien en tant qu'owner, l'utiliser avec un autre compte, vérifier l'ajout comme `Member` (cf. quickstart.md, User Story 2).

- [x] T010 [US2] Ajouter `GET /api/teams/{id}/invite-link` et `POST /api/teams/{id}/invite-link/regenerate` dans `TeamsController.cs` (Owner uniquement, 403 sinon)
- [x] T011 [US2] Ajouter `POST /api/teams/join/{token}` dans `TeamsController.cs` (idempotent si déjà membre, 404 si jeton invalide/révoqué)
- [x] T012 [US2] Créer `frontend/src/pages/JoinTeamPage.tsx` (route `/invite/:token`, appelle `joinTeam` au montage, affiche succès/erreur, lien vers la page équipe)
- [x] T013 [US2] Câbler la route `/invite/:token` (protégée — redirige vers `/login` puis revient si non connecté) dans `frontend/src/main.tsx`
- [x] T014 [US2] Afficher/copier le lien d'invitation dans `frontend/src/pages/TeamPage.tsx` (visible seulement si owner — dépend de T017)

**Checkpoint**: US2 testable de bout en bout (nécessite US1 pour avoir une équipe).

---

## Phase 5: User Story 4 - Parcourir l'annuaire des équipes publiques (Priority: P2)

**Goal**: Lister les équipes publiques et consulter leur page.

**Independent Test**: `GET /api/teams` liste les équipes publiques ; `GET /api/teams/{id}` sur une équipe privée par un non-membre renvoie 404 (cf. quickstart.md, User Story 4).

- [x] T015 [US4] Ajouter `GET /api/teams` (annuaire public) et `GET /api/teams/mine` dans `TeamsController.cs`, appuyés sur les requêtes filtrées de `TeamService` (cf. T005)
- [x] T016 [US4] Ajouter `GET /api/teams/{id}` dans `TeamsController.cs` (404 si privée et appelant non-membre/non-Admin — jamais 403, cf. contracts/teams-api.md)
- [x] T017 [US4] Créer `frontend/src/pages/TeamPage.tsx` (détail équipe : nom, description, liste des membres ; actions de gestion visibles seulement si `myRole === "Owner"`)
- [x] T018 [US4] Créer `frontend/src/pages/TeamsDirectoryPage.tsx` (deux listes : "Mes équipes" via `listMyTeams`, "Équipes publiques" via `listPublicTeams`, lien vers `/teams/new`)
- [x] T019 [US4] Câbler les routes `/teams` et `/teams/:id` (protégées) dans `frontend/src/main.tsx`

**Checkpoint**: Annuaire et pages d'équipe navigables de bout en bout.

---

## Phase 6: User Story 3 - Gérer les membres et le lien d'invitation (Priority: P2)

**Goal**: L'owner retire un membre ; la gestion est refusée à un non-owner.

**Independent Test**: Retrait d'un membre par l'owner (200/204) puis par un non-owner (403) (cf. quickstart.md, User Story 3).

- [x] T020 [US3] Ajouter `DELETE /api/teams/{id}/members/{userId}` dans `TeamsController.cs` (Owner uniquement, 400 si cible = owner lui-même)
- [x] T021 [US3] Ajouter `PATCH /api/teams/{id}` et `DELETE /api/teams/{id}` dans `TeamsController.cs` (Owner uniquement)
- [x] T022 [US3] Ajouter les actions "Retirer", "Modifier", "Supprimer l'équipe" dans `frontend/src/pages/TeamPage.tsx` (visibles seulement si owner, confirmation avant suppression)

**Checkpoint**: Gestion d'équipe complète et protégée côté serveur.

---

## Phase 7: User Story 5 - Quitter une équipe (Priority: P3)

**Goal**: Un membre non-owner quitte une équipe ; l'owner ne le peut pas.

**Independent Test**: `POST /api/teams/{id}/leave` par un membre (204) puis par l'owner (409) (cf. quickstart.md, User Story 5).

- [x] T023 [US5] Ajouter `POST /api/teams/{id}/leave` dans `TeamsController.cs` (409 si appelant = owner)
- [x] T024 [US5] Ajouter le bouton "Quitter l'équipe" dans `frontend/src/pages/TeamPage.tsx` (visible seulement si membre non-owner)

**Checkpoint**: Cycle de vie complet d'une adhésion (rejoindre → quitter).

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T025 [P] Ajouter `backend/SkillForge.Api.Tests/TeamServiceTests.cs` : création (owner auto), unicité d'adhésion (no-op si déjà membre), rotation de lien (ancien devient invalide), filtrage de visibilité (équipe privée absente pour un non-membre)
- [x] T026 Vérifier qu'aucune équipe privée ne fuite dans `GET /api/teams` ni `GET /api/teams/{id}` pour un utilisateur non-membre/non-Admin (test dédié SC-003)
- [x] T027 Mettre à jour `README.md` (racine) : cocher la feature 002 dans le tableau roadmap, mentionner les nouvelles routes principales

---

## Dependencies & Execution Order

- **Phase 1 → Phase 2** : bloquant.
- **Phase 3 (US1)** : dépend de Phase 2 uniquement. MVP minimal de cette feature.
- **Phase 4 (US2)** : dépend de US1 (il faut une équipe pour générer un lien).
- **Phase 5 (US4)** : dépend de Phase 2 ; peut être développée en parallèle de US2 (fichiers distincts), mais son test manuel complet nécessite qu'une équipe publique et une équipe privée existent (US1).
- **Phase 6 (US3)** : dépend de US1 (et bénéficie de US2 pour avoir un membre à retirer).
- **Phase 7 (US5)** : dépend de US2 (il faut un membre non-owner, donc une adhésion réussie).
- **Phase 8 (Polish)** : après toutes les user stories.

## Parallel Execution Examples

- Phase 1 : T001 et T002 en parallèle (fichiers distincts).
- Phase 4/5 : les tâches backend de T010-T011 (US2) et T015-T016 (US4) touchent le même fichier `TeamsController.cs` — à faire séquentiellement malgré l'indépendance fonctionnelle ; en revanche T006 (frontend) peut avancer en parallèle du backend dès les DTOs (T002) posés.

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1)** : créer une équipe et en être
owner — démontrable mais peu utile seul.

**Incrément recommandé pour une démo complète** : US1 → US2 (rejoindre) →
US4 (annuaire/consultation) → US3 (gestion) → US5 (quitter) → Polish, dans
cet ordre, avant de considérer la feature 002 validée (cf. constitution,
principe I).
