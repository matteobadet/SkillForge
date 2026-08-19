# Phase 0 Research: Suivi de l'espace de stockage MinIO (admin)

## 1. Comment obtenir la taille totale d'un bucket MinIO depuis le SDK déjà utilisé

**Decision**: Utiliser `IMinioClient.ListObjectsEnumAsync(ListObjectsArgs, CancellationToken)` (SDK `Minio` 7.0.0, déjà référencé dans `backend/SkillForge.Api/SkillForge.Api.csproj`), avec `WithBucket(bucket)` et `WithRecursive(true)`, puis sommer la propriété `Size` de chaque `Item` énuméré et compter les éléments.

**Rationale**: Le SDK MinIO 7.0.0 expose le listing d'objets sous forme de flux asynchrone énumérable (`IAsyncEnumerable<Item>`), cohérent avec le reste de `ObjectStorageService.cs` qui utilise déjà des méthodes `async`/`await` du même client (`GetObjectAsync` avec `WithCallbackStream`, `PutObjectAsync`, etc. — cf. feature 010/011). Il n'existe pas d'appel « taille de bucket » direct côté API S3/MinIO : il faut lister puis sommer, ce qui est l'approche standard pour ce SDK. La signature exacte sera confirmée à la compilation (même approche que la signature de `DownloadToMemoryAsync` en feature 011, devinée puis validée par le build).

**Alternatives considered**:
- Interroger les métriques Prometheus exposées par MinIO (`/minio/v2/metrics/cluster`) : rejeté, ajoute une dépendance opérationnelle (scraping, format Prometheus à parser) disproportionnée pour un besoin de simple somme de tailles, et sort du principe « stack cohérente et sobre » (Constitution V).
- `mc du` (CLI MinIO) invoqué en sous-processus depuis l'API : rejeté, introduit une dépendance à un binaire externe et à son PATH dans le conteneur, alors que le SDK déjà utilisé suffit.
- Suivre une colonne `SizeBytes` en base de données, incrémentée à chaque upload/suppression : rejeté, cf. Assumptions du spec — incohérent avec la philosophie « calcul à la demande, pas de migration » déjà adoptée pour les features 010/011, et risque de dérive silencieuse entre la valeur suivie et la réalité MinIO (ex. objet supprimé manuellement).

## 2. Où gater l'accès Admin (pattern existant vs nouveau)

**Decision**: Nouveau `AdminController` dédié, avec un garde explicite en tête de chaque action : `if (!IsAdmin) return Forbid();`, `IsAdmin` étant la même propriété calculée (`User.IsInRole(UserRole.Admin.ToString())`) déjà dupliquée dans `ResourcesController.cs` et `TeamsController.cs`.

**Rationale**: Aucun contrôleur existant ne porte de logique liée au stockage global (transversal à toutes les équipes/ressources) — un nouveau contrôleur évite de mélanger une préoccupation d'administration système dans `ResourcesController`/`TeamsController`, qui restent scopés à leurs entités respectives. C'est le premier endpoint de la codebase à être *entièrement* réservé aux admins (jusqu'ici `IsAdmin` ne fait qu'élargir la visibilité dans des endpoints par ailleurs ouverts) ; garder le même style de garde manuel (`if (!IsAdmin) return Forbid();`) plutôt qu'introduire `[Authorize(Roles=...)]` évite d'introduire un deuxième mécanisme d'autorisation dans le projet pour un seul endpoint.

**Alternatives considered**:
- Ajouter les actions de suivi de stockage dans `ResourcesController` ou un contrôleur existant : rejeté, le stockage global n'est pas scopé à une ressource ni à une équipe, ce qui casserait la cohérence des contrôleurs existants.
- Introduire `[Authorize(Roles = "Admin")]` : rejeté pour rester cohérent avec le style déjà en place (aucun contrôleur du projet ne l'utilise actuellement) ; à reconsidérer collectivement si d'autres endpoints strictement admin-only apparaissent plus tard.

## 3. Où exposer la vue côté frontend (pas de page admin existante)

**Decision**: Nouvelle page dédiée `AdminStoragePage.tsx`, route protégée `/admin/storage`, visible dans la nav (`Layout.tsx`) uniquement lorsque `user.role === "Admin"`.

**Rationale**: Cohérent avec la portée « Admin minimal » déjà actée pour ce projet — un point d'entrée simple plutôt qu'un tableau de bord d'administration élargi. Suit le pattern déjà en place pour les routes protégées dans `App.tsx` (`ProtectedRoute` + `Layout`).

**Alternatives considered**:
- Construire un tableau de bord admin générique avec plusieurs sections (modération, stockage, utilisateurs...) : rejeté, hors périmètre de cette feature (Constitution II — Scope Discipline / YAGNI) ; peut être une évolution ultérieure si d'autres besoins admin apparaissent.
