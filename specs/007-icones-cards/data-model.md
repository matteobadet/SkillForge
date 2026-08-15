# Data Model: Icônes équipes/ressources et affichage en cards

## Team (champs ajoutés)

| Champ | Type | Contraintes |
|---|---|---|
| `icon_preset` | text | nullable — identifiant d'icône `lucide-react` (ex. `"Rocket"`) |
| `icon_object_key` | text | nullable — clé de l'image uploadée dans le bucket MinIO `icons` |

Règle : au plus un des deux est non-null à un instant donné (cf.
research.md #2, appliqué en code service, pas en contrainte SQL).

## Resource (champs ajoutés)

| Champ | Type | Contraintes |
|---|---|---|
| `icon_preset` | text | nullable — identifiant d'icône `lucide-react` |
| `icon_object_key` | text | nullable — clé de l'image uploadée dans le bucket MinIO `icons` |

Même règle d'exclusivité que `Team`.

## Résolution d'affichage (dérivée, non stockée)

- Si `icon_object_key` défini → URL présignée de l'image (comme les
  avatars/archives).
- Sinon si `icon_preset` défini → rendu du composant `lucide-react`
  correspondant côté frontend.
- Sinon (aucun choix) → icône par défaut : générique pour une `Team`,
  dépendante de `Resource.Type` (Skill/MCP/Agent) pour une `Resource` —
  mapping statique côté frontend, aucune donnée supplémentaire en base.

## Access Rules (dérivées, réutilisent features 002/003)

- Modification de l'icône d'une équipe → réservée à l'`Owner` de cette
  équipe (même droit que la modification des autres métadonnées, feature
  002 FR-005).
- Modification de l'icône d'une ressource → réservée au publieur ou à
  l'owner de l'équipe contenante (même droit que `PATCH`, feature 003
  FR-007) — PAS accessible à un Admin sans être publieur/owner (cohérent
  avec feature 005 FR-002 : la modération Admin ne couvre que la
  suppression, pas l'édition).
