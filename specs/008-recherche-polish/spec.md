# Feature Specification: Recherche/filtres et corrections de champs

**Feature Branch**: `008-recherche-polish`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Recherche et filtres sur le store et l'annuaire équipes, correction du style des champs de formulaire (texte et fichier)" — retour utilisateur sur captures d'écran de l'application réelle : (1) les champs "Nom" (équipe, ressource) et "Pseudo" ont un rendu natif non stylé ("moche"), (2) le champ d'upload de fichier (avatar) a le même problème, (3) absence de recherche/filtre sur le Store et l'annuaire des équipes.

**Depends on**: [003-publication-ressources](../003-publication-ressources/spec.md),
[002-gestion-equipes](../002-gestion-equipes/spec.md),
[006-design-ui](../006-design-ui/spec.md) (design system),
[007-icones-cards](../007-icones-cards/spec.md) (cards, pattern d'upload déjà stylé dans `IconPicker`)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Corriger le style des champs de texte (Priority: P1)

Tous les champs de saisie de texte (nom d'équipe, nom de ressource,
pseudo, etc.) ont un rendu cohérent avec le design system, pas le rendu
natif du navigateur.

**Why this priority**: C'est un bug visible sur plusieurs pages déjà
livrées (régression de présentation, pas une nouvelle fonctionnalité) —
priorité la plus haute car le plus simple à corriger et le plus visible.

**Independent Test**: Consulter les pages "Créer une équipe", "Modifier
l'équipe", "Publier une ressource", "Modifier une ressource", "Mon profil"
: tous les champs de saisie de texte doivent avoir le même style (bordure,
fond, rayon) que les champs déjà corrects (ex. email/mot de passe sur la
page de connexion).

**Acceptance Scenarios**:

1. **Given** un champ de saisie de texte simple sans attribut `type` HTML
   explicite (ex. le nom d'une équipe), **When** la page est affichée,
   **Then** son style est identique aux autres champs du design system
   (pas le rendu natif du navigateur).

---

### User Story 2 - Corriger le style des champs de fichier (Priority: P2)

Les champs d'upload de fichier (avatar, archive de ressource) ont une
présentation cohérente avec le design system plutôt que le bouton natif du
navigateur.

**Why this priority**: Même nature de bug que US1 mais sur un composant
déjà partiellement traité ailleurs (le sélecteur d'icône de la feature 007
a déjà un motif de champ fichier stylé) — moins urgent car visuellement
moins présent (un seul endroit par page).

**Independent Test**: Consulter "Mon profil" (upload avatar) et "Publier
une ressource" (upload archive) : le contrôle de sélection de fichier a une
présentation cohérente avec le reste du design system (pas le bouton gris
natif du système d'exploitation).

**Acceptance Scenarios**:

1. **Given** un champ d'upload de fichier, **When** la page est affichée,
   **Then** il utilise une présentation stylée (icône + texte cliquable)
   cohérente avec le motif déjà en place dans le sélecteur d'icône
   (feature 007), pas le bouton natif du navigateur.

---

### User Story 3 - Rechercher et filtrer dans le Store (Priority: P1)

Un utilisateur recherche une ressource par nom et filtre par type
(Skill/MCP/Agent) dans le Store.

**Why this priority**: Demande explicite de l'utilisateur — sans elle, le
Store devient difficile à parcourir dès que le nombre de ressources
grandit.

**Independent Test**: Avec plusieurs ressources de types différents dans
le Store, saisir un terme de recherche et vérifier que seules les
ressources correspondantes restent affichées ; sélectionner un filtre de
type et vérifier le même comportement, combinable avec la recherche.

**Acceptance Scenarios**:

1. **Given** le Store affiche plusieurs ressources, **When** l'utilisateur
   saisit un terme dans le champ de recherche, **Then** seules les
   ressources dont le nom, l'équipe ou le publieur contiennent ce terme
   (insensible à la casse) restent affichées.
2. **Given** le Store affiche plusieurs ressources de types différents,
   **When** l'utilisateur sélectionne un type dans le filtre, **Then**
   seules les ressources de ce type restent affichées.
3. **Given** une recherche et un filtre de type actifs simultanément,
   **When** l'utilisateur consulte le résultat, **Then** seules les
   ressources satisfaisant les deux critères à la fois sont affichées.
4. **Given** aucune ressource ne correspond aux critères actifs, **When**
   l'utilisateur consulte le résultat, **Then** un message clair l'indique
   (pas une grille vide sans explication).

---

### User Story 4 - Rechercher et filtrer dans l'annuaire des équipes (Priority: P1)

Un utilisateur recherche une équipe par nom dans l'annuaire (`/teams`),
dans "Mes équipes" et "Équipes publiques".

**Why this priority**: Même demande explicite, appliquée à l'autre vue en
liste principale de l'application.

**Independent Test**: Avec plusieurs équipes affichées, saisir un terme de
recherche et vérifier que seules les équipes correspondantes restent
affichées, dans les deux sections.

**Acceptance Scenarios**:

1. **Given** l'annuaire affiche plusieurs équipes dans "Mes équipes" et
   "Équipes publiques", **When** l'utilisateur saisit un terme de
   recherche, **Then** seules les équipes dont le nom contient ce terme
   (insensible à la casse) restent affichées dans les deux sections.

---

### Edge Cases

- La recherche/filtre est appliquée côté client sur les données déjà
  chargées (pas de nouvel appel réseau par frappe) — cohérent avec
  l'échelle du projet (usage entre amis, dizaines d'éléments au plus,
  cf. constitution).
- Un champ de recherche vide affiche l'ensemble des éléments (comportement
  actuel inchangé).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Tout champ de saisie de texte simple DOIT avoir le style du
  design system, indépendamment de la présence d'un attribut `type` HTML
  explicite dans le code source.
- **FR-002**: Tout champ d'upload de fichier DOIT utiliser une présentation
  stylée cohérente (motif déjà établi dans `IconPicker`, feature 007)
  plutôt que le contrôle natif brut du navigateur.
- **FR-003**: Le Store DOIT proposer une recherche texte (nom, équipe,
  publieur) et un filtre par type (Skill/MCP/Agent), combinables.
- **FR-004**: L'annuaire des équipes DOIT proposer une recherche texte par
  nom, appliquée à "Mes équipes" et "Équipes publiques".
- **FR-005**: Un résultat de recherche/filtre vide DOIT afficher un message
  explicite, distinct du message "aucune ressource/équipe" affiché en
  l'absence de tout élément.

### Key Entities

Aucune nouvelle entité ni changement de données — recherche/filtre
appliqués côté client sur des données déjà exposées par l'API existante.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% des champs de saisie de texte simple du site partagent
  visuellement le même style (vérifié sur les 5 pages concernées : Créer/
  Modifier équipe, Publier/Modifier ressource, Profil).
- **SC-002**: 100% des champs d'upload de fichier partagent la même
  présentation stylée.
- **SC-003**: La recherche et le filtre du Store et de l'annuaire des
  équipes retournent des résultats corrects et combinables, sans appel
  réseau supplémentaire par frappe.

## Assumptions

- Recherche/filtre client-side uniquement (pas de nouvel endpoint API) —
  cohérent avec l'échelle du projet (constitution : pas de scalabilité
  massive requise).
- Pas de recherche par tags/catégories (fonctionnalité distincte,
  explicitement écartée du MVP en amont) — uniquement nom/équipe/publieur
  pour le Store et nom pour les équipes, cohérent avec les champs déjà
  affichés dans les cards (feature 007).
