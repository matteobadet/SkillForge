# Feature Specification: CLI de synchronisation

**Feature Branch**: `004-cli-synchronisation`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "CLI de synchronisation skillforge : login, pull et push de ressources d'une équipe vers/depuis le dossier Claude local"

**Depends on**: [001-socle-auth-bdd](../001-socle-auth-bdd/spec.md) (auth JWT),
[002-gestion-equipes](../002-gestion-equipes/spec.md) (équipes),
[003-publication-ressources](../003-publication-ressources/spec.md) (ressources, endpoints déjà existants)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - S'authentifier depuis la CLI (Priority: P1)

Un utilisateur exécute `skillforge login`, saisit son email et son mot de
passe, et reste connecté pour les commandes suivantes sans ressaisie.

**Why this priority**: Toutes les autres commandes nécessitent d'être
authentifié — c'est le préalable absolu.

**Independent Test**: `skillforge login` avec des identifiants valides, puis
une commande protégée (`skillforge teams`) réussit sans nouvelle invite.

**Acceptance Scenarios**:

1. **Given** des identifiants valides, **When** l'utilisateur exécute
   `skillforge login`, **Then** la CLI obtient et stocke localement un
   access token et un refresh token (réutilise l'API de la feature 001).
2. **Given** des identifiants invalides, **When** l'utilisateur exécute
   `skillforge login`, **Then** un message d'erreur clair s'affiche, rien
   n'est stocké.
3. **Given** une session déjà stockée dont l'access token a expiré,
   **When** l'utilisateur exécute une commande protégée, **Then** la CLI
   rafraîchit automatiquement le token (comme le fait le frontend) sans
   ressaisie.
4. **Given** un refresh token expiré ou révoqué, **When** l'utilisateur
   exécute une commande protégée, **Then** la CLI affiche un message clair
   invitant à relancer `skillforge login`.
5. **Given** une session active, **When** l'utilisateur exécute
   `skillforge logout`, **Then** les identifiants locaux sont supprimés.

---

### User Story 2 - Lister ses équipes (Priority: P2)

Un utilisateur exécute `skillforge teams` pour retrouver l'identifiant des
équipes dont il est membre (nécessaire pour `pull`/`push`).

**Why this priority**: Sert d'utilitaire de découverte pour les commandes
`pull`/`push` (qui ciblent une équipe par identifiant) — utile mais pas
bloquant si l'utilisateur connaît déjà l'identifiant (ex: copié depuis
l'URL de l'équipe dans le store web).

**Independent Test**: `skillforge teams` affiche la liste des équipes de
l'utilisateur (nom + identifiant), correspondant à `GET /api/teams/mine`.

**Acceptance Scenarios**:

1. **Given** un utilisateur membre de plusieurs équipes, **When** il exécute
   `skillforge teams`, **Then** la liste affichée correspond exactement à
   ses équipes (nom, identifiant, visibilité).

---

### User Story 3 - Télécharger les ressources d'une équipe (`pull`) (Priority: P1)

Un utilisateur exécute `skillforge pull <teamId>` pour télécharger toutes
les ressources visibles d'une équipe vers son dossier Claude local.

**Why this priority**: C'est la moitié "consommation" de la synchronisation
manuelle demandée dans le brief — sans elle, le store ne sert à rien pour
un usage local avec Claude.

**Independent Test**: Publier une ressource via le store web, puis exécuter
`skillforge pull <teamId>` et vérifier que le fichier apparaît décompressé
au bon endroit du dossier local.

**Acceptance Scenarios**:

1. **Given** une équipe visible par l'utilisateur contenant des ressources,
   **When** il exécute `skillforge pull <teamId>`, **Then** chaque
   ressource est téléchargée et décompressée dans
   `<dossier-cible>/<type-au-pluriel>/<nom-ressource>/` (ex:
   `skills/mon-skill/`, `agents/mon-agent/`, `mcp/mon-serveur/`).
2. **Given** une ressource déjà présente localement (pull précédent),
   **When** `pull` est exécuté à nouveau, **Then** le dossier local est
   remplacé par le contenu actuel de la ressource (pas de fusion, pas
   d'historique — cohérent avec l'absence de versioning en feature 003).
3. **Given** un identifiant d'équipe inexistant ou non visible par
   l'utilisateur, **When** `pull` est exécuté, **Then** un message d'erreur
   clair s'affiche (pas de crash, pas de fuite d'information sur
   l'existence de l'équipe).

---

### User Story 4 - Publier une ressource locale (`push`) (Priority: P1)

Un utilisateur exécute `skillforge push <teamId> <chemin-local> --name
<nom> --type <Skill|MCP|Agent>` pour publier ou mettre à jour une ressource
à partir d'un dossier ou fichier local.

**Why this priority**: C'est la moitié "contribution" de la synchronisation
manuelle — nécessaire pour que le flux `push`/`pull` demandé dans le brief
soit complet.

**Independent Test**: `push` un dossier local vers une équipe, puis
vérifier via l'API/le store web que la ressource existe avec le contenu
attendu ; `push` à nouveau avec le même nom et vérifier que c'est bien une
mise à jour (pas un doublon).

**Acceptance Scenarios**:

1. **Given** un chemin local (fichier ou dossier) et un nom qui n'existe pas
   encore dans l'équipe ciblée, **When** l'utilisateur exécute `push`,
   **Then** le contenu est compressé en `.zip` et une nouvelle ressource est
   créée.
2. **Given** un nom qui correspond à une ressource existante dans l'équipe
   (et dont l'utilisateur est publieur ou owner de l'équipe), **When** il
   exécute `push` à nouveau avec ce nom, **Then** l'archive de la ressource
   existante est remplacée (mise à jour, pas de doublon).
3. **Given** un nom qui correspond à une ressource existante publiée par
   quelqu'un d'autre (et l'utilisateur n'est pas owner de l'équipe),
   **When** il exécute `push` avec ce nom, **Then** l'action échoue avec un
   message clair (403, cohérent avec les droits définis en feature 003).
4. **Given** l'utilisateur n'est pas membre de l'équipe ciblée, **When** il
   exécute `push`, **Then** l'action échoue avec un message clair (403).

---

### Edge Cases

- Le chemin local pour `push` peut être un fichier unique ou un dossier ;
  dans les deux cas, tout le contenu est compressé en une archive `.zip`
  unique (cohérent avec le format générique validé en feature 003).
- Aucun endpoint backend supplémentaire n'est nécessaire pour cette
  feature : `pull`/`push`/`teams` réutilisent exactement les endpoints déjà
  livrés en features 001/002/003.
- L'URL de l'API cible est configurable (flag `--api-url` ou variable
  d'environnement `SKILLFORGE_API_URL`), avec `http://localhost:5080` par
  défaut, pour permettre de pointer vers une instance auto-hébergée
  distante.
- Le dossier cible local par défaut est `~/.claude`, configurable via un
  flag `--dir`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: La CLI DOIT proposer une commande `login` qui authentifie
  l'utilisateur par email/mot de passe via l'API existante (`POST
  /api/auth/login`) et stocke les tokens localement (`~/.skillforge/credentials.json`).
- **FR-002**: La CLI DOIT proposer une commande `logout` qui supprime les
  identifiants stockés localement.
- **FR-003**: La CLI DOIT rafraîchir automatiquement l'access token expiré
  via `POST /api/auth/refresh` avant d'échouer une commande, de façon
  transparente pour l'utilisateur.
- **FR-004**: La CLI DOIT proposer une commande `teams` listant les équipes
  de l'utilisateur (`GET /api/teams/mine`).
- **FR-005**: La CLI DOIT proposer une commande `pull <teamId>` qui
  télécharge et décompresse toutes les ressources visibles d'une équipe
  dans `<dossier-cible>/<type-au-pluriel>/<nom-ressource>/`, en remplaçant
  tout dossier local existant du même nom.
- **FR-006**: La CLI DOIT proposer une commande `push <teamId> <chemin>
  --name <nom> --type <Skill|MCP|Agent>` qui compresse le chemin local et
  crée ou met à jour (si le nom existe déjà dans l'équipe) la ressource
  correspondante.
- **FR-007**: La CLI DOIT afficher des messages d'erreur clairs et des
  codes de sortie non-nuls en cas d'échec (auth manquante/expirée, équipe
  non visible, droits insuffisants, chemin local introuvable) — jamais de
  crash avec une trace technique brute par défaut.
- **FR-008**: La CLI ne DOIT introduire aucun nouvel endpoint backend —
  elle consomme exclusivement l'API REST déjà livrée dans les features
  001/002/003.

### Key Entities

Aucune nouvelle entité de données côté serveur (cf. FR-008). Côté client,
un fichier de credentials local : `{ apiUrl, accessToken, refreshToken }`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `skillforge login` puis `skillforge teams` réussissent en
  moins de 2 commandes sans ressaisie d'identifiants.
- **SC-002**: Une ressource publiée via `push` est identique bit-à-bit
  (contenu de l'archive) après un `pull` ultérieur.
- **SC-003**: 100% des commandes échouant côté API (401/403/404/409)
  produisent un message d'erreur lisible en une phrase, pas une trace de
  pile brute, et un code de sortie non-nul.

## Assumptions

- Distribution via npm (package `skillforge-cli`, exécutable `skillforge`),
  authentification email/mot de passe réutilisant l'API existante (validé
  avec l'utilisateur).
- Les équipes n'ayant pas de nom unique globalement (feature 002), `pull`
  et `push` ciblent une équipe par son identifiant (uuid), pas par son nom.
  `skillforge teams` sert à retrouver cet identifiant.
- Le type MCP est traité comme les autres (archive générique décompressée
  dans un dossier) — aucune fusion automatique dans un fichier de
  configuration MCP global n'est effectuée par cette CLI (hors périmètre du
  MVP, cohérent avec le format de package générique non validé de la
  feature 003).
- Pas de démon ni de synchronisation automatique en arrière-plan (déjà
  écarté du MVP par le brief initial) — chaque `pull`/`push` est une action
  manuelle explicite.
