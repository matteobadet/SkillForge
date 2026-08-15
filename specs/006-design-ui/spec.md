# Feature Specification: Passe de style UI

**Feature Branch**: `006-design-ui`

**Created**: 2026-08-15

**Status**: Draft

**Input**: User description: "Passe de style : design system, navigation avec icônes, restylage de toutes les pages existantes"

**Contexte** : le brief initial demandait un "menu moderne avec icônes".
Les features 001-005 ont délibérément livré des pages fonctionnelles mais
non stylées (décision actée : une seule passe de style dédiée une fois
l'app existante, plutôt que de styliser feature par feature — cf. mémoire
projet). Cette feature couvre cette passe, sur l'ensemble des pages déjà
livrées : `LoginPage`, `SignupPage`, `ProfilePage`, `TeamsDirectoryPage`,
`CreateTeamPage`, `TeamPage`, `JoinTeamPage`, `StorePage`,
`PublishResourcePage`, `ResourcePage`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Navigation cohérente avec icônes (Priority: P1)

Un utilisateur connecté navigue entre Store, Équipes et Profil via un menu
persistant avec icônes, visible sur toutes les pages authentifiées.

**Why this priority**: C'est l'exigence explicite du brief ("menu moderne
avec icônes") et ce qui structure la navigation de l'ensemble de
l'application — sans cela, le reste du style n'a pas de cadre cohérent.

**Independent Test**: Depuis n'importe quelle page authentifiée, le menu
(Store / Équipes / Profil / Déconnexion, chacun avec une icône) est visible
et chaque lien navigue vers la bonne page.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté sur n'importe quelle page
   authentifiée, **When** il consulte le haut de la page, **Then** un menu
   affiche des icônes + libellés pour Store, Équipes, Profil, et une action
   de déconnexion.
2. **Given** ce menu, **When** l'utilisateur clique sur un lien, **Then** il
   est dirigé vers la page correspondante sans perte d'état de session.
3. **Given** l'utilisateur est sur la page correspondant à un lien du menu,
   **When** il consulte le menu, **Then** ce lien est visuellement
   distingué comme actif.

---

### User Story 2 - Habillage visuel cohérent de toutes les pages (Priority: P1)

Toutes les pages listées ci-dessus (formulaires, listes, boutons, messages
d'erreur) partagent une même identité visuelle (couleurs, typographie,
espacements, composants) plutôt que du HTML brut sans style.

**Why this priority**: C'est l'objet même de cette feature — sans un
habillage cohérent sur l'ensemble des pages, l'application resterait
incohérente visuellement d'une page à l'autre.

**Independent Test**: Parcourir chacune des 10 pages listées et constater
visuellement l'usage cohérent des mêmes couleurs, boutons, cartes/listes et
espacements (pas de HTML non stylé résiduel).

**Acceptance Scenarios**:

1. **Given** n'importe laquelle des 10 pages existantes, **When** elle est
   consultée, **Then** elle utilise le même système de couleurs,
   typographie et composants (boutons, champs de formulaire, cartes/listes,
   messages d'erreur/succès) que les autres.
2. **Given** une action déjà fonctionnelle avant cette feature (login,
   créer une équipe, publier une ressource, upvote, etc.), **When** elle
   est exécutée après le restylage, **Then** elle se comporte exactement
   comme avant (aucune régression fonctionnelle, seul l'habillage change).

---

### User Story 3 - Pages de connexion/inscription dédiées (Priority: P2)

Les pages `LoginPage`/`SignupPage` (avant authentification) ont une
présentation centrée et soignée, sans le menu applicatif (qui n'a pas de
sens tant que l'utilisateur n'est pas connecté).

**Why this priority**: Première impression de l'application ; distincte du
reste (P2 plutôt que P1) car elle ne bloque pas l'usage du reste de l'UI
déjà stylée par la User Story 2.

**Independent Test**: Consulter `/login` et `/signup` déconnecté : mise en
page centrée, cohérente avec le design system, sans menu Store/Équipes/
Profil (qui nécessitent une session).

**Acceptance Scenarios**:

1. **Given** un visiteur non connecté, **When** il consulte `/login` ou
   `/signup`, **Then** la page est centrée, stylée selon le même design
   system que le reste de l'app, sans menu applicatif.

---

### Edge Cases

- Une page sans aucune donnée (ex. store vide, aucune équipe) DOIT rester
  lisible et cohérente avec le design system (pas de mise en page cassée
  sur les états vides déjà gérés fonctionnellement par les features
  précédentes).
- Le menu reste utilisable même sur une page dont le contenu métier a
  échoué à charger (ex. ressource introuvable) — la navigation ne doit
  jamais dépendre du succès du chargement de la page courante.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT définir un design system central (variables
  CSS : couleurs, typographie, espacements, rayons, ombres) appliqué à
  l'ensemble des pages, plutôt que des styles ad hoc par page.
- **FR-002**: Le système DOIT afficher un menu de navigation persistant
  avec icônes (Store, Équipes, Profil, Déconnexion) sur toutes les pages
  authentifiées.
- **FR-003**: Le système DOIT fournir des styles cohérents pour les
  éléments réutilisés sur plusieurs pages : boutons (primaire/secondaire/
  danger), champs de formulaire, listes/cartes de ressources et
  d'équipes, messages d'erreur/succès.
- **FR-004**: Les pages `LoginPage`/`SignupPage` DOIVENT avoir une mise en
  page centrée dédiée, sans le menu applicatif (non pertinent avant
  authentification).
- **FR-005**: Le restylage NE DOIT introduire aucune régression
  fonctionnelle : tous les tests automatisés existants (Vitest, xUnit)
  DOIVENT continuer de passer, et tous les parcours déjà validés dans les
  features 001-005 DOIVENT rester fonctionnellement identiques.
- **FR-006**: Le système NE DOIT PAS introduire de framework CSS complet
  (Tailwind, Bootstrap, Material UI) ni de bibliothèque de composants —
  uniquement du CSS simple à base de variables et, si nécessaire, une
  bibliothèque d'icônes légère (cf. plan.md pour le choix).

### Key Entities

Aucune (feature purement front-end/présentation, aucune entité de données
nouvelle ou modifiée).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Les 10 pages existantes utilisent toutes le même ensemble de
  variables de design (couleurs/typographie/espacement) — aucune couleur
  ou taille codée en dur isolée d'une page à l'autre.
- **SC-002**: Le menu avec icônes est présent et fonctionnel sur 100% des
  pages authentifiées.
- **SC-003**: 100% des tests automatisés existants (backend et frontend)
  passent toujours après le restylage.
- **SC-004**: Chacun des parcours suivants, déjà validés manuellement dans
  les features précédentes, est revérifié manuellement après restylage
  sans régression : inscription/connexion, création/adhésion à une équipe,
  publication/téléchargement/upvote d'une ressource, suppression admin.

## Assumptions

- Thème visuel unique (clair), pas de bascule sombre/clair (non demandée).
- Navigation en barre supérieure persistante (pas de menu latéral), choix
  d'implémentation sans conséquence produit.
- Bibliothèque d'icônes légère ajoutée en dépendance (choix technique
  détaillé en plan.md) — seule nouvelle dépendance de cette feature,
  justifiée par l'exigence explicite du brief ("icônes").
- Pas d'optimisation mobile poussée au-delà d'une mise en page qui ne casse
  pas sur petit écran (non demandée explicitement).
