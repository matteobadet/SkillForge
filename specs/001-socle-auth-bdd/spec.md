# Feature Specification: Socle Auth / BDD / Docker

**Feature Branch**: `001-socle-auth-bdd`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Socle authentification, base de données utilisateurs/rôles et environnement Docker (Postgres, MinIO, API, Front)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Créer un compte et se connecter (Priority: P1)

Un nouvel utilisateur crée un compte avec son email et un mot de passe, puis se
connecte pour accéder à l'espace applicatif protégé.

**Why this priority**: Sans compte ni connexion, aucune autre fonctionnalité
du store (équipes, publication, upvote) n'est accessible. C'est le socle
absolu.

**Independent Test**: Peut être testé en créant un compte via l'API/UI, puis
en se connectant avec ces identifiants et en obtenant un accès valide à une
route protégée.

**Acceptance Scenarios**:

1. **Given** aucun compte n'existe pour cet email, **When** l'utilisateur
   s'inscrit avec un email valide et un mot de passe respectant la politique
   minimale, **Then** un compte est créé avec le rôle `Utilisateur` par
   défaut et l'utilisateur est connecté (tokens émis).
2. **Given** un compte existant, **When** l'utilisateur se connecte avec le
   bon email/mot de passe, **Then** il reçoit un access token (JWT) et un
   refresh token valides.
3. **Given** un compte existant, **When** l'utilisateur se connecte avec un
   mauvais mot de passe, **Then** l'accès est refusé sans préciser si c'est
   l'email ou le mot de passe qui est incorrect.
4. **Given** un email déjà utilisé, **When** un visiteur tente de s'inscrire
   avec cet email, **Then** l'inscription est refusée avec un message clair.

---

### User Story 2 - Rester connecté via le refresh token (Priority: P1)

Un utilisateur déjà connecté continue d'utiliser l'application au-delà de la
durée de vie de son access token, sans avoir à ressaisir ses identifiants.

**Why this priority**: Un access token de courte durée est nécessaire pour la
sécurité (principe IV de la constitution), mais sans renouvellement
transparent l'expérience serait inutilisable.

**Independent Test**: Peut être testé en attendant/simulant l'expiration de
l'access token, puis en appelant l'endpoint de refresh avec un refresh token
valide et en vérifiant qu'un nouvel access token est émis.

**Acceptance Scenarios**:

1. **Given** un refresh token valide et non expiré, **When** l'access token a
   expiré, **Then** l'utilisateur obtient un nouvel access token sans
   ressaisir ses identifiants.
2. **Given** un refresh token révoqué ou expiré, **When** il est présenté,
   **Then** la demande de renouvellement est refusée et l'utilisateur doit se
   reconnecter.
3. **Given** un utilisateur qui se déconnecte explicitement, **When** la
   déconnexion est confirmée, **Then** son refresh token est révoqué côté
   serveur.

---

### User Story 3 - Modifier son profil (pseudo et avatar) (Priority: P2)

Un utilisateur connecté modifie son pseudo et son avatar.

**Why this priority**: Fonctionnalité explicitement listée pour le rôle
Utilisateur, mais non bloquante pour le reste du socle (peut arriver après
l'auth de base).

**Independent Test**: Peut être testé en connectant un utilisateur, en
modifiant son pseudo et en uploadant un avatar, puis en vérifiant que le
profil reflète ces changements.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté, **When** il change son pseudo pour une
   valeur valide et non déjà prise, **Then** son profil est mis à jour.
2. **Given** un utilisateur connecté, **When** il upload une image comme
   avatar, **Then** le fichier est stocké dans MinIO et son profil référence
   la nouvelle image.
3. **Given** un utilisateur connecté, **When** il tente de prendre un pseudo
   déjà utilisé par un autre compte, **Then** la modification est refusée.

---

### User Story 4 - Environnement de développement reproductible (Priority: P1)

Un contributeur clone le dépôt et démarre l'ensemble de la stack (API,
PostgreSQL, MinIO, Front) localement avec un minimum de commandes documentées.

**Why this priority**: Sans cela, aucune des fonctionnalités précédentes ne
peut être développée ni vérifiée par la suite ; c'est un prérequis technique
au même niveau de priorité que l'auth elle-même.

**Independent Test**: Peut être testé en clonant le dépôt sur une machine
propre, en copiant `.env.example` vers `.env`, en lançant `docker compose up`
et en vérifiant que l'API répond, que PostgreSQL est accessible et que la
console MinIO est joignable.

**Acceptance Scenarios**:

1. **Given** Docker est installé, **When** un contributeur lance
   `docker compose up` après avoir configuré `.env`, **Then** l'API, la base
   PostgreSQL, MinIO et le front sont démarrés et communiquent entre eux.
2. **Given** la stack est démarrée pour la première fois, **When** l'API
   démarre, **Then** les migrations de base de données s'appliquent
   automatiquement (schéma utilisateurs/rôles créé).

---

### Edge Cases

- Que se passe-t-il si un utilisateur présente un access token expiré sur une
  route protégée sans tenter de refresh ? → Le serveur renvoie 401 ; c'est au
  client de déclencher le refresh.
- Que se passe-t-il si MinIO est indisponible au moment d'un upload d'avatar ?
  → L'upload échoue explicitement, le profil n'est pas modifié (pas d'état
  partiel).
- Que se passe-t-il si deux requêtes de refresh concurrentes utilisent le même
  refresh token ? → Cf. FR-011 (stratégie de rotation à clarifier).
- Que se passe-t-il au tout premier démarrage, quand aucun compte Admin
  n'existe encore ? → Cf. FR-012 (NEEDS CLARIFICATION).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre à un visiteur de créer un compte avec
  un email et un mot de passe.
- **FR-002**: Le système DOIT stocker les mots de passe sous forme hachée
  (jamais en clair), conformément au principe de sécurité de la constitution.
- **FR-003**: Le système DOIT empêcher la création de deux comptes avec le
  même email.
- **FR-004**: Le système DOIT permettre à un utilisateur de se connecter avec
  email + mot de passe et de recevoir un access token JWT de courte durée
  ainsi qu'un refresh token.
- **FR-005**: Le système DOIT permettre de renouveler un access token à
  partir d'un refresh token valide, sans ressaisie des identifiants.
- **FR-006**: Le système DOIT permettre de révoquer un refresh token
  (déconnexion explicite).
- **FR-007**: Le système DOIT associer à chaque utilisateur un rôle
  (`Admin` ou `Utilisateur`), le rôle par défaut à l'inscription étant
  `Utilisateur`.
- **FR-008**: Le système DOIT vérifier le rôle côté serveur pour toute action
  qui en dépend (jamais de confiance dans une donnée envoyée par le client).
- **FR-009**: Le système DOIT permettre à un utilisateur connecté de modifier
  son pseudo (unique) et son avatar (stocké dans MinIO).
- **FR-010**: L'environnement de développement DOIT démarrer intégralement via
  `docker compose up` (API + PostgreSQL + MinIO + Front) avec une
  configuration limitée à un fichier `.env` copié depuis `.env.example`.
- **FR-011**: Le système DOIT exiger un mot de passe d'au moins 8 caractères,
  sans autre contrainte de complexité (validé avec l'utilisateur).
- **FR-012**: Il n'y a PAS de création automatique de compte Admin. Le premier
  (et tout) compte Admin est promu manuellement en base de données par un
  opérateur (validé avec l'utilisateur) — aucun endpoint applicatif de
  promotion n'est requis pour ce socle.
- **FR-013**: L'inscription est ouverte : quiconque atteint l'URL de
  l'instance peut créer un compte, sans code d'invitation ni validation
  manuelle (validé avec l'utilisateur — acceptable car l'URL n'est partagée
  qu'au cercle d'amis).
- **FR-014**: Le système DOIT appliquer une rotation des refresh tokens : un
  refresh token n'est utilisable qu'une seule fois, un nouveau étant émis à
  chaque renouvellement ; l'ancien est immédiatement invalidé (validé avec
  l'utilisateur).
- **FR-015**: Il n'y a PAS de fonctionnalité de réinitialisation de mot de
  passe ("mot de passe oublié") dans ce socle — hors périmètre du MVP tant que
  non explicitement demandée (nécessiterait un service d'envoi d'email non
  encore spécifié).
- **FR-016**: Il n'y a PAS de vérification d'email à l'inscription dans ce
  socle — hors périmètre du MVP tant que non explicitement demandée.

### Key Entities

- **User**: identifiant, email (unique), mot de passe (haché), pseudo
  (unique), URL/référence avatar (optionnelle, fichier dans MinIO), rôle
  (`Admin` | `Utilisateur`), date de création, date de mise à jour.
- **RefreshToken**: identifiant, référence à l'utilisateur, valeur (hachée),
  date d'expiration, date de révocation (nullable), date de création.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un nouvel utilisateur peut créer un compte et être connecté en
  moins de 30 secondes (parcours sans friction).
- **SC-002**: Une route protégée de l'API refuse 100% des requêtes sans
  access token valide (401) et 100% des requêtes avec un rôle insuffisant
  (403).
- **SC-003**: Un contributeur sur une machine propre peut passer du clone du
  dépôt à une stack complètement démarrée (API + BDD + stockage + front) en
  moins de 3 commandes documentées.
- **SC-004**: Aucun mot de passe ni token n'apparaît en clair dans les logs
  applicatifs ou la base de données.

## Assumptions

- Le seul mode d'authentification pour le MVP est email + mot de passe (pas
  d'OAuth/SSO tiers).
- L'avatar est une image simple (pas de recadrage/édition intégrée) ;
  contraintes de taille/format précisées dans le plan technique.
- Pas de vérification d'email ni de réinitialisation de mot de passe dans ce
  socle (cf. FR-015, FR-016) — pourront être proposées comme features
  futures si le besoin apparaît.
- La stack de dev (`docker compose`) est le seul mode de déploiement local
  visé par cette feature ; Kubernetes est hors périmètre ici (cf.
  constitution, décidé plus tard).
