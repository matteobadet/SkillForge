---
description: "Task list for feature implementation"
---

# Tasks: Socle Auth / BDD / Docker

**Input**: Design documents from `/specs/001-socle-auth-bdd/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/auth-api.md, quickstart.md

**Tests**: Non explicitement demandés dans la spec — tests xUnit/Vitest inclus
en Polish uniquement pour les chemins critiques (auth), pas en TDD strict.

## Format: `[ID] [P?] [Story] Description`

## Path Conventions

Web app monorepo (cf. plan.md) : `backend/SkillForge.Api/`, `frontend/src/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Structure de dépôt et scaffolding des projets.

- [ ] T001 Créer l'arborescence `backend/`, `frontend/` à la racine du dépôt
- [ ] T002 Scaffolder le projet ASP.NET Core Web API dans `backend/SkillForge.Api/` (`dotnet new webapi`, cible .NET 9) et le projet de test `backend/SkillForge.Api.Tests/` (`dotnet new xunit`)
- [ ] T003 Ajouter les packages NuGet à `backend/SkillForge.Api/SkillForge.Api.csproj` : `Microsoft.EntityFrameworkCore.Design`, `Npgsql.EntityFrameworkCore.PostgreSQL`, `Microsoft.AspNetCore.Authentication.JwtBearer`, `System.IdentityModel.Tokens.Jwt`, `Microsoft.AspNetCore.Identity`, `Minio`
- [ ] T004 Scaffolder le projet frontend dans `frontend/` (`npm create vite@latest . -- --template react-ts`)
- [ ] T005 [P] Ajouter `frontend/package.json` : dépendance `react-router-dom`
- [ ] T006 [P] Créer `.env.example` à la racine (variables : `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD`, `MINIO_BUCKET_AVATARS`, `JWT_SIGNING_KEY`, `JWT_ISSUER`, `API_PORT`, `FRONTEND_PORT`)
- [ ] T007 Créer `docker-compose.yml` à la racine avec les services `db` (postgres:16), `storage` (minio/minio), `api` (build `backend/SkillForge.Api/Dockerfile`), `frontend` (build `frontend/Dockerfile`) et un réseau partagé, en consommant les variables de `.env`
- [ ] T008 [P] Créer `backend/SkillForge.Api/Dockerfile` (build + run .NET 9)
- [ ] T009 [P] Créer `frontend/Dockerfile` (dev server Vite exposé sur `FRONTEND_PORT`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schéma de données, DbContext, config JWT/MinIO — bloquant pour toutes les user stories.

**⚠️ CRITICAL**: Aucune user story ne peut être implémentée avant la fin de cette phase.

- [ ] T010 Créer le modèle `User` dans `backend/SkillForge.Api/Models/User.cs` (champs selon data-model.md)
- [ ] T011 Créer le modèle `RefreshToken` dans `backend/SkillForge.Api/Models/RefreshToken.cs` (champs selon data-model.md)
- [ ] T012 Créer `backend/SkillForge.Api/Data/AppDbContext.cs` (DbSets `Users`, `RefreshTokens`, contraintes unique sur `Email`, `Pseudo`, `TokenHash`)
- [ ] T013 Générer la migration initiale `dotnet ef migrations add InitialCreate` dans `backend/SkillForge.Api/Data/Migrations/`
- [ ] T014 Configurer `backend/SkillForge.Api/Program.cs` : lecture config depuis variables d'environnement, enregistrement `AppDbContext` (Npgsql), appel `dbContext.Database.Migrate()` au démarrage
- [ ] T015 Configurer l'authentification JWT Bearer dans `backend/SkillForge.Api/Program.cs` (validation issuer/signature, mapping du rôle dans les claims)
- [ ] T016 [P] Créer `backend/SkillForge.Api/Services/AuthService.cs` : hachage/vérification mot de passe (`PasswordHasher<User>`), émission JWT, génération + hachage SHA-256 des refresh tokens, logique de rotation/révocation (cf. data-model.md)
- [ ] T017 [P] Créer `backend/SkillForge.Api/Services/AvatarStorageService.cs` : client `Minio`, création du bucket `avatars` si absent, upload/suppression d'objet, génération d'URL de lecture
- [ ] T018 Ajouter un endpoint `GET /health` dans `backend/SkillForge.Api/Program.cs` (vérifie la connexion DB) pour la validation de l'environnement (cf. quickstart.md)
- [ ] T019 [P] Créer `frontend/src/api/client.ts` : wrapper fetch, stockage des tokens, rafraîchissement transparent sur réponse 401 via `/api/auth/refresh`
- [ ] T020 [P] Créer `frontend/src/auth/AuthContext.tsx` : état d'authentification global (user courant, login/logout/register)

---

## Phase 3: User Story 1 - Créer un compte et se connecter (Priority: P1) 🎯 MVP

**Goal**: Un visiteur peut créer un compte et se connecter, recevant des tokens valides.

**Independent Test**: `POST /api/auth/register` puis `POST /api/auth/login` avec les mêmes identifiants (cf. quickstart.md, scénario User Story 1).

- [ ] T021 [US1] Créer les DTOs `RegisterRequest`, `LoginRequest`, `AuthResponse`, `UserDto` dans `backend/SkillForge.Api/Models/Dtos/AuthDtos.cs`
- [ ] T022 [US1] Créer `backend/SkillForge.Api/Controllers/AuthController.cs` avec `POST /api/auth/register` (validation email/pseudo/mot de passe ≥ 8 caractères, 409 si email/pseudo pris, 201 + tokens sinon)
- [ ] T023 [US1] Ajouter `POST /api/auth/login` dans `AuthController.cs` (401 générique si échec, 200 + tokens sinon)
- [ ] T024 [US1] Créer `frontend/src/pages/SignupPage.tsx` (formulaire email/mot de passe/pseudo, appel register, redirection après succès)
- [ ] T025 [US1] Créer `frontend/src/pages/LoginPage.tsx` (formulaire email/mot de passe, appel login, redirection après succès)
- [ ] T026 [US1] Câbler les routes `/signup` et `/login` dans `frontend/src/main.tsx` (react-router)

**Checkpoint**: US1 testable de bout en bout indépendamment.

---

## Phase 4: User Story 4 - Environnement de développement reproductible (Priority: P1)

**Goal**: `docker compose up` démarre toute la stack sans étape manuelle additionnelle.

**Independent Test**: Sur un checkout propre, `cp .env.example .env && docker compose up --build` puis `GET /health` répond 200 (cf. quickstart.md, scénario User Story 4).

- [ ] T027 [US4] Vérifier/ajuster `docker-compose.yml` : healthchecks sur `db` et `storage`, `depends_on` avec `condition: service_healthy` pour `api`
- [ ] T028 [US4] Documenter dans `README.md` (racine) la procédure de démarrage en 3 commandes (clone, `cp .env.example .env`, `docker compose up --build`)
- [ ] T029 [US4] Valider manuellement le scénario "machine propre" du quickstart.md (down -v puis up) et corriger tout écart

**Checkpoint**: Stack complète démarrable en une commande documentée.

---

## Phase 5: User Story 2 - Rester connecté via le refresh token (Priority: P1)

**Goal**: Renouvellement transparent de l'access token et révocation à la déconnexion.

**Independent Test**: `POST /api/auth/refresh` avec un refresh token valide renvoie de nouveaux tokens ; `POST /api/auth/logout` puis un nouveau `/refresh` avec le même token renvoie 401 (cf. quickstart.md, scénario User Story 2).

- [ ] T030 [US2] Ajouter `POST /api/auth/refresh` dans `AuthController.cs` (rotation via `AuthService`, 401 si invalide/expiré/révoqué, révocation en cascade si réutilisation d'un token révoqué détectée)
- [ ] T031 [US2] Ajouter `POST /api/auth/logout` (🔒) dans `AuthController.cs` (révoque le refresh token fourni)
- [ ] T032 [US2] Intégrer le refresh transparent dans `frontend/src/api/client.ts` (retry automatique après 401 + refresh réussi)
- [ ] T033 [US2] Ajouter l'action logout dans `frontend/src/auth/AuthContext.tsx` (appel `/api/auth/logout`, purge des tokens locaux)

**Checkpoint**: Session persistante + déconnexion fonctionnelles de bout en bout.

---

## Phase 6: User Story 3 - Modifier son profil (pseudo et avatar) (Priority: P2)

**Goal**: Un utilisateur connecté modifie pseudo et avatar.

**Independent Test**: `PATCH /api/users/me` puis `POST /api/users/me/avatar` (cf. quickstart.md, scénario User Story 3).

- [ ] T034 [P] [US3] Créer `backend/SkillForge.Api/Controllers/UsersController.cs` avec `GET /api/users/me` (🔒)
- [ ] T035 [US3] Ajouter `PATCH /api/users/me` (🔒) dans `UsersController.cs` (409 si pseudo déjà pris)
- [ ] T036 [US3] Ajouter `POST /api/users/me/avatar` (🔒) dans `UsersController.cs` (validation format/taille, appel `AvatarStorageService`, 502 si MinIO indisponible sans état partiel)
- [ ] T037 [US3] Créer `frontend/src/pages/ProfilePage.tsx` (édition pseudo, upload avatar, affichage de l'avatar courant)
- [ ] T038 [US3] Câbler la route `/profile` (protégée) dans `frontend/src/main.tsx`

**Checkpoint**: Édition de profil fonctionnelle de bout en bout.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Fiabilisation avant validation utilisateur finale de la feature.

- [ ] T039 [P] Ajouter `backend/SkillForge.Api.Tests/AuthEndpointsTests.cs` (register/login/refresh/logout, via `WebApplicationFactory` + PostgreSQL de test)
- [ ] T040 [P] Ajouter des tests Vitest ciblés sur `LoginPage.tsx` et `SignupPage.tsx` dans `frontend/src/pages/__tests__/`
- [ ] T041 Vérifier qu'aucun secret n'apparaît dans les logs (`AuthService`, middleware d'exceptions) — cf. SC-004
- [ ] T042 Relecture finale de `README.md` (racine) : prérequis, démarrage, endpoints principaux, lien vers `specs/001-socle-auth-bdd/`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** : bloquant, doit être fini avant toute user story.
- **Phase 3 (US1)** : dépend uniquement de Phase 2. C'est le MVP minimal.
- **Phase 4 (US4)** : dépend de Phase 1 (docker-compose, Dockerfiles) et peut être validée en parallèle de US1 dès que Phase 2 tourne dans les conteneurs.
- **Phase 5 (US2)** : dépend de US1 (le login doit exister pour obtenir un premier refresh token à tester).
- **Phase 6 (US3)** : dépend de US1 (nécessite un utilisateur connecté) ; indépendante de US2.
- **Phase 7 (Polish)** : après toutes les user stories ciblées pour cette itération.

## Parallel Execution Examples

- Phase 1 : T005, T006, T008, T009 en parallèle (fichiers distincts).
- Phase 2 : T016 et T017 en parallèle (services indépendants) ; T019 et T020 en parallèle (frontend, fichiers distincts).
- Phase 6 : T034 peut démarrer en parallèle du reste de Phase 5 dès que Phase 2 est terminée (fichier distinct, dépend seulement de l'auth déjà en place côté middleware).

## Implementation Strategy

**MVP = Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US4)** : un utilisateur
peut créer un compte, se connecter, et la stack est démarrable en une
commande — livrable démontrable minimal.

Incrément suivant : Phase 5 (US2, session persistante) puis Phase 6 (US3,
profil), puis Phase 7 (Polish) avant de considérer la feature 001 comme
validée et clôturée (cf. constitution, principe I : validation utilisateur
avant de passer à la feature 002).
