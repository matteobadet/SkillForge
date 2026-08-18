# Contract: `GET /api/resources/{id}/preview`

## Authentification & visibilité

Identique à `GET /api/resources/{id}` : nécessite un JWT valide ; la
ressource DOIT passer par `ResourceService.GetVisibleResourceAsync(id,
userId, isAdmin)` — une ressource d'équipe privée dont l'appelant n'est pas
membre retourne `404 Not Found`, exactement comme l'endpoint de détail
existant (aucune fuite d'information sur l'existence de la ressource).

## Réponse succès — `200 OK`

```json
{
  "available": true,
  "fileName": "SKILL.md",
  "content": "# Mon Skill\n\nDescription...",
  "truncated": false
}
```

Cas "aucun aperçu disponible" (archive sans fichier candidat, archive
corrompue, ou entrée illisible) — reste un `200 OK`, jamais une erreur :

```json
{
  "available": false,
  "fileName": null,
  "content": null,
  "truncated": false
}
```

## Réponses d'erreur

| Code | Cas |
|---|---|
| `401` | Non authentifié |
| `404` | Ressource inexistante, ou existante mais non visible par l'appelant (équipe privée, non membre) |

## Comportement attendu du frontend

- Pendant le chargement : état "en cours" discret (pas de saut de mise en
  page une fois le contenu arrivé).
- `available: false` : message clair ("Aucun aperçu disponible pour cette
  ressource."), pas une erreur visuelle.
- `truncated: true` : le contenu affiché est complet jusqu'à la limite,
  avec une indication ("Aperçu tronqué — téléchargez l'archive pour le
  contenu complet.").
- Échec réseau/HTTP (401/404/5xx) : traité comme `available: false` côté
  UI — un aperçu manquant ne doit jamais faire échouer l'affichage du reste
  de la page ressource (cohérent avec l'edge case du spec : "archive
  corrompue... sans faire échouer le chargement du reste de la page").
