# Data Model: Socle Auth / BDD / Docker

## User

Représente un compte de la plateforme.

| Champ | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `email` | text | unique, not null |
| `password_hash` | text | not null (sortie de `PasswordHasher<User>`) |
| `pseudo` | text | unique, not null |
| `avatar_object_key` | text | nullable — clé de l'objet dans le bucket MinIO `avatars` |
| `role` | text (enum applicatif) | not null, valeurs `Admin` \| `Utilisateur`, défaut `Utilisateur` |
| `created_at` | timestamptz | not null, défaut now() |
| `updated_at` | timestamptz | not null, mis à jour à chaque modification |

Règles de validation :
- `email` : format email valide, comparaison insensible à la casse pour
  l'unicité.
- `pseudo` : 3 à 32 caractères, unique (insensible à la casse).
- `password_hash` : jamais exposé par aucun endpoint/serialization.
- `role` : jamais modifiable par l'utilisateur lui-même via l'API de ce
  socle (aucun endpoint de self-promotion — cf. FR-012, promotion admin =
  hors applicatif pour cette feature).

## RefreshToken

Représente un refresh token émis pour un utilisateur, permettant le
renouvellement de l'access token.

| Champ | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `user_id` | uuid | FK → `User.id`, not null, `ON DELETE CASCADE` |
| `token_hash` | text | not null, unique (SHA-256 de la valeur réelle) |
| `expires_at` | timestamptz | not null |
| `revoked_at` | timestamptz | nullable — renseigné à la révocation (logout, rotation, réutilisation détectée) |
| `created_at` | timestamptz | not null, défaut now() |

Règles :
- Un refresh token présenté est valide si et seulement si `revoked_at IS
  NULL` et `expires_at > now()`.
- À chaque utilisation réussie (rotation, FR-014), le token courant est
  marqué `revoked_at = now()` et un nouveau `RefreshToken` est créé.
- Si un token déjà révoqué est présenté (indice de vol/reuse), tous les
  refresh tokens actifs de l'utilisateur sont révoqués par précaution et
  l'utilisateur doit se reconnecter.

## Relationships

```
User (1) ──── (0..N) RefreshToken
```

## State Transitions (RefreshToken)

```
[créé, actif] --(utilisé pour refresh)--> [revoked_at=now, remplacé par un nouveau token actif]
[créé, actif] --(logout explicite)------> [revoked_at=now]
[créé, actif] --(expires_at dépassé)----> [inactif, non révoqué explicitement mais rejeté au contrôle]
[révoqué] --(présenté à nouveau)---------> [rejeté + révocation en cascade des tokens actifs de l'utilisateur]
```
