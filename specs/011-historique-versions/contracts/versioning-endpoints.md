# Contract: Endpoints d'historique de versions

## `GET /api/resources/{id}/versions`

Authentification et visibilité identiques à `GET /api/resources/{id}` —
`404` si la ressource n'existe pas ou n'est pas visible par l'appelant
(équipe privée, non membre).

**Réponse `200 OK`** — liste triée par `versionNumber` décroissant (la
plus récente en premier) :

```json
[
  { "versionNumber": 3, "note": "Corrige un bug de parsing", "createdAt": "...", "publisherPseudo": "ami1", "isCurrent": true },
  { "versionNumber": 2, "note": null, "createdAt": "...", "publisherPseudo": "ami1", "isCurrent": false },
  { "versionNumber": 1, "note": null, "createdAt": "...", "publisherPseudo": "ami1", "isCurrent": false }
]
```

Pour une ressource sans ligne `ResourceVersion` persistée (legacy, jamais
retouchée depuis cette feature) : liste synthétisée à un seul élément
(`versionNumber: 1`, `note: null`, `isCurrent: true`), jamais une liste
vide (cf. spec, User Story 1, AC3).

## `GET /api/resources/{id}/versions/{versionNumber}/download`

Même garde de visibilité. `404` également si `versionNumber` n'existe pas
pour cette ressource (y compris le cas legacy : seul `versionNumber=1` est
valide tant qu'aucune ligne réelle n'existe).

**Réponse `200 OK`** :

```json
{ "downloadUrl": "https://..." }
```

Même mécanisme que `GET /api/resources/{id}/download` existant (URL
présignée MinIO, 1h d'expiration) — pointant vers l'`ObjectKey` de la
version demandée, pas nécessairement la version actuelle.

## `PATCH /api/resources/{id}` (existant, étendu)

Nouveau champ de formulaire optionnel `note` (string, max 300 caractères),
pris en compte uniquement si un nouveau `file` est fourni dans la même
requête (une note sans nouvelle archive n'a pas de version à laquelle
s'attacher — silencieusement ignorée dans ce cas, pas une erreur).

**Changement de comportement** : ne supprime plus l'`ObjectKey` précédent
de MinIO — il devient une version historique. Réponse inchangée
(`ResourceDetailDto`).
