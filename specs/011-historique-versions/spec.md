# Feature Specification: Historique de versions des ressources

**Feature Branch**: `011-historique-versions`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Historique de versions des ressources — un push du même nom écrase silencieusement l'archive actuelle, sans trace de ce qui a changé."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulter et télécharger l'historique des versions (Priority: P1) 🎯 MVP

Un utilisateur qui consulte une ressource voit qu'elle a été mise à jour (nombre de versions, date de chaque mise à jour), et peut télécharger n'importe quelle version antérieure, pas seulement la dernière.

**Why this priority**: C'est la valeur directement demandée — aujourd'hui une mise à jour d'archive est un remplacement silencieux et définitif ; sans cette story, l'historique n'existe simplement pas.

**Independent Test**: Publier une ressource, remplacer son archive deux fois de suite (trois versions au total), ouvrir sa page, vérifier que les trois versions apparaissent avec leur date, et que télécharger la première version renvoie bien le tout premier fichier publié (pas le dernier).

**Acceptance Scenarios**:

1. **Given** une ressource dont l'archive a été remplacée au moins une fois, **When** un utilisateur autorisé à voir cette ressource ouvre sa page, **Then** il voit la liste de ses versions, chacune avec sa date de publication, la plus récente clairement identifiée comme la version actuelle.
2. **Given** cette liste de versions, **When** l'utilisateur choisit de télécharger une version antérieure, **Then** il reçoit exactement le contenu de l'archive tel qu'il était à ce moment-là, pas la version actuelle.
3. **Given** une ressource jamais mise à jour depuis sa publication initiale, **When** un utilisateur ouvre sa page, **Then** l'historique montre une unique version (celle de la publication), sans confusion ni état vide déroutant.

---

### User Story 2 - Décrire ce qui a changé (Priority: P2)

En remplaçant l'archive d'une ressource, celui qui publie la mise à jour peut indiquer brièvement ce qui a changé, visible ensuite dans l'historique à côté de la date de cette version.

**Why this priority**: Savoir *quand* une ressource a changé (US1) a déjà de la valeur seul ; savoir *pourquoi/quoi* est un raffinement qui demande un geste actif de la part du publieur (US1 fonctionne pleinement sans, donc dépendance dans un seul sens).

**Independent Test**: Remplacer l'archive d'une ressource en indiquant une note de version, vérifier que cette note apparaît associée à la bonne version dans l'historique — et que ne rien saisir reste possible sans bloquer la publication.

**Acceptance Scenarios**:

1. **Given** un utilisateur autorisé à mettre à jour une ressource, **When** il remplace l'archive, **Then** il peut (sans y être obligé) associer une courte note décrivant le changement à cette nouvelle version.
2. **Given** une version publiée sans note, **When** un utilisateur consulte l'historique, **Then** l'absence de note est claire (pas de texte factice ou trompeur), la date et le numéro de version restant la trace minimale garantie par US1.

### Edge Cases

- Que se passe-t-il si la même archive est republiée sans aucun changement de contenu ? Une nouvelle version est tout de même créée (le système ne compare pas le contenu binaire pour détecter une republication identique) — c'est un choix de simplicité documenté en Assumptions.
- Que se passe-t-il si une ressource est supprimée ? Toutes ses versions disparaissent avec elle (cohérent avec la suppression déjà existante d'une ressource et de son archive).
- Que se passe-t-il pour les ressources déjà publiées avant cette feature (une seule archive existante, sans historique) ? Elles doivent apparaître avec une unique version correspondant à leur archive actuelle, sans erreur ni migration manuelle requise.
- Que se passe-t-il si le nombre de versions devient très grand pour une ressource fréquemment mise à jour ? Couvert dans les Assumptions (pas de limite artificielle en v1, risque de croissance du stockage accepté et documenté plutôt que bloquant).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT conserver chaque version d'une ressource lors du remplacement de son archive, plutôt que d'écraser la précédente.
- **FR-002**: Un utilisateur autorisé à voir une ressource DOIT pouvoir consulter la liste de ses versions, chacune avec au minimum sa date de publication et un identifiant de version.
- **FR-003**: Un utilisateur autorisé à voir une ressource DOIT pouvoir télécharger le contenu exact de n'importe laquelle de ses versions antérieures, pas seulement la version actuelle.
- **FR-004**: La version la plus récente DOIT rester clairement identifiée comme celle téléchargée par défaut (comportement actuel du bouton "Télécharger" inchangé).
- **FR-005**: L'historique des versions DOIT respecter exactement les mêmes règles de visibilité que la ressource elle-même (une ressource d'équipe privée reste invisible, historique inclus, à un non-membre).
- **FR-006**: Les ressources publiées avant l'introduction de cette feature DOIVENT apparaître avec un historique cohérent (au minimum leur version actuelle), sans intervention manuelle.
- **FR-007**: Lors du remplacement d'une archive, l'utilisateur DOIT pouvoir associer une courte note décrivant le changement à la nouvelle version ; cette note DOIT être optionnelle (son absence ne bloque jamais la publication de la nouvelle version).
- **FR-008**: La suppression d'une ressource DOIT supprimer l'intégralité de son historique de versions, y compris les fichiers associés.

### Key Entities

- **Version de ressource** : représente l'état d'une ressource à un instant donné — le fichier archive associé, un numéro/identifiant de version, la date de publication, et une note optionnelle décrivant le changement. Une ressource a toujours au moins une version (celle de sa publication initiale) et au plus une version "actuelle" (la plus récente).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Après plusieurs mises à jour successives d'une même ressource, 100% des versions publiées restent consultables et téléchargeables individuellement, avec un contenu strictement identique à ce qui avait été publié à l'époque.
- **SC-002**: Un utilisateur peut déterminer depuis la page d'une ressource si et quand elle a été mise à jour sans quitter la page ni contacter le publieur.
- **SC-003**: 0 perte de données : aucune version d'archive n'est supprimée du stockage tant que la ressource elle-même n'est pas supprimée.
- **SC-004**: 100% des ressources publiées avant cette feature affichent un historique cohérent dès la mise en service, sans republication ni intervention manuelle.

## Assumptions

- **Pas de limite de rétention en v1** : toutes les versions sont conservées indéfiniment, sans purge automatique des anciennes versions. Risque de croissance du stockage accepté et documenté plutôt que bloquant pour cette v1 (cohérent avec la feature 009 — VPS aux ressources limitées, decisions similaires déjà prises pour les sauvegardes).
- **Pas de restauration ("rollback") en v1** : consulter/télécharger une version antérieure ne la rend pas de nouveau "actuelle" — pour cela, il faut republier une nouvelle version à partir de ce contenu. Une fonctionnalité de restauration en un clic pourra être une feature ultérieure si le besoin se confirme.
- **Republication identique** : aucune détection de doublon — remplacer une archive par un contenu strictement identique crée quand même une nouvelle version. Simplicité privilégiée sur l'optimisation d'un cas rare.
- **Numérotation séquentielle simple** (v1, v2, v3...) par ressource, dans l'ordre de publication.
- **Portée limitée au remplacement d'archive** : les modifications de nom/description d'une ressource (déjà traçées via sa date de dernière modification) ne créent pas de nouvelle version — seul le remplacement du fichier archive déclenche une nouvelle version.
