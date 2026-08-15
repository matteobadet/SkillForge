# Implementation Plan: Socle Auth / BDD / Docker

**Branch**: `001-socle-auth-bdd` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-socle-auth-bdd/spec.md`

## Summary

Mettre en place le socle applicatif de SkillForge : comptes utilisateurs
(email + mot de passe), authentification JWT (access token court + refresh
token à rotation), rôles `Admin`/`Utilisateur` vérifiés côté serveur, profil
utilisateur (pseudo + avatar stocké dans MinIO), et un environnement Docker
Compose reproductible (PostgreSQL, MinIO, API, Front) avec migrations
appliquées automatiquement au démarrage. Ce socle ne contient aucune logique
d'équipes ni de ressources publiées — uniquement identité et infrastructure.

## Technical Context

**Language/Version**: C# / .NET 9 (backend), TypeScript / Node 24 (frontend
tooling)

**Primary Dependencies**:
- Backend : ASP.NET Core Web API (.NET 9), Entity Framework Core + Npgsql
  (accès PostgreSQL), `Microsoft.AspNetCore.Authentication.JwtBearer` +
  `System.IdentityModel.Tokens.Jwt` (émission/validation JWT),
  `Microsoft.AspNetCore.Identity` — uniquement la classe `PasswordHasher<T>`
  (hachage PBKDF2), SDK `Minio` officiel (upload/download avatar vers MinIO).
- Frontend : React 18 + Vite + TypeScript, React Router (navigation),
  un client HTTP simple (fetch wrappé) pour appeler l'API et gérer le
  rafraîchissement de token.

**Storage**: PostgreSQL (tables `users`, `refresh_tokens`) ; MinIO
(bucket `avatars`) pour les fichiers d'avatar.

**Testing**: xUnit pour l'API (tests d'intégration sur les endpoints d'auth
via `WebApplicationFactory`) ; Vitest + React Testing Library pour le front
(tests ciblés sur les formulaires login/signup/profil).

**Target Platform**: Conteneurs Linux (Docker), développement local
multi-plateforme (Windows/macOS/Linux via Docker Desktop).

**Project Type**: Application web (backend API + frontend SPA), monorepo.

**Performance Goals**: Pas d'exigence de charge spécifique (usage entre amis,
dizaines d'utilisateurs) — pas d'optimisation prématurée.

**Constraints**: Démarrage complet via `docker compose up` avec un seul
fichier `.env` (copié depuis `.env.example`) ; aucun secret commité.

**Scale/Scope**: Dizaines d'utilisateurs, un seul environnement (dev local +
future prod auto-hébergée) — pas de contrainte de scalabilité massive
(constitution, principe II).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md validé (avec 4 clarifications résolues) avant ce plan. |
| II. Scope Discipline (YAGNI) | PASS | Un seul projet API (pas de séparation Domain/Infra artificielle à cette échelle) ; pas d'email de vérification, pas de reset mdp, pas d'endpoint de promotion Admin — hors périmètre validé. |
| III. Explicit Over Assumed | PASS | Politique mdp, bootstrap Admin, politique d'inscription, rotation refresh token : tous validés avec l'utilisateur (cf. spec.md). |
| IV. Security & Data Ownership | PASS | Mots de passe hachés (PBKDF2 via `PasswordHasher<T>`), JWT court + refresh token à rotation (haché en base), rôle vérifié côté serveur via middleware d'autorisation, secrets uniquement en `.env` (gitignore). |
| V. Consistent, Boring Stack | PASS | React+Vite, ASP.NET Core, PostgreSQL, MinIO, Docker Compose — aucun nouvel outil hors de la stack actée. |
| VI. Reproducible Local Environment | PASS | `docker compose up` démarre API+DB+MinIO+Front ; migrations EF Core appliquées automatiquement au démarrage de l'API. |

Aucune violation → la section Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/001-socle-auth-bdd/
├── plan.md              # Ce fichier
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/           # Phase 1 (OpenAPI-style description des endpoints)
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
backend/
├── SkillForge.Api/
│   ├── Program.cs                  # Bootstrap, DI, JWT config, migration au démarrage
│   ├── Controllers/
│   │   ├── AuthController.cs       # POST /api/auth/register, /login, /refresh, /logout
│   │   └── UsersController.cs      # GET/PATCH /api/users/me (pseudo, avatar)
│   ├── Data/
│   │   ├── AppDbContext.cs
│   │   └── Migrations/
│   ├── Models/
│   │   ├── User.cs
│   │   └── RefreshToken.cs
│   ├── Services/
│   │   ├── AuthService.cs          # hashing, émission/validation JWT, rotation refresh token
│   │   └── AvatarStorageService.cs # upload/download vers MinIO
│   ├── appsettings.json
│   └── Dockerfile
└── SkillForge.Api.Tests/
    └── AuthEndpointsTests.cs

frontend/
├── src/
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── SignupPage.tsx
│   │   └── ProfilePage.tsx
│   ├── components/
│   ├── api/
│   │   └── client.ts                # fetch wrapper + refresh transparent sur 401
│   ├── auth/
│   │   └── AuthContext.tsx
│   └── main.tsx
├── index.html
├── vite.config.ts
└── Dockerfile

docker-compose.yml
.env.example
```

**Structure Decision**: Monorepo à deux dossiers de premier niveau
(`backend/`, `frontend/`) + `docker-compose.yml` à la racine. Le backend est
**un seul** projet ASP.NET Core (pas de découpage Domain/Application/
Infrastructure façon Clean Architecture) : à l'échelle de ce projet
(quelques entités, équipe d'un développeur), une séparation en couches
multiples ajouterait de l'indirection sans bénéfice mesurable — cohérent
avec le principe II (Scope Discipline / YAGNI) de la constitution. Cette
structure `backend/SkillForge.Api` + `frontend/` sera réutilisée telle
quelle par les features suivantes (les nouvelles entités/contrôleurs
s'ajoutent dans les mêmes dossiers `Models/`, `Controllers/`, `Services/`).

## Complexity Tracking

Aucune violation de la constitution à justifier.
