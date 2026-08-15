# Feature Specification: Publication / store de ressources

**Feature Branch**: `003-publication-ressources`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Publication et store de ressources : upload/download de Skills, MCP et Agents en archives ZIP vers l'espace d'une équipe, upvote"

**Depends on**: [001-socle-auth-bdd](../001-socle-auth-bdd/spec.md) (comptes, MinIO),
[002-gestion-equipes](../002-gestion-equipes/spec.md) (équipes, visibilité publique/privée, appartenance)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Publier une ressource dans l'espace d'une équipe (Priority: P1)

Un membre d'une équipe publie une ressource (Skill, MCP ou Agent) : nom,
description, type, et une archive ZIP contenant les fichiers.

**Why this priority**: Sans publication, il n'y a rien à découvrir, télécharger
ni upvoter — c'est le cœur de la feature.

**Independent Test**: Un utilisateur membre d'une équipe publie une ressource
via l'API/UI et la retrouve immédiatement dans l'espace de son équipe.

**Acceptance Scenarios**:

1. **Given** un utilisateur membre d'une équipe, **When** il publie une
   ressource avec un nom, un type (`Skill`/`MCP`/`Agent`), une description et
   une archive `.zip`, **Then** la ressource apparaît dans l'espace de
   l'équipe, associée à ce publieur.
2. **Given** un utilisateur qui n'est PAS membre de l'équipe ciblée,
   **When** il tente de publier une ressource dans cette équipe, **Then**
   la publication est refusée (403).
3. **Given** un fichier qui n'est pas une archive `.zip`, **When** un membre
   tente de le publier, **Then** la publication est refusée (400).

---

### User Story 2 - Télécharger une ressource (Priority: P1)

Un utilisateur qui peut voir une ressource (équipe publique, ou membre d'une
équipe privée, ou Admin) télécharge son archive.

**Why this priority**: Le téléchargement est la raison d'être du store —
sans lui, publier une ressource n'a aucune valeur.

**Independent Test**: Télécharger l'archive d'une ressource visible et
vérifier que le contenu correspond au fichier publié.

**Acceptance Scenarios**:

1. **Given** une ressource dans une équipe publique, **When** n'importe quel
   utilisateur connecté demande son téléchargement, **Then** l'archive est
   servie, qu'il soit membre de l'équipe ou non.
2. **Given** une ressource dans une équipe privée, **When** un utilisateur
   qui n'en est pas membre (et n'est pas Admin) demande son téléchargement,
   **Then** l'accès est refusé (404 — même masquage que pour une équipe
   privée en feature 002, pas de 403 qui confirmerait l'existence).
3. **Given** une ressource dans une équipe privée, **When** un membre de
   cette équipe ou un Admin la télécharge, **Then** l'archive est servie.

---

### User Story 3 - Parcourir le store (Priority: P2)

Un utilisateur connecté consulte une vue d'ensemble de toutes les ressources
qui lui sont visibles (équipes publiques + ses équipes privées), au-delà de
la page de chaque équipe individuelle.

**Why this priority**: C'est ce qui fait du projet un "store" et pas juste
une liste de fichiers par équipe ; utile pour la découverte, mais la
publication/téléchargement (US1/US2) reste utilisable sans cette vue
transverse.

**Independent Test**: Consulter la vue store et vérifier qu'elle liste les
ressources des équipes publiques et des équipes privées dont l'utilisateur
est membre, triées par date de publication (les plus récentes en premier).

**Acceptance Scenarios**:

1. **Given** des ressources existent dans des équipes publiques et privées
   variées, **When** un utilisateur connecté consulte le store, **Then** il
   voit toutes les ressources des équipes publiques et de ses propres
   équipes privées, mais aucune ressource d'une équipe privée dont il n'est
   pas membre.
2. **Given** un compte Admin, **When** il consulte le store, **Then** il
   voit toutes les ressources de toutes les équipes (exception de modération
   déjà actée).

---

### User Story 4 - Upvoter une ressource (Priority: P2)

Un utilisateur qui peut voir une ressource lui donne un upvote (bascule
on/off).

**Why this priority**: Signal de qualité utile mais non bloquant pour
l'usage de base du store.

**Independent Test**: Upvoter une ressource, vérifier que le compteur
augmente de 1 ; upvoter à nouveau (bascule), vérifier qu'il revient à sa
valeur initiale.

**Acceptance Scenarios**:

1. **Given** une ressource visible par l'utilisateur, **When** il l'upvote
   pour la première fois, **Then** le compteur d'upvotes augmente de 1.
2. **Given** une ressource déjà upvotée par l'utilisateur, **When** il
   upvote à nouveau (bascule), **Then** son upvote est retiré et le
   compteur diminue de 1.
3. **Given** une ressource d'une équipe privée dont l'utilisateur n'est pas
   membre, **When** il tente de l'upvoter, **Then** c'est refusé (404, même
   logique de masquage que le téléchargement).

---

### User Story 5 - Mettre à jour ou supprimer une ressource publiée (Priority: P3)

Le publieur d'une ressource (ou l'owner de l'équipe) modifie ses métadonnées,
remplace son archive, ou la supprime.

**Why this priority**: Confort de gestion normal, mais le store reste
utilisable sans cette capacité dans un premier temps (on peut republier sous
un autre nom en dernier recours).

**Independent Test**: Le publieur remplace l'archive d'une ressource
existante et vérifie que le téléchargement renvoie désormais le nouveau
contenu ; un autre membre non-publieur et non-owner tente la même action et
se voit refusé.

**Acceptance Scenarios**:

1. **Given** le publieur d'une ressource, **When** il modifie son nom, sa
   description, ou remplace l'archive, **Then** la ressource est mise à
   jour (l'ancienne archive n'est plus servie — pas d'historique, cf.
   Assumptions).
2. **Given** l'owner de l'équipe contenant la ressource (mais pas le
   publieur d'origine), **When** il supprime la ressource, **Then** elle
   est supprimée (droit de modération de l'owner sur sa propre équipe).
3. **Given** un membre de l'équipe qui n'est ni le publieur ni l'owner,
   **When** il tente de modifier ou supprimer la ressource, **Then** c'est
   refusé (403).

---

### Edge Cases

- La suppression d'une équipe (feature 002) supprime en cascade toutes ses
  ressources et leurs upvotes.
- Un même utilisateur ne peut avoir qu'un upvote actif par ressource (pas de
  double comptage).
- Aucune validation du contenu interne de l'archive ZIP n'est faite (décision
  validée avec l'utilisateur) — le store fait confiance au publieur quant à
  la conformité du contenu au format Skill/MCP/Agent attendu par Claude.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tout membre d'une équipe (`Owner` ou `Member`, cf. feature 002)
  DOIT pouvoir publier une ressource dans l'espace de cette équipe : nom,
  description (optionnelle), type (`Skill` | `MCP` | `Agent`), archive
  `.zip`.
- **FR-002**: Le système DOIT stocker l'archive dans MinIO (même mécanisme
  que les avatars, feature 001) sans valider sa structure interne (validé
  avec l'utilisateur).
- **FR-003**: La visibilité d'une ressource DOIT suivre exactement la
  visibilité de son équipe (feature 002, FR-007/FR-008) : équipe publique →
  visible/téléchargeable par tout utilisateur connecté ; équipe privée →
  réservée aux membres de cette équipe et aux comptes `Admin`.
- **FR-004**: Le système DOIT permettre à tout utilisateur pouvant voir une
  ressource de télécharger son archive.
- **FR-005**: Le système DOIT permettre à tout utilisateur connecté de
  consulter une vue "store" listant toutes les ressources qui lui sont
  visibles, tous équipes confondues, triées par date de publication
  décroissante.
- **FR-006**: Le système DOIT permettre à un utilisateur pouvant voir une
  ressource de l'upvoter, avec bascule (un second upvote retire le premier)
  — un seul upvote actif par (utilisateur, ressource).
- **FR-007**: Seuls le publieur d'origine d'une ressource ou l'owner de
  l'équipe qui la contient DOIVENT pouvoir modifier ses métadonnées,
  remplacer son archive, ou la supprimer.
- **FR-008**: Remplacer l'archive d'une ressource DOIT écraser la précédente
  — pas d'historique de versions consultable dans ce MVP (cohérent avec le
  périmètre utilisateur "minimal" déjà validé).
- **FR-009**: Le système DOIT vérifier côté serveur l'appartenance à
  l'équipe et les droits (publieur/owner) avant toute action d'écriture —
  jamais de confiance dans une donnée envoyée par le client.
- **FR-010**: Le système DOIT rejeter toute publication dont le fichier
  n'est pas une archive `.zip` (vérification d'extension/content-type,
  cohérent avec l'absence de validation de contenu interne).

### Key Entities

- **Resource** : identifiant, référence équipe, référence utilisateur
  publieur, nom, description (optionnelle), type (`Skill` | `MCP` |
  `Agent`), référence à l'objet MinIO (archive courante), date de création,
  date de dernière mise à jour.
- **ResourceUpvote** : référence ressource, référence utilisateur, date. Un
  utilisateur ne peut avoir qu'une seule ligne par ressource (upvote actif).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un membre d'équipe peut publier une ressource (nom, type,
  archive) en moins d'une minute.
- **SC-002**: 100% des tentatives de modification/suppression par un
  utilisateur qui n'est ni le publieur ni l'owner de l'équipe sont refusées
  (403).
- **SC-003**: Aucune ressource d'une équipe privée n'apparaît dans le store
  global, la liste de l'équipe, ni n'est téléchargeable/upvotable pour un
  utilisateur non-membre et non-Admin (0 fuite, même logique que SC-003 de
  la feature 002).

## Assumptions

- Toute ressource appartient à exactement une équipe (pas d'espace personnel
  hors équipe) — cohérent avec le brief ("équipes ... disposent d'un espace
  dédié pour mettre à disposition des Skills/MCP/Agents").
- Le tri par défaut du store est la date de publication décroissante (pas de
  tri par nombre d'upvotes dans ce MVP — pourrait être ajouté plus tard sans
  changement de modèle de données).
- Pas de recherche ni de filtres par tags/catégories dans cette feature
  (déjà écarté du MVP par le choix "scope utilisateur minimal" en amont).
- Taille maximale d'une archive : 50 Mo (détail d'implémentation sans
  conséquence produit à ce stade — pas de quota de stockage global par
  utilisateur/équipe dans ce MVP, déjà écarté par le choix "scope admin
  minimal" en amont).
- Le nom d'une ressource n'est pas nécessairement unique globalement, mais
  DOIT être unique au sein d'une même équipe (utile pour la CLI de
  synchronisation, feature 004, qui mappera un nom de ressource à un
  dossier local).
