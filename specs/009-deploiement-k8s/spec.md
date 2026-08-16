# Feature Specification: Déploiement production sur VPS via Kubernetes

**Feature Branch**: `009-deploiement-k8s`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Déploiement de SkillForge en production sur un VPS via Kubernetes (k3s). VPS existant (Ubuntu 26.04, 4 coeurs/3.7GB RAM), k3s mono-noeud (Traefik + local-path-provisioner inclus), images publiées sur GitHub Container Registry via GitHub Actions, domaines skillforge.mbadet.fr (frontend) et api.skillforge.mbadet.fr (API), TLS Let's Encrypt via cert-manager."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accéder à SkillForge en production (Priority: P1) 🎯 MVP

Un membre du cercle d'amis ouvre `https://skillforge.mbadet.fr` dans son navigateur, se connecte, consulte le store et les équipes, exactement comme en local — mais l'application est désormais accessible en permanence depuis n'importe où, en HTTPS.

**Why this priority**: C'est la valeur livrée par cette feature : sans ça, l'application n'existe qu'en local sur le poste de développement. Rien d'autre n'a de sens sans cette base.

**Independent Test**: Depuis un poste externe (hors réseau local), ouvrir `https://skillforge.mbadet.fr`, se connecter avec un compte existant, publier/consulter une ressource, vérifier le cadenas HTTPS valide.

**Acceptance Scenarios**:

1. **Given** le déploiement est en place, **When** un utilisateur ouvre `https://skillforge.mbadet.fr`, **Then** l'application se charge avec un certificat HTTPS valide (pas d'avertissement navigateur).
2. **Given** un compte existant, **When** l'utilisateur se connecte et effectue les actions courantes (créer une équipe, publier une ressource, upvote), **Then** ces actions fonctionnent comme en local et les données persistent après un rafraîchissement de page.
3. **Given** l'application tourne, **When** un pod applicatif (API ou frontend) redémarre (crash, mise à jour), **Then** l'application redevient accessible en moins d'une minute sans intervention manuelle, et les données existantes ne sont pas perdues.

---

### User Story 2 - Publier une nouvelle version en poussant sur `main` (Priority: P2)

Le mainteneur du projet pousse une modification sur la branche `main` de GitHub ; sans action manuelle sur le VPS, la nouvelle version de l'API et/ou du frontend est buildée, publiée, et déployée en production.

**Why this priority**: Sans automatisation, chaque nouvelle feature (comme les 8 précédentes) nécessiterait un déploiement manuel fastidieux et source d'erreurs sur le VPS. C'est ce qui rend le déploiement soutenable dans la durée, mais l'application peut déjà être mise en production manuellement une première fois sans cette automatisation (dépend de US1).

**Independent Test**: Pousser un commit trivial (ex. modification du README) sur `main`, observer le workflow GitHub Actions se déclencher, builder les images, les publier sur GHCR, et le VPS servir la nouvelle version sans commande manuelle.

**Acceptance Scenarios**:

1. **Given** un commit poussé sur `main` qui modifie le backend ou le frontend, **When** le workflow CI/CD se termine avec succès, **Then** les nouvelles images sont visibles sur GHCR avec un tag identifiable (ex. le SHA du commit) et le VPS exécute la nouvelle version dans les minutes qui suivent.
2. **Given** un déploiement en cours de mise à jour, **When** la nouvelle version démarre, **Then** le service reste accessible (pas de coupure prolongée) et si la nouvelle version ne démarre pas correctement (échec des health checks), l'ancienne version continue de servir le trafic.

---

### User Story 3 - Les données survivent aux redémarrages et mises à jour (Priority: P1)

Les comptes, équipes, ressources publiées et fichiers (archives, icônes, avatars) existants restent intacts et accessibles après un redémarrage du VPS, un redéploiement, ou un crash d'un composant.

**Why this priority**: Une application en production qui perd les données de ses utilisateurs à chaque redémarrage n'est pas utilisable en pratique — c'est aussi fondamental que l'accessibilité (US1), dont ça dépend techniquement (mêmes composants Postgres/MinIO).

**Independent Test**: Créer une ressource de test, redémarrer le VPS (`sudo reboot`), attendre que le cluster revienne, vérifier que la ressource et son fichier téléchargeable sont toujours présents.

**Acceptance Scenarios**:

1. **Given** des données existent (comptes, équipes, ressources, fichiers), **When** le VPS redémarre entièrement, **Then** au retour du cluster toutes les données et fichiers sont intacts sans intervention manuelle.
2. **Given** un pod de base de données ou de stockage de fichiers redémarre seul, **Then** il retrouve son état précédent sans perte de données à sa relance.

### Edge Cases

- Que se passe-t-il si le certificat Let's Encrypt échoue à se renouveler (ex. DNS temporairement cassé) ? L'application doit rester joignable avec l'ancien certificat jusqu'à expiration, et l'échec doit être visible dans les logs de cert-manager.
- Que se passe-t-il si le disque du VPS (38 Go) se remplit (archives de ressources, images de conteneurs, logs) ? Le système doit rester diagnosticable (pas de crash silencieux total) ; la surveillance de l'espace disque reste une opération manuelle dans cette v1.
- Que se passe-t-il si un déploiement de nouvelle version échoue au démarrage (erreur de config, migration DB cassée) ? Le pod précédent qui fonctionne doit continuer de servir le trafic (pas de coupure), et l'échec doit être visible via `kubectl get pods`/`kubectl logs`.
- Que se passe-t-il en cas de pic mémoire dépassant les 3.7 Go disponibles ? Kubernetes doit arrêter (OOMKill) le pod le moins prioritaire plutôt que de planter le nœud entier ; ce risque est documenté comme limite connue de ce VPS (voir Assumptions).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le VPS DOIT exécuter un cluster Kubernetes mono-nœud (k3s) opérationnel, avec l'ingress controller et le provisioning de stockage persistant fonctionnels dès l'installation.
- **FR-002**: Le frontend DOIT être servi en mode production (fichiers statiques buildés), et non via un serveur de développement, pour des raisons de performance et de sécurité.
- **FR-003**: L'API et le frontend DOIVENT être empaquetés en images de conteneur publiées sur un registre accessible par le cluster (GitHub Container Registry).
- **FR-004**: Le système DOIT exposer le frontend sur `https://skillforge.mbadet.fr` et l'API sur `https://api.skillforge.mbadet.fr`, chacun avec un certificat TLS valide émis et renouvelé automatiquement (Let's Encrypt).
- **FR-005**: PostgreSQL et MinIO DOIVENT utiliser un stockage persistant qui survit à la suppression/au redémarrage de leurs pods respectifs.
- **FR-006**: Les secrets (mot de passe de base de données, clé de signature JWT, identifiants MinIO) NE DOIVENT PAS être stockés en clair dans le dépôt Git ; ils sont gérés comme secrets Kubernetes.
- **FR-007**: Un pipeline CI/CD DOIT, à chaque push sur `main` modifiant le backend ou le frontend, builder les images correspondantes, les publier sur le registre, et mettre à jour le déploiement sur le VPS.
- **FR-008**: Les déploiements applicatifs (API, frontend) DOIVENT exposer un mécanisme de vérification de bonne santé (health check) utilisé par Kubernetes pour détecter un pod défaillant et ne pas lui router de trafic.
- **FR-009**: La configuration de déploiement (manifests Kubernetes, Dockerfiles de production) DOIT être versionnée dans le dépôt Git, à l'exception des valeurs secrètes elles-mêmes.
- **FR-010**: La console d'administration MinIO NE DOIT PAS être exposée publiquement ; seule l'API S3 nécessaire au fonctionnement de l'application (upload, téléchargement via URL présignée) est accessible depuis l'extérieur via l'API applicative existante.

### Key Entities

- **Cluster k3s** : le nœud Kubernetes unique tournant sur le VPS, hébergeant tous les composants applicatifs.
- **Image de conteneur** : artefact buildé (API, frontend) publié sur GitHub Container Registry, versionné par tag (SHA de commit).
- **Secret de déploiement** : identifiants sensibles (DB, JWT, MinIO) injectés aux pods sans transiter par le dépôt Git.
- **Volume persistant** : stockage disque alloué à PostgreSQL et MinIO, indépendant du cycle de vie de leurs pods.
- **Certificat TLS** : certificat Let's Encrypt par domaine (`skillforge.mbadet.fr`, `api.skillforge.mbadet.fr`), à renouvellement automatique.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un utilisateur externe peut ouvrir `https://skillforge.mbadet.fr` et accomplir un parcours complet (connexion, consultation du store, publication d'une ressource) sans erreur, avec un certificat HTTPS valide.
- **SC-002**: Après un redémarrage complet du VPS, l'application redevient pleinement fonctionnelle en moins de 5 minutes sans intervention manuelle, et 100% des données créées avant le redémarrage sont toujours présentes.
- **SC-003**: Un changement de code poussé sur `main` est visible en production (nouvelle version servie) en moins de 10 minutes, sans qu'aucune commande ne soit tapée manuellement sur le VPS.
- **SC-004**: Pendant une mise à jour de version, l'application reste joignable en continu (aucune fenêtre d'indisponibilité perçue par un utilisateur qui rafraîchit la page).

## Assumptions

- **Pas de sauvegarde automatisée en v1** : les données Postgres/MinIO ne sont pas exportées automatiquement vers un stockage externe au VPS. Vu l'usage (cercle d'amis, MVP), c'est un risque accepté documenté plutôt qu'un blocage ; une stratégie de backup pourra être ajoutée dans une feature ultérieure.
- **Mise à jour en « recreate » simple** : pas de stratégie blue-green/canary sophistiquée ; Kubernetes gère un rolling update standard (nouveau pod prêt avant coupure de l'ancien), suffisant pour ce volume d'usage.
- **Un seul environnement** : pas d'environnement de staging séparé sur ce VPS ; `main` déploie directement en production, cohérent avec le fonctionnement actuel du projet (un commit par feature, poussé directement sur `main`).
- **Ressources limitées connues** : le VPS (3.7 Go RAM) est un facteur de risque documenté plutôt qu'un blocage ; le dimensionnement des composants (Postgres, MinIO, API, frontend, Traefik, cert-manager) devra rester frugal pour tenir dans cette enveloppe.
- **Surveillance manuelle** : pas d'alerting automatisé (espace disque, mémoire) en v1 ; `kubectl` reste l'outil de diagnostic principal.
- **DNS déjà en cours de configuration** par l'utilisateur pour les deux sous-domaines vers l'IP du VPS ; cette feature suppose que la résolution DNS est fonctionnelle avant l'émission des certificats TLS.
