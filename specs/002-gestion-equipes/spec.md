# Feature Specification: Gestion des équipes

**Feature Branch**: `002-gestion-equipes`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Gestion des équipes : création, équipes publiques/privées, membres, lien d'invitation, espace dédié"

**Depends on**: [001-socle-auth-bdd](../001-socle-auth-bdd/spec.md) (comptes, rôles globaux Admin/Utilisateur)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Créer une équipe (Priority: P1)

Un utilisateur connecté crée une équipe (nom, description, visibilité
publique ou privée) et en devient propriétaire (owner).

**Why this priority**: Sans équipe, aucune des fonctionnalités suivantes
(rejoindre, gérer les membres, publier des ressources en feature 003) n'a de
sens. C'est le point d'entrée de toute la feature.

**Independent Test**: Un utilisateur connecté crée une équipe via l'API/UI et
apparaît immédiatement comme owner de cette équipe.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté, **When** il crée une équipe avec un nom
   et une visibilité (publique ou privée), **Then** l'équipe est créée et
   l'utilisateur en devient owner (premier et unique membre au départ).
2. **Given** un utilisateur connecté, **When** il crée une deuxième équipe,
   **Then** il peut être owner de plusieurs équipes simultanément.

---

### User Story 2 - Rejoindre une équipe via lien d'invitation (Priority: P1)

Un utilisateur connecté rejoint une équipe (publique ou privée) en utilisant
un lien d'invitation partagé par un membre.

**Why this priority**: C'est le seul mécanisme d'entrée dans une équipe
privée, et un mécanisme direct pour une équipe publique — sans lui, une
équipe reste figée à son seul créateur.

**Independent Test**: Un owner génère/copie le lien d'invitation de son
équipe ; un autre utilisateur connecté ouvre ce lien et rejoint l'équipe en
tant que membre.

**Acceptance Scenarios**:

1. **Given** un lien d'invitation actif pour une équipe, **When** un
   utilisateur connecté qui n'en est pas déjà membre l'utilise, **Then** il
   devient membre de l'équipe.
2. **Given** un utilisateur déjà membre de l'équipe, **When** il réutilise le
   lien d'invitation, **Then** rien ne change (pas de doublon, pas d'erreur
   bloquante).
3. **Given** un lien d'invitation révoqué ou remplacé par un nouveau,
   **When** il est utilisé, **Then** l'accès est refusé.

---

### User Story 3 - Gérer les membres et le lien d'invitation (Priority: P2)

Le propriétaire (owner) d'une équipe retire un membre, ou régénère/révoque le
lien d'invitation.

**Why this priority**: Nécessaire pour la vie normale d'une équipe entre
amis (quelqu'un part, un lien fuite), mais l'équipe reste utilisable sans
cette gestion active dans un premier temps.

**Independent Test**: L'owner retire un membre existant de son équipe ; le
membre retiré perd l'accès à l'espace de l'équipe. L'owner régénère le lien ;
l'ancien lien cesse de fonctionner.

**Acceptance Scenarios**:

1. **Given** un owner et un membre dans une équipe, **When** l'owner retire
   ce membre, **Then** le membre n'apparaît plus dans la liste et perd
   l'accès à l'espace de l'équipe.
2. **Given** un lien d'invitation actif, **When** l'owner le régénère,
   **Then** l'ancien lien devient invalide et un nouveau lien actif est
   disponible.
3. **Given** un membre (non-owner), **When** il tente de retirer un autre
   membre ou de régénérer le lien, **Then** l'action est refusée (403).

---

### User Story 4 - Parcourir l'annuaire des équipes publiques (Priority: P2)

Un utilisateur connecté consulte la liste des équipes publiques et leur page
dédiée, sans nécessairement les avoir rejointes.

**Why this priority**: Permet de découvrir des équipes à rejoindre ; moins
critique que la création/adhésion elle-même mais fait partie du parcours de
découverte du store.

**Independent Test**: Un utilisateur connecté liste les équipes publiques et
ouvre la page d'une équipe publique dont il n'est pas membre, sans erreur
d'accès.

**Acceptance Scenarios**:

1. **Given** des équipes publiques et privées existent, **When** un
   utilisateur connecté consulte l'annuaire, **Then** seules les équipes
   publiques apparaissent (les équipes privées n'apparaissent pas, sauf pour
   un Admin ou un membre de l'équipe privée concernée).
2. **Given** une équipe publique, **When** un non-membre ouvre sa page,
   **Then** il voit le nom, la description et la liste des membres, sans
   pouvoir agir dessus (pas de gestion, pas de publication — réservé aux
   membres, cf. feature 003 pour les ressources).

---

### User Story 5 - Quitter une équipe (Priority: P3)

Un membre (non-owner) quitte une équipe de son propre chef.

**Why this priority**: Confort d'usage, non bloquant pour le reste du
système.

**Independent Test**: Un membre quitte une équipe et n'y apparaît plus.

**Acceptance Scenarios**:

1. **Given** un membre (non-owner) d'une équipe, **When** il choisit de la
   quitter, **Then** il n'est plus membre et perd l'accès à l'espace de
   l'équipe.
2. **Given** un owner, **When** il tente de quitter sa propre équipe,
   **Then** l'action est refusée (il doit supprimer l'équipe — cf.
   Assumptions, pas de transfert de propriété dans ce MVP).

---

### Edge Cases

- Un utilisateur peut être membre (ou owner) de plusieurs équipes
  simultanément, sans limite.
- Un owner ne peut pas être retiré de sa propre équipe autrement qu'en la
  supprimant.
- Un Admin voit et peut consulter le contenu de **toutes** les équipes,
  publiques et privées (exception de modération déjà actée dans le brief),
  mais cette feature ne lui donne pas de droits de gestion (retrait de
  membre, régénération de lien) sur des équipes dont il n'est pas owner —
  cf. feature 005 (modération admin) pour d'éventuels droits de modération
  supplémentaires.
- Que se passe-t-il si l'unique owner supprime son compte utilisateur ?
  [NEEDS CLARIFICATION: hors périmètre de cette feature — dépend du
  comportement de suppression de compte, non spécifié nulle part dans le
  projet à ce stade. Assumption : la suppression de compte n'est pas
  implémentée dans le MVP (non mentionnée dans le brief), donc ce cas ne se
  produit pas encore.]

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tout utilisateur connecté DOIT pouvoir créer une équipe avec un
  nom, une description optionnelle, et une visibilité (`Public` ou
  `Privé`), sans limite du nombre d'équipes créées (validé avec
  l'utilisateur).
- **FR-002**: Le créateur d'une équipe DOIT automatiquement en devenir
  `Owner`.
- **FR-003**: Une équipe DOIT avoir exactement un lien d'invitation actif à
  la fois ; ce lien DOIT être permanent et réutilisable par plusieurs
  personnes jusqu'à révocation/régénération par l'owner (validé avec
  l'utilisateur).
- **FR-004**: Utiliser un lien d'invitation actif et valide DOIT ajouter
  l'utilisateur connecté comme `Member` de l'équipe correspondante (sans
  effet s'il est déjà membre).
- **FR-005**: Seul l'`Owner` d'une équipe DOIT pouvoir : retirer un membre,
  régénérer/révoquer le lien d'invitation, modifier le nom/description/
  visibilité, supprimer l'équipe (validé avec l'utilisateur — 2 niveaux de
  rôle : Owner + Member).
- **FR-006**: Un membre (non-owner) DOIT pouvoir quitter une équipe de son
  propre chef ; l'owner ne peut pas quitter sa propre équipe (doit la
  supprimer — pas de transfert de propriété dans ce MVP, cf. Assumptions).
- **FR-007**: Les équipes `Publiques` DOIVENT être listées dans un annuaire
  visible par tout utilisateur connecté (nom, description, nombre de
  membres) ; leur page dédiée (nom, description, liste des membres) DOIT
  être consultable par tout utilisateur connecté, membre ou non.
- **FR-008**: Les équipes `Privées` NE DOIVENT PAS apparaître dans l'annuaire
  ni être consultables par un utilisateur qui n'en est pas membre — sauf
  pour un compte `Admin`, qui voit toutes les équipes (publiques et
  privées) et peut consulter leur contenu (exception de modération déjà
  actée dans le brief).
- **FR-009**: Le système DOIT vérifier côté serveur le rôle d'équipe
  (`Owner`/`Member`) et le rôle global (`Admin`) avant toute action de
  gestion — jamais de confiance dans une donnée envoyée par le client.
- **FR-010b**: Le système DOIT permettre à un utilisateur connecté de lister
  les équipes dont il est membre (publiques et privées confondues), pour
  pouvoir retrouver et accéder à ses équipes après adhésion.
- **FR-010**: Cette feature ne gère PAS la publication de ressources
  (Skills/MCP/Agents) dans l'espace d'équipe — l'espace dédié se limite ici
  aux informations d'équipe et à ses membres ; la publication de ressources
  est traitée dans la feature 003, qui réutilisera la règle de visibilité
  Publique/Privée définie ici (FR-007/FR-008) pour l'accès aux ressources.

### Key Entities

- **Team** : identifiant, nom, description (optionnelle), visibilité
  (`Public` | `Privé`), date de création.
- **TeamMember** : référence équipe, référence utilisateur, rôle
  (`Owner` | `Member`), date d'adhésion. Un utilisateur ne peut avoir
  qu'une seule ligne `TeamMember` par équipe.
- **TeamInviteLink** : référence équipe, jeton (haché en base, comme les
  refresh tokens — cf. feature 001), date de création, date de révocation
  (nullable). Une équipe a au plus un lien actif (non révoqué) à la fois.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur peut créer une équipe et obtenir son lien
  d'invitation en moins de 30 secondes.
- **SC-002**: 100% des tentatives de gestion d'équipe (retrait de membre,
  régénération de lien, suppression) par un compte qui n'est ni owner ni
  Admin sont refusées (403).
- **SC-003**: Une équipe privée n'apparaît dans aucune réponse API accessible
  à un utilisateur qui n'en est pas membre et n'est pas Admin (ni dans
  l'annuaire, ni par accès direct à son identifiant).

## Assumptions

- Pas de transfert de propriété (`Owner`) d'une équipe dans ce MVP : pour
  changer de propriétaire, il faut recréer une équipe. Risque jugé faible
  (usage entre amis) et réversible (ajout possible dans une itération
  future) — signalé explicitement à l'utilisateur plutôt que bloquant.
- Les noms d'équipe ne sont pas nécessairement uniques globalement (contrai-
  rement à l'email/pseudo utilisateur) : deux équipes peuvent porter le même
  nom.
- Un lien d'invitation ne donne accès qu'à l'adhésion ; il n'expose aucune
  autre action (pas de prévisualisation de contenu privé avant adhésion).
- La suppression de compte utilisateur n'est pas dans le périmètre du MVP
  (non mentionnée dans le brief) ; le cas "owner supprime son compte" ne se
  pose donc pas encore (cf. Edge Cases).
