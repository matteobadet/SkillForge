# Data Model: Gestion des équipes

## Team

| Champ | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `name` | text | not null (pas d'unicité globale requise) |
| `description` | text | nullable |
| `visibility` | text (enum applicatif) | not null, `Public` \| `Prive` |
| `created_at` | timestamptz | not null, défaut now() |

## TeamMember

| Champ | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `team_id` | uuid | FK → `Team.id`, not null, `ON DELETE CASCADE` |
| `user_id` | uuid | FK → `User.id`, not null, `ON DELETE CASCADE` |
| `role` | text (enum applicatif) | not null, `Owner` \| `Member` |
| `joined_at` | timestamptz | not null, défaut now() |

Contrainte : unique sur `(team_id, user_id)` — un utilisateur n'a qu'une
seule appartenance par équipe.

Règle : une équipe a exactement un `Owner` (celui qui l'a créée) tant que la
feature ne propose pas de transfert de propriété (cf. spec.md Assumptions).

## TeamInviteLink

| Champ | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `team_id` | uuid | FK → `Team.id`, not null, `ON DELETE CASCADE` |
| `token` | text | not null, unique, stocké en clair (cf. research.md #1 — risque moindre qu'un refresh token, doit rester consultable) |
| `created_at` | timestamptz | not null, défaut now() |
| `revoked_at` | timestamptz | nullable |

Contrainte applicative : au plus une ligne par `team_id` avec
`revoked_at IS NULL` (appliquée dans `TeamService`, pas en contrainte SQL
partielle pour rester portable — vérifiée par test).

## Relationships

```
User (1) ──── (0..N) TeamMember (N) ──── (1) Team
Team (1) ──── (0..1 actif) TeamInviteLink
```

## Access Rules (dérivées de spec.md FR-007/FR-008)

- `visibility = Public` → visible en lecture par tout utilisateur connecté.
- `visibility = Prive` → visible en lecture uniquement par ses `TeamMember`
  et par un utilisateur au rôle global `Admin`.
- Actions de gestion (retirer un membre, régénérer le lien, modifier
  l'équipe, la supprimer) → réservées au `TeamMember` avec `role = Owner`
  de cette équipe précise (le rôle global `Admin` ne donne pas ces droits
  de gestion dans cette feature, cf. spec.md Edge Cases).
