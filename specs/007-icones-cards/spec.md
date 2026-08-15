# Feature Specification: Icônes équipes/ressources et affichage en cards

**Feature Branch**: `007-icones-cards`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Icônes pour équipes et ressources (preset ou upload) et affichage en cards dans le store et l'annuaire" — suite à un audit visuel de l'application via l'extension Chrome, demandé par l'utilisateur : remplacer les listes simples du Store (et par extension de l'annuaire d'équipes) par des cards avec icône ; à la création/gestion d'une ressource ou d'une équipe, l'utilisateur choisit une icône parmi un ensemble proposé, ou upload la sienne.

**Depends on**: [001-socle-auth-bdd](../001-socle-auth-bdd/spec.md) (MinIO),
[002-gestion-equipes](../002-gestion-equipes/spec.md) (équipes),
[003-publication-ressources](../003-publication-ressources/spec.md) (ressources),
[006-design-ui](../006-design-ui/spec.md) (design system, icônes `lucide-react` déjà en dépendance)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choisir une icône parmi un ensemble proposé (Priority: P1)

À la création d'une équipe ou d'une ressource (ou plus tard en modification),
l'utilisateur choisit une icône dans une palette d'icônes prédéfinies,
cohérente avec le reste de l'interface.

**Why this priority**: C'est le chemin le plus simple et le plus utilisé —
sans lui, aucune amélioration visuelle n'est possible pour la majorité des
utilisateurs qui n'ont pas d'image à disposition.

**Independent Test**: Créer une ressource en sélectionnant une icône dans la
palette proposée ; vérifier qu'elle s'affiche ensuite sur la page de la
ressource, dans la liste de l'équipe et dans le store.

**Acceptance Scenarios**:

1. **Given** le formulaire de création d'une équipe ou de publication d'une
   ressource, **When** l'utilisateur sélectionne une icône dans la palette
   proposée, **Then** cette icône est associée à l'équipe/ressource et
   visible partout où elle est affichée.
2. **Given** une équipe ou une ressource sans icône choisie, **When** elle
   est affichée, **Then** une icône par défaut cohérente s'affiche (icône
   générique pour une équipe ; icône dépendant du type — Skill/MCP/Agent —
   pour une ressource) plutôt qu'un espace vide.
3. **Given** l'owner d'une équipe ou le publieur/owner d'une ressource,
   **When** il modifie l'icône après création, **Then** la nouvelle icône
   remplace l'ancienne partout.

---

### User Story 2 - Uploader sa propre icône (Priority: P2)

Un utilisateur qui préfère fournir sa propre image (plutôt qu'une icône de
la palette) upload un fichier image comme icône d'équipe ou de ressource.

**Why this priority**: Complément à la palette pour les utilisateurs qui
veulent personnaliser davantage ; moins critique que la palette elle-même
(P1) car la palette seule répond déjà à la demande de base ("plus beau que
du texte brut").

**Independent Test**: Uploader une image comme icône d'une ressource ;
vérifier qu'elle s'affiche à la place d'une icône de la palette.

**Acceptance Scenarios**:

1. **Given** le formulaire de création/modification, **When** l'utilisateur
   upload une image (jpeg/png/webp, ≤ 2 Mo) comme icône, **Then** cette
   image est utilisée à la place d'une icône de la palette.
2. **Given** une icône déjà choisie dans la palette, **When** l'utilisateur
   upload ensuite une image, **Then** l'image uploadée remplace le choix de
   palette (un seul type d'icône actif à la fois — pas de superposition).
3. **Given** une icône déjà uploadée, **When** l'utilisateur sélectionne à
   la place une icône de la palette, **Then** le choix de palette remplace
   l'image uploadée (symétrique du scénario précédent).

---

### User Story 3 - Affichage en cards dans le Store et l'annuaire (Priority: P1)

Le Store (`/store`), la liste des ressources d'une équipe, et l'annuaire des
équipes (`/teams`) affichent des cards avec icône plutôt que des lignes de
texte simples.

**Why this priority**: C'est la demande visuelle explicite de l'utilisateur
— sans elle, les icônes choisies en US1/US2 ne changent rien à l'expérience
perçue.

**Independent Test**: Consulter `/store`, `/teams`, et la section
"Ressources" d'une page d'équipe : chaque élément est présenté en card avec
son icône (choisie ou par défaut), pas en simple ligne de liste.

**Acceptance Scenarios**:

1. **Given** des ressources publiées (certaines avec icône choisie,
   d'autres sans), **When** le Store est consulté, **Then** chacune
   s'affiche en card avec son icône (choisie ou par défaut selon le type),
   nom, équipe, publieur, upvotes.
2. **Given** des équipes existantes, **When** l'annuaire (`/teams`) est
   consulté, **Then** chacune s'affiche en card avec son icône (choisie ou
   par défaut).

---

### Edge Cases

- Aucune validation de contenu de l'image uploadée au-delà du type MIME et
  de la taille (cohérent avec l'absence de validation de contenu déjà
  actée pour les avatars en feature 001 et les archives en feature 003).
- Remplacer une icône uploadée par une nouvelle (upload ou palette)
  supprime l'ancien fichier du stockage objet (pas d'accumulation de
  fichiers orphelins, cohérent avec le comportement déjà en place pour les
  avatars et les archives de ressources).
- La liste des membres d'une équipe (avatars utilisateur) n'est PAS
  concernée par cette feature — elle utilise déjà un mécanisme d'avatar
  dédié (feature 001), distinct de l'icône d'équipe/ressource introduite
  ici.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT proposer une palette fixe d'icônes
  prédéfinies, sélectionnable à la création et à la modification d'une
  équipe ou d'une ressource.
- **FR-002**: Le système DOIT permettre, en alternative à la palette,
  l'upload d'une image personnalisée (jpeg/png/webp, ≤ 2 Mo) comme icône
  d'équipe ou de ressource.
- **FR-003**: Une équipe ou une ressource DOIT avoir au plus un type
  d'icône actif à la fois (palette OU image uploadée, jamais les deux) —
  changer de choix remplace le précédent.
- **FR-004**: En l'absence de choix d'icône, le système DOIT afficher une
  icône par défaut : générique pour une équipe, dépendante du type
  (Skill/MCP/Agent) pour une ressource.
- **FR-005**: Seul l'owner d'une équipe, ou le publieur/owner d'une
  ressource (droits déjà définis en features 002/003, y compris la
  dérogation de suppression Admin de la feature 005 qui ne s'étend PAS à
  la modification d'icône — cohérent avec FR-002 de la feature 005), DOIT
  pouvoir modifier son icône.
- **FR-006**: Le Store (`/store`), la liste des ressources d'une équipe, et
  l'annuaire des équipes (`/teams`) DOIVENT afficher leurs éléments en
  cards avec icône plutôt qu'en lignes de liste simples.
- **FR-007**: Le système DOIT vérifier ces droits côté serveur exclusivement
  (jamais de confiance dans une donnée envoyée par le client), cohérent
  avec toutes les features précédentes.

### Key Entities

- **Team** (modifiée) : + `icon_preset` (texte, nullable — identifiant
  d'icône de la palette), `icon_object_key` (texte, nullable — clé de
  l'image uploadée dans MinIO). Au plus un des deux est renseigné (FR-003).
- **Resource** (modifiée) : mêmes champs `icon_preset`/`icon_object_key`,
  même règle d'exclusivité.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des équipes et ressources affichées (avec ou sans icône
  choisie) montrent une icône cohérente (choisie ou par défaut) — jamais
  d'espace vide ni de texte brut sans représentation visuelle.
- **SC-002**: Changer l'icône d'une équipe/ressource (palette ↔ upload) ne
  laisse jamais les deux représentations actives simultanément côté
  serveur.
- **SC-003**: 100% des tentatives de modification d'icône par un
  utilisateur sans droit (ni owner ni publieur) sont refusées (403).
- **SC-004**: Le Store, l'annuaire des équipes et la liste de ressources
  d'une équipe utilisent tous une présentation en cards (plus aucune liste
  texte simple sur ces trois vues).

## Assumptions

- Palette d'icônes basée sur `lucide-react` (déjà en dépendance depuis la
  feature 006) plutôt qu'un jeu d'émojis — cohérence visuelle avec le reste
  de l'interface (nav, boutons), pas de nouvelle dépendance, pas de
  problème de rendu inter-plateforme (contrairement aux émojis).
- Nouveau bucket MinIO dédié `icons` pour les images uploadées (équipes et
  ressources), distinct du bucket `avatars` (photos de profil utilisateur)
  et `resources` (archives ZIP) — cohérent avec la séparation par nature de
  contenu déjà actée en feature 003 (research.md #2).
- Le choix d'icône se fait dans le même formulaire que la création
  (équipe/ressource), pas dans une étape séparée après coup — plus simple
  pour l'utilisateur, cohérent avec la formulation de la demande ("lors de
  la création").
- Taille max de l'image uploadée : 2 Mo (plus petit que les avatars/
  archives, une icône n'a pas besoin d'être volumineuse) — détail
  d'implémentation sans conséquence produit.
