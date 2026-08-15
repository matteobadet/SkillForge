# Phase 0 Research: Socle Auth / BDD / Docker

Toutes les inconnues de `spec.md` (politique mot de passe, bootstrap Admin,
politique d'inscription, rotation refresh token) ont été résolues avec
l'utilisateur directement dans la spec. Ce document couvre les décisions
techniques d'implémentation nécessaires pour le plan (pas de choix produit
restant en suspens).

## 1. Émission/validation des JWT

- **Decision**: `System.IdentityModel.Tokens.Jwt` +
  `Microsoft.AspNetCore.Authentication.JwtBearer` (packages Microsoft
  officiels, déjà dans l'écosystème ASP.NET Core).
- **Rationale**: Support natif .NET, pas de dépendance tierce, intégration
  directe avec le middleware d'autorisation ASP.NET Core (`[Authorize(Roles=...)]`).
- **Alternatives considered**: Duende IdentityServer / solutions OAuth2
  complètes — rejetées, largement surdimensionnées pour un besoin
  email+mot de passe interne à un groupe d'amis (violerait le principe
  Scope Discipline).

## 2. Hachage des mots de passe

- **Decision**: `Microsoft.AspNetCore.Identity.PasswordHasher<User>`
  (PBKDF2, implémentation .NET standard), utilisée seule — sans le reste du
  framework ASP.NET Core Identity (pas de `UserManager`, pas des tables
  `AspNetUsers`/`AspNetRoles` par défaut).
- **Rationale**: Algorithme vetted et maintenu par Microsoft, zéro
  dépendance NuGet supplémentaire, mais on garde notre propre table `User`
  minimale (email, pseudo, rôle) plutôt que le schéma complet et générique
  d'ASP.NET Core Identity qui serait surdimensionné pour 2 rôles fixes.
- **Alternatives considered**: BCrypt.Net-Next — équivalent en sécurité mais
  dépendance tierce supplémentaire sans bénéfice net ici.

## 3. Accès MinIO (upload/download avatar)

- **Decision**: SDK officiel `Minio` (NuGet `Minio`) pour upload, génération
  d'URL, gestion du bucket `avatars`.
- **Rationale**: SDK conçu spécifiquement pour MinIO, API simple pour le
  besoin (put object, presigned GET url), empreinte plus légère que le SDK
  AWS générique.
- **Alternatives considered**: `AWSSDK.S3` — fonctionnellement équivalent
  (MinIO est S3-compatible) mais plus lourd et plus générique que
  nécessaire pour un seul bucket avatars.

## 4. Durées de vie des tokens

- **Decision**: access token JWT = 15 minutes ; refresh token = 30 jours,
  expiration absolue (pas de sliding window), rotation à chaque usage
  (cf. FR-014 validé).
- **Rationale**: Compromis standard sécurité/UX ; 15 min limite la fenêtre
  d'exploitation d'un access token volé, 30 jours évite une reconnexion
  fréquente pour un usage entre amis peu fréquent.
- **Alternatives considered**: access token de longue durée sans refresh —
  rejeté, contraire au principe de sécurité par défaut (IV).

## 5. Stockage des refresh tokens

- **Decision**: seul un hash SHA-256 de la valeur du refresh token est
  persisté en base (jamais la valeur en clair), avec `expires_at` et
  `revoked_at` nullable pour la révocation/rotation.
- **Rationale**: Si la base fuit, aucun refresh token n'est directement
  réutilisable (même logique que pour les mots de passe).
- **Alternatives considered**: stocker le token en clair — rejeté, viole le
  principe IV (aucun secret en clair en base).

## 6. Application des migrations

- **Decision**: EF Core Code-First ; `dbContext.Database.Migrate()` est
  appelé automatiquement au démarrage de l'API (avant d'accepter des
  requêtes).
- **Rationale**: Correspond à FR (schéma prêt dès le premier `docker compose
  up`) et à SC-003 (démarrage en un minimum de commandes) — pas d'étape
  manuelle séparée à documenter.
- **Alternatives considered**: migration manuelle via CLI avant démarrage —
  rejetée, ajoute une commande et un risque d'oubli pour un gain nul à
  cette échelle.

## 7. Contraintes d'upload avatar

- **Decision**: formats acceptés `image/jpeg`, `image/png`, `image/webp` ;
  taille max 5 Mo ; pas de redimensionnement/recadrage côté serveur pour ce
  socle (l'image est stockée telle quelle).
- **Rationale**: Détail d'implémentation sans conséquence produit
  (exception explicitement permise par le principe III de la constitution).
- **Alternatives considered**: redimensionnement serveur automatique —
  reporté, complexité non justifiée pour le MVP.

## 8. Frontend : TypeScript

- **Decision**: React + Vite avec TypeScript (pas de JavaScript simple).
- **Rationale**: Détail d'implémentation sans conséquence produit ; le
  typage réduit les erreurs d'intégration avec l'API dès ce socle, sans
  coût significatif à la mise en place.
- **Alternatives considered**: JavaScript simple — rejeté, aucun bénéfice
  et perte de garde-fous pour un projet qui va grandir sur 5 features.

**Output**: toutes les inconnues techniques sont résolues ; aucune entrée
`NEEDS CLARIFICATION` ne subsiste dans le Technical Context du plan.
