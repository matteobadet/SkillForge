# Phase 1 Data Model: Aperçu du contenu d'une ressource

Aucune nouvelle entité persistée, aucune migration EF Core. Le seul
"modèle" est un DTO transitoire calculé à la demande.

## ResourcePreviewDto (transitoire, non stocké)

| Champ | Type | Description |
|---|---|---|
| `available` | `bool` | `true` si un fichier candidat a été trouvé et lu avec succès |
| `fileName` | `string?` | `"SKILL.md"` ou `"README.md"` (nom réel trouvé, casse d'origine) ; `null` si `available = false` |
| `content` | `string?` | Contenu texte décodé en UTF-8, tronqué à 100 000 caractères ; `null` si `available = false` |
| `truncated` | `bool` | `true` si le fichier réel dépassait la limite de troncature |

Règle de sélection (cf. research.md #2) : parmi les entrées de premier
niveau de l'archive (`FullName` sans `/`), comparaison insensible à la
casse, `SKILL.md` prioritaire sur `README.md`.

## Relations avec les entités existantes

Aucune. Le service d'extraction opère sur le flux de l'archive déjà
référencée par `Resource.ObjectKey` (bucket `resources`), sans ajouter de
colonne à `Resource` ni de table associée.
