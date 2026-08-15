# Quickstart: Socle Auth / BDD / Docker

## Prérequis

- Docker Desktop (avec Docker Compose v2) installé et démarré.

## Démarrage

```bash
cp .env.example .env
docker compose up --build
```

Ceci démarre : PostgreSQL (`db`), MinIO (`storage`), l'API ASP.NET Core
(`api`, sur `http://localhost:5080`), le front React+Vite (`frontend`, sur
`http://localhost:5173`). Les migrations EF Core s'appliquent
automatiquement au démarrage de `api`.

## Scénario de validation — User Story 1 (inscription + connexion)

```bash
curl -X POST http://localhost:5080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"ami@example.com","password":"motdepasse123","pseudo":"ami1"}'
# -> 201, contient accessToken + refreshToken

curl -X POST http://localhost:5080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"ami@example.com","password":"motdepasse123"}'
# -> 200, contient accessToken + refreshToken
```

## Scénario de validation — User Story 2 (refresh + logout)

```bash
curl -X POST http://localhost:5080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken obtenu au login>"}'
# -> 200, nouveau accessToken + nouveau refreshToken (l'ancien est révoqué)

curl -X POST http://localhost:5080/api/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"<refreshToken courant>"}'
# -> 204 ; un nouveau /refresh avec ce token doit ensuite renvoyer 401
```

## Scénario de validation — User Story 3 (profil)

```bash
curl -X PATCH http://localhost:5080/api/users/me \
  -H "Authorization: Bearer <accessToken>" \
  -H "Content-Type: application/json" \
  -d '{"pseudo":"nouveauPseudo"}'
# -> 200, pseudo mis à jour

curl -X POST http://localhost:5080/api/users/me/avatar \
  -H "Authorization: Bearer <accessToken>" \
  -F "file=@./avatar.png"
# -> 200, avatarUrl mis à jour
```

## Scénario de validation — User Story 4 (env reproductible)

Sur une machine propre (ou `docker compose down -v` pour repartir de zéro) :

```bash
git clone <repo>
cd SkillForge
cp .env.example .env
docker compose up --build
```

Attendu : les 4 services démarrent sans intervention manuelle supplémentaire,
et l'appel `GET http://localhost:5080/health` (ou équivalent) répond `200`.

## Bootstrap du premier compte Admin (FR-012)

Après inscription d'un premier compte via `/api/auth/register`, un opérateur
le promeut manuellement en base :

```sql
UPDATE users SET role = 'Admin' WHERE email = 'ami@example.com';
```

Aucun endpoint applicatif ne permet cette promotion dans ce socle (décision
validée — cf. spec.md FR-012).
