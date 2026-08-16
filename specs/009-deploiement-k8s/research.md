# Phase 0 Research: Déploiement production sur VPS via Kubernetes

## 1. Installation de k3s

**Decision**: Script d'installation officiel (`curl -sfL https://get.k3s.io | sh -`), canal `stable`, sans désactiver Traefik ni le `local-path-provisioner` (composants par défaut conservés).

**Rationale**: C'est la méthode standard, documentée, et testée pour un
mono-nœud ; elle installe en une commande un cluster fonctionnel avec
ingress et provisioning de stockage prêts à l'emploi — exactement ce dont
cette feature a besoin, sans étape d'intégration supplémentaire.

**Alternatives considered**: `kubeadm` (rejeté : plus lourd, nécessite
d'installer CNI/ingress/storage séparément, aucun bénéfice pour un seul
nœud) ; k0s/microk8s (rejeté : moins répandu que k3s pour ce cas d'usage,
pas de gain net).

## 2. Persistance (PostgreSQL, MinIO)

**Decision**: PersistentVolumeClaim sur la StorageClass par défaut `local-path`
(fournie par k3s), un volume dédié par composant stateful.

**Rationale**: Mono-nœud → un stockage réseau (Ceph, Longhorn) n'apporte
aucune résilience supplémentaire (il n'y a qu'un seul nœud de toute façon)
et consommerait une part significative des 3.7 Go de RAM disponibles.
`local-path` monte un `hostPath` géré automatiquement, suffisant tant que
le pod reste sur ce nœud (cas garanti ici).

**Alternatives considered**: Longhorn/Ceph (rejeté : overhead mémoire
disproportionné pour un cluster mono-nœud) ; volume réseau externe au VPS
(rejeté : hors scope, aucun service de ce type provisionné).

## 3. Authentification du cluster auprès de GHCR

**Decision**: `imagePullSecret` Kubernetes de type `kubernetes.io/dockerconfigjson`,
créé une fois via `kubectl create secret docker-registry`, à partir d'un
Personal Access Token GitHub (classic, scope `read:packages` uniquement),
référencé dans chaque Deployment tirant une image GHCR.

**Rationale**: Fonctionne indépendamment de la visibilité (publique ou
privée) du package GHCR — pas de dépendance à une bascule manuelle de
visibilité dans l'UI GitHub qui pourrait être oubliée. Le token n'a que le
scope minimal nécessaire (lecture de packages), cohérent avec le principe
de moindre privilège.

**Alternatives considered**: Rendre les packages GHCR publics pour éviter
le secret (rejeté : dépend d'une étape manuelle dans l'UI GitHub après le
premier push, fragile et non versionné) ; Docker Hub (écarté par décision
utilisateur en amont).

## 4. Génération et gestion des secrets

**Decision**: Secrets générés une fois via `openssl rand -base64 32`
(mot de passe Postgres, clé de signature JWT, mot de passe root MinIO),
créés directement dans le cluster via `kubectl create secret generic`
(commande impérative, jamais écrite dans un fichier suivi par Git). Les
valeurs générées sont communiquées à l'utilisateur pour conservation dans
son gestionnaire de mots de passe personnel.

**Rationale**: Cohérent avec la Constitution (IV) : secrets jamais commités.
Une commande impérative évite tout fichier YAML en clair sur disque, même
temporairement.

**Alternatives considered**: Sealed Secrets / SOPS (rejeté : complexité et
dépendance supplémentaire injustifiée pour un secret créé une seule fois
sur un seul cluster — pas de GitOps multi-environnement ici) ; External
Secrets Operator (rejeté : nécessite un coffre-fort externe, hors scope).

## 5. Health checks Kubernetes

**Decision**: Réutiliser l'endpoint `/health` existant de l'API (déjà utilisé
par le healthcheck Docker Compose) comme `readinessProbe`/`livenessProbe`
HTTP du Deployment API. Pour le frontend (fichiers statiques), une probe
HTTP GET sur `/` (200 attendu) suffit.

**Rationale**: Zéro nouveau code applicatif requis ; l'endpoint existe déjà
et est déjà validé en usage (docker-compose).

**Alternatives considered**: Probe TCP simple (rejeté : moins précis,
`/health` vérifie déjà la connectivité DB via EF Core selon l'implémentation
existante).

## 6. Ingress + TLS

**Decision**: Ressource `Ingress` standard (`networking.k8s.io/v1`, classe
`traefik`, fournie par défaut par k3s) avec annotation
`cert-manager.io/cluster-issuer: letsencrypt-prod` et bloc `tls` par host.
Un unique `ClusterIssuer` cert-manager utilisant le challenge **HTTP-01**
(pas besoin d'API DNS OVH, le port 80 du VPS suffit puisque le DNS pointe
déjà dessus).

**Rationale**: `Ingress` standard reste portable et lisible, plutôt que la
CRD `IngressRoute` propre à Traefik — pas de gain fonctionnel ici pour
justifier de sortir du standard Kubernetes. HTTP-01 évite d'avoir à
provisionner des identifiants API OVH dans le cluster pour un challenge
DNS-01, alors que HTTP-01 fonctionne directement dès que le DNS résout
vers le VPS (déjà en cours de configuration par l'utilisateur).

**Alternatives considered**: `IngressRoute` Traefik (rejeté : verrouille au
controller Traefik sans bénéfice concret) ; challenge DNS-01 (rejeté :
nécessiterait des identifiants API OVH supplémentaires dans le cluster,
complexité non justifiée quand HTTP-01 suffit).

## 7. Service du frontend en production

**Decision**: `frontend/Dockerfile.prod` multi-stage : étape 1 `node:24-alpine`
exécute `npm run build` (déjà utilisé et validé en local, cf.
`frontend/package.json`) ; étape 2 `nginx:alpine` sert le dossier `dist/`
avec une config minimale (fallback SPA vers `index.html`, gzip). L'URL de
l'API (`VITE_API_URL=https://api.skillforge.mbadet.fr`) est injectée comme
argument de build (`ARG`/`ENV` Vite), donc figée à l'image — un changement
d'URL d'API nécessite un rebuild (cohérent avec le fonctionnement actuel de
Vite, déjà en place en local).

**Rationale**: `nginx:alpine` est le choix le plus léger et le plus standard
pour servir des fichiers statiques (quelques Mo de RAM), largement plus
sobre qu'un serveur Node (`serve`, `vite preview`) qui garderait un
processus Node inutilement actif en prod.

**Alternatives considered**: `vite preview` en prod (rejeté : outil de
prévisualisation dev, non conçu/optimisé pour la production) ; Caddy
(rejeté : nginx suffit amplement pour du statique pur, pas de besoin de
reverse-proxy applicatif côté frontend puisque l'API est sur son propre
sous-domaine).

## 8. Pipeline CI/CD et stratégie de rollout

**Decision**: Workflow GitHub Actions déclenché sur push `main` : (1) build
+ push des deux images vers `ghcr.io/matteobadet/skillforge-api` et
`ghcr.io/matteobadet/skillforge-frontend`, taguées à la fois `latest` et
`sha-<court-sha-commit>` ; (2) connexion SSH au VPS (clé privée en secret
GitHub Actions) pour exécuter `kubectl set image` sur les Deployments
concernés avec le tag `sha-<court-sha-commit>`, puis `kubectl rollout status`
pour attendre la bascule complète (échoue le workflow si le rollout échoue,
sans jamais couper le pod précédent qui fonctionne — comportement natif du
rolling update Kubernetes).

**Rationale**: Un tag par commit (plutôt que `latest` seul) rend chaque
déploiement traçable et permet un rollback trivial (`kubectl rollout undo`
ou re-`set image` vers un SHA antérieur). `kubectl set image` + rollout
status est la méthode la plus simple et la plus « boring » pour ce volume —
Kustomize sert à l'assemblage initial des manifests, `kubectl set image`
suffit pour les mises à jour d'image en routine sans réappliquer tout
`kustomize build` à chaque déploiement.

**Alternatives considered**: ArgoCD/Flux (GitOps complet, rejeté :
complexité et empreinte mémoire disproportionnées pour un cluster
mono-nœud à 3.7 Go de RAM et une seule personne qui déploie) ; Helm
(rejeté : les manifests sont peu nombreux et ne varient pas assez pour
justifier un système de templating supplémentaire — Kustomize suffit).

## 9. Dimensionnement mémoire (contrainte 3.7 Go RAM)

**Decision**: `resources.requests`/`limits` explicites et sobres sur chaque
composant applicatif :

| Composant | Request mem | Limit mem |
|---|---|---|
| PostgreSQL | 128Mi | 384Mi |
| MinIO | 128Mi | 256Mi |
| API (.NET) | 150Mi | 350Mi |
| Frontend (nginx) | 16Mi | 64Mi |

**Rationale**: k3s + Traefik + cert-manager consomment typiquement
400-600 Mi à eux seuls sur un nœud au repos. Avec ~1.05 Go de limites
applicatives cumulées, le total reste confortablement sous les 3.7 Go
disponibles même en pic, laissant de la marge pour le cache disque et les
pics ponctuels (ex. upload de fichier). Les valeurs sont des points de
départ à ajuster après observation réelle (`kubectl top pods`), pas des
constantes gravées dans le marbre.

**Alternatives considered**: Pas de limites (rejeté : un seul composant en
fuite mémoire pourrait faire tomber tout le nœud, y compris k3s lui-même —
inacceptable sur un nœud unique sans marge).
