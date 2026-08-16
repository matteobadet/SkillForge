# Quickstart: Déploiement production sur VPS via Kubernetes

## Prérequis

- Accès SSH au VPS (`ubuntu@152.228.239.129`), sudo sans mot de passe.
- DNS `skillforge.mbadet.fr` et `api.skillforge.mbadet.fr` résolvant vers
  `152.228.239.129` (vérifier : `dig +short skillforge.mbadet.fr`).
- Un Personal Access Token GitHub (classic, scope `read:packages`) pour le
  pull GHCR.
- `kubectl` configuré en local pour pointer vers le kubeconfig du VPS
  (récupéré via `ssh ubuntu@152.228.239.129 sudo cat /etc/rancher/k3s/k3s.yaml`,
  avec le `server:` réécrit vers l'IP publique).

## 1. Provisionner k3s (une fois)

```bash
ssh ubuntu@152.228.239.129 'curl -sfL https://get.k3s.io | sh -'
ssh ubuntu@152.228.239.129 'sudo k3s kubectl get nodes'
# Attendu : un nœud en état "Ready"
```

## 2. Installer cert-manager (une fois)

```bash
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/latest/download/cert-manager.yaml
kubectl -n cert-manager rollout status deployment/cert-manager
```

## 3. Créer les secrets (une fois, jamais commités)

```bash
kubectl create namespace skillforge
kubectl -n skillforge create secret generic skillforge-postgres \
  --from-literal=POSTGRES_USER=skillforge \
  --from-literal=POSTGRES_PASSWORD="$(openssl rand -base64 32)" \
  --from-literal=POSTGRES_DB=skillforge
kubectl -n skillforge create secret generic skillforge-minio \
  --from-literal=MINIO_ROOT_USER=skillforge \
  --from-literal=MINIO_ROOT_PASSWORD="$(openssl rand -base64 32)"
kubectl -n skillforge create secret generic skillforge-api \
  --from-literal=JWT_SIGNING_KEY="$(openssl rand -base64 48)"
kubectl -n skillforge create secret docker-registry ghcr-pull-secret \
  --docker-server=ghcr.io --docker-username=<user> --docker-password=<PAT>
```

## 4. Appliquer les manifests

```bash
kubectl apply -k k8s/
kubectl -n skillforge get pods -w
# Attendu : postgres, minio, api, frontend tous "Running" et "1/1 Ready"
```

## 5. Valider bout-en-bout

```bash
curl -sSf https://api.skillforge.mbadet.fr/health
# Attendu : 200

curl -sSfI https://skillforge.mbadet.fr | head -1
# Attendu : HTTP/2 200
```

Puis dans un navigateur : ouvrir `https://skillforge.mbadet.fr`, se
connecter avec un compte existant (ou en créer un), publier une ressource
de test, vérifier son téléchargement — reproduit le parcours de
`specs/001-socle-auth-bdd/quickstart.md` mais contre l'URL de production.

## 6. Valider la résilience (US3)

```bash
ssh ubuntu@152.228.239.129 'sudo reboot'
# Attendre ~2 min, puis :
kubectl -n skillforge get pods
# Attendu : tous les pods reviennent "Running" sans intervention manuelle,
# et la ressource de test créée à l'étape 5 est toujours visible dans l'app.
```

**Résultat observé (validation réelle du 2026-08-16)** : SSH de nouveau
joignable ~9s après le reboot ; les 4 pods (postgres, minio, api, frontend)
reviennent tous `1/1 Running` ~26s après (même noms de pod, pas de
recréation — k3s redémarre via son service systemd et rattache les PVC
existants) ; total <1 min entre `sudo reboot` et un cluster pleinement
fonctionnel, très en-deçà de la cible SC-002 (< 5 min). Aucune donnée
perdue (ressource de test, compte, équipe tous intacts). Aucune limite
particulière constatée avec `local-path` sur ce VPS.

## 7. Valider le pipeline CI/CD (US2)

Pousser un commit trivial sur `main`, observer le workflow dans l'onglet
Actions du repo GitHub, puis :

```bash
kubectl -n skillforge get pods -o jsonpath='{.items[*].spec.containers[*].image}'
# Attendu : les images référencent le nouveau tag sha-<commit> après la fin du workflow
```
