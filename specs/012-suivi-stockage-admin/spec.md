# Feature Specification: Suivi de l'espace de stockage MinIO (admin)

**Feature Branch**: `012-suivi-stockage-admin`

**Created**: 2026-08-18

**Status**: Draft

**Input**: User description: "Suivi de l'espace de stockage MinIO pour les admins — donner une vue de l'espace utilisé pour repérer une dérive avant que le disque du VPS ne soit plein, sans automatisation de nettoyage."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Voir l'espace de stockage total utilisé (Priority: P1) 🎯 MVP

Un administrateur consulte une vue dédiée qui lui indique combien d'espace est actuellement utilisé dans le stockage de fichiers de l'application, sans avoir à se connecter à un outil externe ni à demander à quelqu'un d'autre.

**Why this priority**: C'est la valeur minimale demandée — avant cette feature, personne ne sait combien d'espace est utilisé avant que le disque du VPS soit plein. Sans cette story, il n'y a aucune visibilité du tout.

**Independent Test**: Se connecter avec un compte Admin, ouvrir la vue de suivi du stockage, vérifier qu'un total d'espace utilisé s'affiche et qu'il correspond à peu près à la réalité (par exemple après publication d'une nouvelle ressource, le total augmente).

**Acceptance Scenarios**:

1. **Given** un compte avec le rôle Admin, **When** il ouvre la vue de suivi du stockage, **Then** il voit un total d'espace utilisé exprimé dans une unité lisible (Mo/Go), reflétant l'état réel au moment de la consultation.
2. **Given** un compte sans le rôle Admin, **When** il tente d'accéder à cette vue ou à ses données, **Then** l'accès lui est refusé.
3. **Given** la vue de suivi du stockage déjà ouverte, **When** l'administrateur la rafraîchit après qu'une nouvelle ressource ait été publiée, **Then** le total affiché reflète l'augmentation.

---

### User Story 2 - Comprendre la répartition de l'espace utilisé (Priority: P2)

Un administrateur voit non seulement le total, mais aussi comment cet espace se répartit (par exemple entre archives de ressources et images/icônes), pour comprendre ce qui pousse la croissance du stockage.

**Why this priority**: Le total seul (US1) permet déjà de détecter une dérive générale ; la répartition est un raffinement qui aide à comprendre *où* agir, mais n'est pas indispensable pour la valeur de base.

**Independent Test**: Publier une ressource avec une grosse archive puis consulter la vue : la catégorie correspondant aux archives de ressources doit avoir augmenté, sans affecter les autres catégories.

**Acceptance Scenarios**:

1. **Given** la vue de suivi du stockage, **When** un administrateur la consulte, **Then** il voit l'espace utilisé détaillé par grande catégorie de contenu (ex. archives de ressources, icônes/avatars), en plus du total.
2. **Given** une catégorie de contenu qui n'a encore aucun fichier, **When** l'administrateur consulte la vue, **Then** cette catégorie apparaît avec une valeur nulle plutôt que d'être absente ou de provoquer une erreur.

### Edge Cases

- Que se passe-t-il si le service de stockage de fichiers est temporairement injoignable au moment de la consultation ? La vue DOIT l'indiquer clairement (message d'erreur explicite) plutôt que d'afficher un total silencieusement faux (zéro ou périmé présenté comme actuel).
- Que se passe-t-il s'il y a un très grand nombre de fichiers stockés ? Le calcul DOIT rester correct même s'il prend un peu plus de temps ; aucune limite artificielle ne doit fausser le total (pas de troncature silencieuse au-delà d'un certain nombre de fichiers).
- Que se passe-t-il pour un compte Admin qui n'a jamais eu besoin de cette vue jusqu'ici ? Aucune configuration préalable n'est nécessaire : la vue doit être utilisable immédiatement après déploiement de la feature.
- Cette feature ne couvre PAS l'espace disque du VPS pris par la base de données, les images de conteneurs ou les journaux système — seulement ce qui est stocké dans le service de stockage de fichiers de l'application (cf. Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le système DOIT restreindre l'accès à la vue de suivi du stockage et à ses données aux seuls utilisateurs ayant le rôle Admin ; toute tentative d'accès par un compte sans ce rôle DOIT être refusée.
- **FR-002**: Le système DOIT afficher à l'administrateur l'espace total actuellement utilisé par les fichiers stockés par l'application, exprimé dans une unité lisible par un humain (ex. Mo, Go).
- **FR-003**: Le système DOIT afficher une répartition de cet espace par grande catégorie de contenu (au minimum : archives de ressources d'un côté, images/icônes de l'autre).
- **FR-004**: L'espace affiché DOIT refléter l'état réel au moment de la consultation (pas une valeur mise en cache de façon prolongée ni pré-calculée à l'avance) ; l'administrateur DOIT pouvoir rafraîchir la vue pour obtenir une mesure à jour.
- **FR-005**: Si la mesure de l'espace utilisé échoue (service de stockage injoignable, erreur), le système DOIT informer clairement l'administrateur de l'échec plutôt que d'afficher un total trompeur.
- **FR-006**: La vue DOIT rester utilisable sans qu'aucune donnée historique n'ait besoin d'exister au préalable (aucune migration ou étape de configuration manuelle requise après déploiement).

### Key Entities

Aucune nouvelle entité persistée : cette feature expose une mesure calculée à la demande à partir du contenu déjà stocké (ressources, icônes/avatars existants), sans introduire de nouvel objet de données propre.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un administrateur peut connaître l'espace de stockage total utilisé par l'application en moins de 10 secondes depuis sa connexion, sans quitter l'application ni contacter un tiers.
- **SC-002**: 100% des tentatives d'accès à cette vue par un compte non-Admin sont refusées.
- **SC-003**: Après l'ajout ou la suppression d'un fichier notable (nouvelle ressource, changement d'icône), un rafraîchissement de la vue reflète le changement, sans délai de propagation perceptible par l'utilisateur au-delà du temps de calcul lui-même.
- **SC-004**: La vue reste fonctionnelle et lisible même lorsque le nombre de fichiers stockés est élevé (des centaines de ressources et de versions), sans erreur ni total tronqué.

## Assumptions

- **Portée limitée au stockage de fichiers de l'application (MinIO)** : l'espace disque pris par la base de données, les images de conteneurs ou les journaux système n'est pas couvert par cette feature — seul ce qui est directement lié au contenu applicatif (archives de ressources, icônes/avatars) est mesuré.
- **Calcul en temps réel, pas de colonne de taille en base de données** : cohérent avec la philosophie déjà adoptée pour les features 010 et 011 (pas de migration, calcul à la demande) — la taille est interrogée directement depuis le service de stockage à chaque consultation plutôt que suivie et mise à jour en base à chaque publication.
- **Pas d'historique ni de graphique d'évolution en v1** : la vue montre l'état actuel, pas une tendance dans le temps. Une évolution future pourra ajouter un suivi dans la durée si le besoin se confirme.
- **Pas d'alerte automatique ni de seuil configurable en v1** : la feature donne de la visibilité à la demande ; elle ne prévient pas proactivement (ex. email, notification) en cas de dépassement d'un seuil. Portée volontairement limitée à la consultation, cohérent avec l'objectif énoncé ("juste de la visibilité", pas d'automatisation).
- **Pas d'action de nettoyage depuis cette vue** : purger ou supprimer des fichiers depuis cette vue est hors périmètre — elle est strictement en lecture. Toute suppression reste un acte volontaire ailleurs dans l'application (suppression de ressource existante).
- **Nouvelle vue dédiée, réservée aux administrateurs** : comme aucune page d'administration n'existe encore, cette feature introduit un premier point d'entrée minimal pour cet usage (cohérent avec la portée "Admin minimal" déjà actée pour le projet), sans construire un tableau de bord d'administration plus large.
