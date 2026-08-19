# Phase 1 Data Model: Suivi de l'espace de stockage MinIO (admin)

Aucune nouvelle entité persistée (cf. spec.md — Key Entities). Cette feature n'introduit ni table, ni migration EF Core.

## Forme de la réponse calculée (non persistée)

Cette forme existe uniquement en mémoire, le temps d'une requête HTTP — elle documente le contrat de données retourné par l'endpoint, pas un modèle de base de données.

**`StorageUsageDto`**
| Champ | Type | Description |
|---|---|---|
| `totalBytes` | `long` | Somme des tailles de tous les objets, tous buckets applicatifs confondus. |
| `buckets` | `BucketUsageDto[]` | Détail par bucket applicatif (voir ci-dessous). |
| `computedAt` | `DateTimeOffset` | Horodatage du calcul, pour que le frontend puisse afficher « mesuré à l'instant » plutôt que laisser croire à une valeur historisée. |

**`BucketUsageDto`**
| Champ | Type | Description |
|---|---|---|
| `bucket` | `string` | Nom technique du bucket (`resources`, `icons`, `avatars`). |
| `label` | `string` | Libellé lisible pour l'UI (« Archives de ressources », « Icônes », « Avatars »). |
| `objectCount` | `int` | Nombre d'objets dans ce bucket. |
| `totalBytes` | `long` | Somme des tailles des objets de ce bucket. |

Correspondance avec les buckets déjà configurés dans `MinioOptions` (`backend/SkillForge.Api/Options/MinioOptions.cs`) : `ResourcesBucket`, `IconsBucket`, `AvatarsBucket` — les trois seuls buckets applicatifs existants, ce qui satisfait FR-003 (répartition par catégorie) avec une granularité plus fine que le minimum demandé par le spec (archives vs images), sans coût de complexité supplémentaire puisque ce sont déjà les groupements naturels du stockage.

## Erreur de calcul (FR-005)

Si l'appel MinIO échoue pour un bucket (service injoignable, bucket absent), l'endpoint retourne une erreur HTTP explicite (ne renvoie jamais un total partiel présenté comme complet) — voir `contracts/admin-storage-api.md`.
