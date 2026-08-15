# Phase 0 Research: Publication / store de ressources

Le seul point produit ambigu (format des packages) a été résolu avec
l'utilisateur dans `spec.md`. Ce document couvre les décisions techniques
d'implémentation restantes.

## 1. Factoriser le stockage objet (MinIO) au lieu de dupliquer

- **Decision**: généraliser `AvatarStorageService` (feature 001, spécifique
  au bucket `avatars` et aux images) en `ObjectStorageService`, paramétré
  par nom de bucket, réutilisé à la fois pour les avatars et pour les
  archives de ressources.
- **Rationale**: les deux cas ont exactement la même mécanique (vérifier/
  créer le bucket, upload, URL de lecture présignée via le client MinIO
  public, suppression) — dupliquer ce code pour un deuxième bucket
  introduirait deux implémentations à maintenir en parallèle pour un
  comportement identique, contraire à la stack "consistante et sobre"
  (principe V). La validation métier (type de fichier, taille max) reste
  dans les contrôleurs/services appelants (`UsersController` pour les
  avatars, `ResourcesController` pour les ressources), pas dans le service
  de stockage générique.
- **Alternatives considered**: dupliquer un `ResourceStorageService`
  quasi-identique — rejeté, violerait le principe Scope Discipline (code
  redondant sans raison).

## 2. Bucket dédié `resources`

- **Decision**: nouveau bucket MinIO `resources` (variable d'env
  `MINIO_BUCKET_RESOURCES`), séparé du bucket `avatars`, créé
  automatiquement au démarrage de l'API (même mécanisme que pour
  `avatars`, feature 001).
- **Rationale**: séparer les buckets par nature de contenu (avatars vs
  archives de ressources) simplifie une éventuelle politique d'accès ou de
  rétention différenciée plus tard, sans coût significatif aujourd'hui.

## 3. Validation du fichier à l'upload

- **Decision**: seule l'extension/le nom de fichier (`.zip`) et le
  content-type (`application/zip` ou `application/x-zip-compressed`) sont
  vérifiés côté serveur ; aucune inspection du contenu de l'archive
  (validé avec l'utilisateur — format générique non validé). Taille
  maximale : 50 Mo (cf. spec.md Assumptions).
- **Rationale**: cohérent avec la décision produit ; évite de coupler le
  store à la structure interne exacte attendue par Claude Code, qui peut
  évoluer indépendamment.

## 4. Accès et bascule d'upvote

- **Decision**: `ResourceUpvote` a une contrainte unique `(ResourceId,
  UserId)`. Un `POST /api/resources/{id}/upvote` bascule : s'il existe déjà
  une ligne pour cet utilisateur, elle est supprimée (retrait) ; sinon elle
  est créée (ajout). Le nombre d'upvotes est calculé (`COUNT`) plutôt que
  stocké dénormalisé, à cette échelle (dizaines de ressources) sans
  problème de performance.
- **Rationale**: simple, cohérent avec FR-006 ; évite un compteur
  dénormalisé à maintenir en synchronisation pour un gain de performance
  non nécessaire ici (principe Scope Discipline).

## 5. Filtrage de visibilité pour les ressources

- **Decision**: même approche que `TeamService.VisibleTeamsQuery` (feature
  002, research.md #5) — une requête EF Core filtrée directement sur
  `Resource.Team.Visibility == Public OR Team.Members.Any(membre courant)
  OR appelant Admin`, jamais un filtrage a posteriori en mémoire.
- **Rationale**: garantit SC-003 de façon vérifiable par test, comme pour
  les équipes privées en feature 002.

## 6. Nommage de fichier dans le bucket

- **Decision**: clé d'objet `{teamId}/{resourceId}/{guid-aléatoire}.zip`,
  remplacée intégralement (nouvelle clé, ancien objet supprimé) à chaque
  republication — pas de conservation d'anciennes versions (cf. spec.md
  FR-008, pas d'historique).
- **Rationale**: même schéma de nommage que les avatars (préfixé par
  propriétaire), évite les collisions, simplifie le nettoyage à la
  suppression d'une ressource ou d'une équipe (cascade).

**Output**: aucune inconnue technique ne subsiste.
