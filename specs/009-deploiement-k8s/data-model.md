# Phase 1 Data Model: Déploiement production sur VPS via Kubernetes

Pas de modèle de données applicatif nouveau (aucune table, aucune entité
métier n'est ajoutée par cette feature). Le "modèle" ici est l'ensemble des
ressources Kubernetes et leur schéma de configuration.

## Namespace

- `skillforge` — regroupe toutes les ressources de cette feature, isolé du
  namespace `kube-system`/`cert-manager`.

## Secrets (créés impérativement, jamais dans un manifest versionné)

| Secret | Clés | Consommé par |
|---|---|---|
| `skillforge-postgres` | `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Deployment `postgres`, Deployment `api` |
| `skillforge-minio` | `MINIO_ROOT_USER`, `MINIO_ROOT_PASSWORD` | Deployment `minio`, Deployment `api` |
| `skillforge-api` | `JWT_SIGNING_KEY` | Deployment `api` |
| `ghcr-pull-secret` | `.dockerconfigjson` (token GHCR `read:packages`) | Deployments `api`, `frontend` (imagePullSecrets) |

Un manifest `secrets.example.yaml` (non appliqué, valeurs `<GENERATE_ME>`)
est versionné à titre de documentation du schéma attendu — jamais les
vraies valeurs.

## PersistentVolumeClaims

| PVC | Taille | Monté par | Contenu |
|---|---|---|---|
| `postgres-data` | 2Gi | `postgres` | `PGDATA` |
| `minio-data` | 5Gi | `minio` | Buckets `avatars`, `resources`, `icons` |

Tailles initiales conservatrices (le disque du VPS fait 38 Go au total,
partagé avec les images de conteneurs et l'OS) ; `local-path` permet un
redimensionnement manuel ultérieur si besoin (recréation de PVC, pas
d'expansion à chaud — limite connue documentée, pas bloquante en v1).

## Deployments / Services (une réplique chacun)

| Deployment | Image | Port conteneur | Service (ClusterIP) | Probe |
|---|---|---|---|---|
| `postgres` | `postgres:16-alpine` | 5432 | `postgres:5432` | TCP |
| `minio` | `minio/minio:latest` | 9000 | `minio:9000` | HTTP `/minio/health/live` |
| `api` | `ghcr.io/matteobadet/skillforge-api:<tag>` | 8080 | `api:8080` | HTTP `/health` |
| `frontend` | `ghcr.io/matteobadet/skillforge-frontend:<tag>` | 80 | `frontend:80` | HTTP `/` |

`<tag>` = `sha-<court-sha-commit>`, mis à jour par le workflow CI/CD
(`kubectl set image`) — jamais `latest` en usage réel, pour garder chaque
déploiement traçable et permettre un rollback ciblé.

## Ingress

| Host | Backend | TLS |
|---|---|---|
| `skillforge.mbadet.fr` | Service `frontend:80` | `skillforge-tls` (cert-manager) |
| `api.skillforge.mbadet.fr` | Service `api:8080` | `api-skillforge-tls` (cert-manager) |

## ClusterIssuer (cert-manager)

- `letsencrypt-prod` — challenge HTTP-01 via la classe d'ingress `traefik`,
  compte Let's Encrypt enregistré avec un email de contact (utilisateur à
  fournir lors de l'implémentation).
