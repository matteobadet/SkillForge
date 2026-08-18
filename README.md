# SkillForge

Plateforme auto-hébergée pour stocker et partager des Skills, MCP et Agents
Claude au sein d'un cercle d'amis (équipes publiques/privées, upvote,
modération). Développée en [Spec-Driven Development](https://github.com/github/spec-kit) —
chaque fonctionnalité est documentée dans `specs/<NNN>-<nom>/` (spec, plan,
tâches) avant son implémentation.

## Stack

- Frontend : React + Vite + TypeScript
- API : ASP.NET Core (.NET 9)
- Base de données : PostgreSQL (EF Core)
- Stockage fichiers : MinIO (S3-compatible)
- Orchestration locale : Docker Compose

## Démarrage

Prérequis : Docker Desktop.

```bash
cp .env.example .env
docker compose up --build
```

- Frontend : http://localhost:5173
- API : http://localhost:5080 (santé : `GET /health`)
- Console MinIO : http://localhost:9001

Les migrations de base de données s'appliquent automatiquement au démarrage
de l'API.

### Créer le premier compte Admin

Aucune promotion Admin n'est possible depuis l'application (décision
volontaire, cf. [specs/001-socle-auth-bdd/spec.md](specs/001-socle-auth-bdd/spec.md#FR-012)).
Après inscription d'un compte via l'UI ou `/api/auth/register`, promouvoir
manuellement en base :

```sql
UPDATE users SET "Role" = 'Admin' WHERE "Email" = 'vous@example.com';
```

(Les noms de colonnes sont en PascalCase, générés tels quels par EF Core —
d'où les guillemets doubles, obligatoires pour PostgreSQL avec une casse
mixte.)

## Déploiement production

SkillForge tourne en production sur un VPS unique via Kubernetes (k3s) :
frontend sur [skillforge.mbadet.fr](https://skillforge.mbadet.fr), API sur
`api.skillforge.mbadet.fr`. Manifests, décisions techniques et guide de
déploiement dans
[specs/009-deploiement-k8s](specs/009-deploiement-k8s/spec.md) ; les
manifests eux-mêmes sont dans [`k8s/`](k8s/). Chaque push sur `main`
modifiant `backend/` ou `frontend/` déclenche automatiquement un nouveau
déploiement via GitHub Actions
([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)).

## Tests

```bash
# Backend
cd backend && dotnet test

# Frontend
cd frontend && npm run test
```

## Structure du dépôt

```text
backend/SkillForge.Api/      # API ASP.NET Core
backend/SkillForge.Api.Tests/
frontend/                    # SPA React + Vite
cli/                         # CLI de synchronisation (voir cli/README.md)
specs/                       # Spécifications Spec Kit (spec/plan/tasks par feature)
docker-compose.yml
.env.example
```

## Fonctionnalités (roadmap MVP)

| # | Feature | Statut |
|---|---|---|
| 001 | Socle auth / BDD / Docker | ✅ Implémentée |
| 002 | Gestion des équipes | ✅ Implémentée |
| 003 | Publication / store de ressources | ✅ Implémentée |
| 004 | CLI de synchronisation | ✅ Implémentée |
| 005 | Modération admin | ✅ Implémentée |
| 006 | Passe de style UI (post-MVP) | ✅ Implémentée |
| 007 | Icônes équipes/ressources + cards (post-MVP) | ✅ Implémentée |
| 008 | Recherche/filtres + corrections de champs (post-MVP) | ✅ Implémentée |
| 009 | Déploiement production sur VPS via Kubernetes (post-MVP) | ✅ Implémentée |
| 010 | Aperçu du contenu d'une ressource (post-MVP) | ✅ Implémentée |
| 011 | Historique de versions des ressources (post-MVP) | ✅ Implémentée |

Voir [.specify/memory/constitution.md](.specify/memory/constitution.md) pour
les principes directeurs du projet.
