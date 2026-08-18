# Phase 1 Data Model: Historique de versions des ressources

## ResourceVersion (nouvelle entité, table `resource_versions`)

| Champ | Type | Description |
|---|---|---|
| `Id` | `Guid` | Clé primaire |
| `ResourceId` | `Guid` | FK vers `Resource`, cascade delete |
| `VersionNumber` | `int` | Séquentiel par ressource, `MAX+1` (cf. research.md #3) |
| `ObjectKey` | `string` | Clé MinIO de l'archive à cette version (bucket `resources`, jamais réutilisée entre versions) |
| `Note` | `string?` | Note de changement optionnelle, max 300 caractères (FR-007) |
| `CreatedByUserId` | `Guid` | FK vers `User` (qui a publié cette version) |
| `CreatedAt` | `DateTimeOffset` | Date de publication de cette version |

**Index** : `(ResourceId, VersionNumber)` unique — garantit l'absence de
doublon de numéro pour une même ressource.

**Contrainte métier (appliquée en code, pas en base)** : une ressource
peut avoir zéro ligne `ResourceVersion` (legacy jamais retouchée depuis
cette feature — cf. research.md #2) ; dans ce cas, le service de lecture
synthétise une version 1 virtuelle depuis `Resource.CreatedAt`/
`Resource.ObjectKey`, jamais persistée.

## Relation avec `Resource`

- `Resource` 1 —— * `ResourceVersion`.
- `Resource.ObjectKey` reste la source de vérité pour "quelle archive
  télécharge le bouton Télécharger par défaut" (FR-004) — il est mis à
  jour à chaque nouvelle version, exactement comme aujourd'hui. Aucune
  logique de lecture existante (téléchargement par défaut, aperçu de la
  feature 010) n'a besoin d'être modifiée.
- Suppression d'une `Resource` → cascade EF Core sur `ResourceVersion` en
  base, plus suppression explicite de chaque `ObjectKey` de version dans
  MinIO (cf. research.md #5, pas automatique via cascade base).

## ResourceVersionDto (API, lecture)

| Champ | Type | Description |
|---|---|---|
| `versionNumber` | `int` | |
| `note` | `string?` | |
| `createdAt` | `DateTimeOffset` | |
| `publisherPseudo` | `string` | Pseudo de qui a publié cette version |
| `isCurrent` | `bool` | `true` pour la version la plus récente |
