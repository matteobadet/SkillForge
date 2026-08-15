# Data Model: Publication / store de ressources

## Resource

| Champ | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `team_id` | uuid | FK → `Team.id`, not null, `ON DELETE CASCADE` |
| `publisher_user_id` | uuid | FK → `User.id`, not null, `ON DELETE CASCADE` |
| `name` | text | not null |
| `description` | text | nullable |
| `type` | text (enum applicatif) | not null, `Skill` \| `MCP` \| `Agent` |
| `object_key` | text | not null — clé de l'archive courante dans le bucket MinIO `resources` |
| `created_at` | timestamptz | not null, défaut now() |
| `updated_at` | timestamptz | not null, mis à jour à chaque republication/édition |

Contrainte : unique sur `(team_id, name)` — un nom de ressource est unique
au sein d'une équipe (cf. spec.md Assumptions, utile pour la CLI en
feature 004).

## ResourceUpvote

| Champ | Type | Contraintes |
|---|---|---|
| `id` | uuid | PK |
| `resource_id` | uuid | FK → `Resource.id`, not null, `ON DELETE CASCADE` |
| `user_id` | uuid | FK → `User.id`, not null, `ON DELETE CASCADE` |
| `created_at` | timestamptz | not null, défaut now() |

Contrainte : unique sur `(resource_id, user_id)` — un seul upvote actif par
utilisateur et par ressource (FR-006).

## Relationships

```
Team (1) ──── (0..N) Resource
User (1) ──── (0..N) Resource [publisher_user_id]
Resource (1) ──── (0..N) ResourceUpvote
User (1) ──── (0..N) ResourceUpvote
```

## Access Rules (dérivées de spec.md FR-003/FR-007, réutilisant feature 002)

- Lecture (voir/lister/télécharger/upvoter) → mêmes règles que la visibilité
  de l'équipe contenant la ressource (`Team.Visibility`).
- Écriture (modifier métadonnées, remplacer l'archive, supprimer) →
  réservée au `publisher_user_id` de la ressource, OU au `TeamMember` avec
  `role = Owner` de l'équipe contenant la ressource.
