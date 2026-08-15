# API Contract: Auth & Profile (`/api/auth`, `/api/users`)

Format des réponses : JSON. Erreurs : `{ "error": "<code>", "message": "<texte>" }`.
Les endpoints marqués 🔒 requièrent un header `Authorization: Bearer <access_token>`.

## POST /api/auth/register

Crée un compte (rôle `Utilisateur`) et connecte l'utilisateur.

**Body**: `{ "email": string, "password": string, "pseudo": string }`

**Responses**:
- `201 Created` → `{ "accessToken": string, "refreshToken": string, "user": UserDto }`
- `409 Conflict` → email ou pseudo déjà pris
- `400 Bad Request` → email invalide, mot de passe < 8 caractères, pseudo hors bornes

## POST /api/auth/login

**Body**: `{ "email": string, "password": string }`

**Responses**:
- `200 OK` → `{ "accessToken": string, "refreshToken": string, "user": UserDto }`
- `401 Unauthorized` → identifiants invalides (message générique, ne précise
  pas si l'email existe)

## POST /api/auth/refresh

**Body**: `{ "refreshToken": string }`

**Responses**:
- `200 OK` → `{ "accessToken": string, "refreshToken": string }` (nouveau
  refresh token — rotation, l'ancien est invalidé)
- `401 Unauthorized` → refresh token invalide, expiré ou révoqué

## POST /api/auth/logout 🔒

**Body**: `{ "refreshToken": string }`

**Responses**:
- `204 No Content` → refresh token révoqué

## GET /api/users/me 🔒

**Responses**:
- `200 OK` → `UserDto`

## PATCH /api/users/me 🔒

**Body** (tous champs optionnels): `{ "pseudo"?: string }`

**Responses**:
- `200 OK` → `UserDto` mis à jour
- `409 Conflict` → pseudo déjà pris

## POST /api/users/me/avatar 🔒

**Body**: `multipart/form-data`, champ `file` (jpeg/png/webp, ≤ 5 Mo)

**Responses**:
- `200 OK` → `UserDto` mis à jour (nouvel avatar)
- `400 Bad Request` → format ou taille invalide
- `502 Bad Gateway` → échec de communication avec MinIO (aucun état partiel :
  le profil n'est pas modifié)

## UserDto (forme commune)

```json
{
  "id": "uuid",
  "email": "string",
  "pseudo": "string",
  "avatarUrl": "string | null",
  "role": "Admin | Utilisateur",
  "createdAt": "ISO-8601"
}
```

`password_hash` et `avatar_object_key` ne sont jamais sérialisés — `avatarUrl`
est une URL de lecture générée à la volée (presigned MinIO ou route de proxy).
