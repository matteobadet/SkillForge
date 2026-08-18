# Feature Specification: Aperçu du contenu d'une ressource

**Feature Branch**: `010-apercu-contenu`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Aperçu du contenu d'une ressource directement sur sa page, sans avoir à télécharger l'archive — afficher le fichier README/description technique (README.md ou SKILL.md à la racine) de façon lisible, avant même de cliquer sur Télécharger."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Voir l'aperçu avant de télécharger (Priority: P1) 🎯 MVP

Un utilisateur du Store consulte la page d'une ressource et voit directement le contenu de son fichier de description (README/SKILL), mis en forme lisible, sans avoir à télécharger et extraire l'archive pour savoir ce qu'elle contient.

**Why this priority**: C'est le point de friction le plus important identifié sur le Store actuel — sans aperçu, une ressource est une boîte noire et l'utilisateur doit télécharger à l'aveugle pour juger de sa pertinence.

**Independent Test**: Publier une ressource dont l'archive contient un `README.md` (ou `SKILL.md`) à sa racine, ouvrir sa page, vérifier que le contenu s'affiche mis en forme (titres, listes, blocs de code) sans action de téléchargement.

**Acceptance Scenarios**:

1. **Given** une ressource publiée avec un `README.md` ou `SKILL.md` à la racine de son archive, **When** un utilisateur autorisé à voir cette ressource ouvre sa page, **Then** le contenu de ce fichier s'affiche mis en forme lisible sur la page, sans clic supplémentaire.
2. **Given** l'archive d'une ressource est remplacée (mise à jour), **When** la page est rechargée, **Then** l'aperçu affiché reflète le contenu de la nouvelle archive, jamais l'ancienne version.
3. **Given** une ressource appartenant à une équipe privée, **When** un utilisateur qui n'est pas membre de cette équipe tente d'accéder à la page (s'il y parvient par un autre moyen), **Then** l'aperçu n'est ni chargé ni exposé, au même titre que le reste du contenu de la ressource.

---

### User Story 2 - Absence d'aperçu gérée proprement (Priority: P2)

Une ressource dont l'archive ne contient aucun fichier de description reconnu affiche un message clair indiquant qu'aucun aperçu n'est disponible, plutôt qu'un espace vide ou une erreur.

**Why this priority**: Toutes les ressources existantes et futures n'auront pas nécessairement de README/SKILL.md — l'absence d'aperçu doit rester une expérience propre, pas un signe de bug. Dépend de US1 (même mécanisme d'affichage).

**Independent Test**: Publier une ressource dont l'archive ne contient aucun fichier reconnu, ouvrir sa page, vérifier qu'un message clair s'affiche à la place de l'aperçu.

**Acceptance Scenarios**:

1. **Given** une ressource dont l'archive ne contient ni `README.md` ni `SKILL.md` à sa racine, **When** un utilisateur ouvre sa page, **Then** un message indique clairement qu'aucun aperçu n'est disponible pour cette ressource.

### Edge Cases

- Archive contenant à la fois `README.md` et `SKILL.md` : un seul est affiché, selon un ordre de priorité cohérent et prévisible (pas un choix arbitraire à chaque chargement).
- Fichier de description extrêmement volumineux : l'aperçu est tronqué à une taille raisonnable plutôt que de dégrader le temps de chargement de la page, avec une indication visuelle que le contenu est tronqué.
- Fichier nommé `README.md`/`SKILL.md` mais contenant en réalité des données binaires non textuelles : traité comme "aucun aperçu disponible" plutôt que d'afficher du contenu illisible.
- Archive corrompue ou illisible : traité comme "aucun aperçu disponible", sans faire échouer le chargement du reste de la page ressource.
- Contenu du fichier de description contenant du HTML/script actif : ne doit jamais s'exécuter dans le navigateur de l'utilisateur qui consulte l'aperçu.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT afficher, sur la page d'une ressource, un aperçu de son fichier de description (`README.md` ou `SKILL.md`, recherché à la racine de l'archive, insensible à la casse) sans action de téléchargement de la part de l'utilisateur.
- **FR-002**: L'aperçu DOIT être présenté avec une mise en forme lisible (titres, listes, blocs de code, liens) plutôt qu'en texte brut d'archive.
- **FR-003**: Si aucun fichier de description reconnu n'est trouvé, le système DOIT afficher un message clair indiquant l'absence d'aperçu, sans erreur ni espace vide silencieux.
- **FR-004**: L'aperçu DOIT respecter exactement les mêmes règles de visibilité que le reste de la ressource — un utilisateur non autorisé à voir une ressource (équipe privée dont il n'est pas membre) ne doit jamais pouvoir en obtenir l'aperçu.
- **FR-005**: Si plusieurs fichiers candidats sont présents dans l'archive, le système DOIT en sélectionner un seul selon un ordre de priorité défini et documenté.
- **FR-006**: Le système DOIT limiter la taille du contenu affiché, avec une indication visuelle lorsque le contenu réel dépasse cette limite et a été tronqué.
- **FR-007**: L'aperçu affiché DOIT toujours correspondre à la dernière archive publiée pour cette ressource, y compris après un remplacement de l'archive.
- **FR-008**: Le rendu de l'aperçu NE DOIT PAS exécuter de script ni de balisage actif potentiellement présent dans le fichier source.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur peut juger de la pertinence d'une ressource comportant un fichier de description reconnu sans quitter sa page ni la télécharger.
- **SC-002**: L'aperçu apparaît en moins d'une seconde après l'ouverture de la page ressource dans des conditions réseau normales, sans délai perceptible par rapport au reste de la page.
- **SC-003**: 100% des ressources sans fichier de description reconnu affichent un message clair plutôt qu'une erreur ou un espace vide.
- **SC-004**: 0 cas de contenu d'aperçu exposé à un utilisateur non autorisé à voir la ressource concernée.

## Assumptions

- **Fichiers reconnus** : `README.md` et `SKILL.md` (insensible à la casse), à la racine de l'archive uniquement (pas de recherche récursive dans des sous-dossiers). Si les deux sont présents, `SKILL.md` est prioritaire sur `README.md` (convention plus spécifique au cas d'usage principal de l'application — Skills/MCP/Agents Claude).
- **Extraction à la demande** : le contenu est lu depuis l'archive déjà stockée dans MinIO au moment de l'affichage de la page, plutôt qu'extrait et dupliqué en base au moment de la publication. Cela évite toute migration des ressources déjà publiées avant cette feature (l'aperçu fonctionne immédiatement pour l'historique existant) et garantit qu'il ne peut jamais devenir désynchronisé de l'archive réelle.
- **Rendu Markdown assaini** : le contenu est interprété comme Markdown et rendu en HTML mis en forme, avec assainissement du HTML généré pour empêcher toute exécution de script — cohérent avec la stack frontend existante (React), sans nouvelle dépendance côté serveur ni impact sur les ressources du VPS de production (specs/009-deploiement-k8s), le rendu se faisant entièrement côté navigateur.
- **Limite de taille** : contenu tronqué au-delà d'un seuil raisonnable (de l'ordre de 100 Ko), avec indication que l'aperçu est partiel.
- **Aucune distinction par type de ressource** : le mécanisme d'aperçu est identique pour les ressources de type Skill, MCP et Agent.
