# Feature Specification: Modération admin

**Feature Branch**: `005-moderation-admin`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Modération admin : suppression de contenu par un Admin, visibilité totale sur toutes les équipes dans l'annuaire"

**Depends on**: [001-socle-auth-bdd](../001-socle-auth-bdd/spec.md) (rôle `Admin`),
[002-gestion-equipes](../002-gestion-equipes/spec.md) (équipes, FR-008),
[003-publication-ressources](../003-publication-ressources/spec.md) (ressources)

**Scope validé avec l'utilisateur** (question posée avant la feature 001) :
modération "Minimale" — uniquement suppression de contenu par un Admin.
Bannissement de compte, signalements (report queue), statistiques
globales, quotas de stockage, mise en avant ("featured") sont explicitement
reportés à une version ultérieure.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Un Admin supprime n'importe quelle ressource (Priority: P1)

Un compte `Admin` supprime une ressource publiée par n'importe quel
utilisateur, dans n'importe quelle équipe (publique ou privée), sans en
être ni le publieur ni l'owner de l'équipe.

**Why this priority**: C'est la seule capacité de modération validée pour ce
MVP ("suppression de contenu") — sans elle, cette feature n'a aucun
contenu.

**Independent Test**: Un compte Admin supprime une ressource publiée par un
autre utilisateur dans une équipe dont l'Admin n'est pas membre ; la
ressource disparaît. Un compte Utilisateur (non-owner, non-publieur) tente
la même suppression et se voit refusé (403, comportement déjà défini en
feature 003).

**Acceptance Scenarios**:

1. **Given** un compte `Admin` et une ressource publiée par un autre
   utilisateur dans une équipe dont l'Admin n'est ni membre ni owner,
   **When** l'Admin supprime cette ressource, **Then** elle est supprimée
   (même comportement que la suppression par le publieur/owner en
   feature 003 : fichier retiré de MinIO, ligne supprimée en base).
2. **Given** le même contexte, **When** un compte `Utilisateur` qui n'est
   ni publieur ni owner tente la suppression, **Then** c'est refusé (403,
   comportement inchangé de la feature 003).
3. **Given** un compte `Admin`, **When** il modifie (PATCH, pas
   suppression) les métadonnées d'une ressource dont il n'est ni publieur
   ni owner, **Then** c'est refusé (403) — le pouvoir de modération de
   l'Admin se limite à la suppression, pas à l'édition de contenu tiers
   (hors périmètre, non demandé).

---

### User Story 2 - Un Admin voit toutes les équipes dans l'annuaire (Priority: P2)

Un compte `Admin` consultant l'annuaire des équipes (`GET /api/teams`) voit
aussi les équipes privées, pas seulement les publiques.

**Why this priority**: Corrige un écart avec la spec déjà validée de la
feature 002 (FR-008 : "les équipes privées ... sauf pour un Admin, qui voit
toutes les équipes"), qui n'était pas respecté par l'endpoint d'annuaire
(`GET /api/teams` ne filtrait que sur `Visibility = Public`, sans dérogation
Admin, alors que `GET /api/teams/{id}` la respectait déjà correctement).
Sans ce correctif, un Admin ne peut découvrir une équipe privée
problématique qu'en connaissant déjà son identifiant — pas praticable pour
une modération réelle.

**Independent Test**: Créer une équipe privée avec un compte non-Admin ;
vérifier qu'un Admin la voit dans `GET /api/teams` alors qu'un compte
Utilisateur non-membre ne la voit pas.

**Acceptance Scenarios**:

1. **Given** des équipes publiques et privées existent, **When** un compte
   `Admin` consulte `GET /api/teams`, **Then** il voit toutes les équipes
   (publiques et privées).
2. **Given** le même contexte, **When** un compte `Utilisateur` non-membre
   des équipes privées consulte `GET /api/teams`, **Then** il ne voit que
   les équipes publiques (comportement inchangé de la feature 002).

---

### Edge Cases

- La visibilité totale de l'Admin sur le contenu (ressources et, avec cette
  feature, l'annuaire des équipes) était déjà en grande partie en place
  depuis les features 002/003 au niveau des requêtes de données
  (`VisibleTeamsQuery`/`VisibleResourcesQuery` dérogent déjà pour
  `isAdmin`) — cette feature comble le seul écart identifié (l'annuaire) et
  ajoute la capacité d'action manquante (suppression).
- Un Admin qui supprime une ressource laisse une équipe éventuellement sans
  aucune ressource — comportement normal, pas de garde-fou particulier.
- La suppression d'une ressource par un Admin est définitive (pas de
  corbeille/restauration, cohérent avec l'absence de versioning déjà
  actée en feature 003).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT permettre à un compte `Admin` de supprimer
  n'importe quelle ressource, indépendamment du fait qu'il en soit le
  publieur ou l'owner de l'équipe contenante.
- **FR-002**: Le système NE DOIT PAS étendre ce pouvoir à la modification
  (PATCH) du contenu tiers — seule la suppression est un droit de
  modération Admin dans ce MVP (cf. Assumptions).
- **FR-003**: `GET /api/teams` (annuaire) DOIT renvoyer toutes les équipes
  (publiques et privées) pour un compte `Admin`, et uniquement les équipes
  publiques pour un compte `Utilisateur` (comportement inchangé) —
  aligne l'implémentation sur FR-008 déjà spécifié en feature 002.
- **FR-004**: Le système DOIT continuer de vérifier ces droits côté
  serveur exclusivement (jamais de confiance dans une donnée envoyée par
  le client) — cohérent avec toutes les features précédentes.

### Key Entities

Aucune nouvelle entité — cette feature étend les règles d'autorisation sur
les entités `Resource` (feature 003) et `Team` (feature 002) existantes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des suppressions de ressources tierces par un compte
  `Admin` réussissent (204), quelle que soit l'équipe (publique/privée) ou
  le rôle de l'Admin dans celle-ci (aucun, dans le cas testé).
- **SC-002**: 100% des tentatives de modification (PATCH) de contenu tiers
  par un Admin non-publieur/non-owner échouent (403) — la modération ne
  devient pas un droit d'édition déguisé.
- **SC-003**: `GET /api/teams` renvoie l'ensemble des équipes (publiques +
  privées) pour un Admin, et exactement les équipes publiques pour un
  compte Utilisateur non-membre des équipes privées concernées.

## Assumptions

- La suppression de compte utilisateur (bannissement) reste hors périmètre
  (déjà écarté par le choix "scope admin minimal" en amont).
- Aucun mécanisme de signalement ("report") n'est ajouté : l'Admin agit
  directement sur tout contenu qu'il juge problématique, sans file
  d'attente de signalements à traiter (déjà écarté par le choix "scope
  admin minimal").
- Pas de suppression/suspension d'équipe entière par l'Admin dans ce MVP —
  seule la suppression de ressource individuelle est couverte
  ("suppression de contenu" au sens strict) ; une équipe elle-même n'est
  pas considérée comme du "contenu" au sens de cette feature.
- Pas de page/tableau de bord admin dédié : les capacités de modération
  s'exercent via les mêmes pages (`/store`, `/resources/:id`,
  `/teams/:id`) déjà utilisées par tous les utilisateurs, avec des actions
  visibles conditionnellement au rôle Admin — cohérent avec l'absence de
  travail de design dédié pour ce MVP.
