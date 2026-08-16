# Contract: Interface de déploiement

## Endpoints publics exposés

| URL | Rôle | Attendu |
|---|---|---|
| `https://skillforge.mbadet.fr` | Frontend SPA | 200, certificat TLS valide, sert `index.html` (fallback SPA sur toute route inconnue) |
| `https://api.skillforge.mbadet.fr/health` | Health check API | 200, utilisé par les probes Kubernetes et vérifiable manuellement |
| `https://api.skillforge.mbadet.fr/api/*` | API REST applicative | Comportement inchangé par rapport au local (mêmes contrats `contracts/*.md` des features 001-005) |

Le port 9000/9001 (MinIO S3 API / console) N'EST PAS exposé par l'Ingress —
uniquement accessible en interne au cluster (`ClusterIP`), conformément à
FR-010.

## Contrat image de conteneur (CI/CD → cluster)

- Nom d'image : `ghcr.io/matteobadet/skillforge-api` et
  `ghcr.io/matteobadet/skillforge-frontend`.
- Tags : `sha-<court-sha-commit>` (utilisé pour le déploiement réel) et
  `latest` (repère humain uniquement, jamais référencé par un manifest).
- Le workflow CI/CD DOIT échouer si le build ou le push échoue, et ne DOIT
  jamais appeler `kubectl set image` avec un tag dont le build a échoué.

## Contrat de déploiement (CI/CD → VPS)

- Connexion : SSH avec une clé dédiée (secret GitHub Actions
  `VPS_SSH_PRIVATE_KEY`), utilisateur `ubuntu`, hôte
  `152.228.239.129`.
- Commande exécutée à distance : `kubectl set image deployment/<api|frontend>
  <container>=ghcr.io/matteobadet/skillforge-<api|frontend>:sha-<sha>
  -n skillforge`, suivie de `kubectl rollout status deployment/<...>
  -n skillforge --timeout=120s`.
- Si `rollout status` échoue (timeout, CrashLoopBackOff), le workflow
  DOIT se terminer en échec et laisser le Deployment dans son état
  courant (Kubernetes ne bascule le trafic vers les nouveaux pods qu'une
  fois `Ready`, donc l'ancienne version continue de servir jusqu'à
  résolution manuelle — cf. spec, Edge Cases).

## Contrat de secrets attendu par les manifests

Les manifests de `k8s/` référencent les secrets par nom (cf.
`data-model.md`) sans jamais les définir en valeur — ils DOIVENT déjà
exister dans le namespace `skillforge` avant `kubectl apply -k k8s/`.
Un déploiement sur un cluster qui ne les a pas échoue explicitement
(`CreateContainerConfigError`), jamais silencieusement avec des valeurs
par défaut.
