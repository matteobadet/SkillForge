# Contract: GET /api/admin/storage

**Contrôleur**: nouveau `AdminController` (`backend/SkillForge.Api/Controllers/AdminController.cs`), `[Authorize]` (authentification requise, comme tous les contrôleurs existants) + garde manuel `IsAdmin` en tête d'action (cf. research.md #2).

## Requête

```
GET /api/admin/storage
Authorization: Bearer <jwt>
```

Aucun paramètre.

## Réponses

### 200 OK — utilisateur Admin, mesure réussie

```json
{
  "totalBytes": 1073741824,
  "computedAt": "2026-08-18T14:32:00Z",
  "buckets": [
    { "bucket": "resources", "label": "Archives de ressources", "objectCount": 42, "totalBytes": 1000000000 },
    { "bucket": "icons", "label": "Icônes", "objectCount": 18, "totalBytes": 50000000 },
    { "bucket": "avatars", "label": "Avatars", "objectCount": 9, "totalBytes": 23741824 }
  ]
}
```

Un bucket sans aucun objet apparaît quand même dans `buckets`, avec `objectCount: 0` et `totalBytes: 0` (FR : pas d'absence silencieuse — cf. spec.md US2 scénario 2).

### 401 Unauthorized

Pas de JWT valide — comportement standard déjà en place pour tous les endpoints `[Authorize]` du projet.

### 403 Forbidden — utilisateur authentifié mais non Admin

```json
{ "message": "Accès réservé aux administrateurs." }
```

Couvre FR-001 et le scénario d'acceptation US1 #2.

### 503 Service Unavailable — le stockage ne peut pas être mesuré

```json
{ "message": "Impossible de mesurer l'espace de stockage pour le moment." }
```

Déclenché si l'appel MinIO échoue (service injoignable, erreur réseau) pour au moins un bucket — jamais un total partiel silencieusement présenté comme complet (FR-005). Choix de `503` plutôt que `500` : la défaillance vient d'une dépendance externe (MinIO), pas d'un bug applicatif.

## Notes de conception

- Endpoint synchrone, calculé à la demande à chaque appel (FR-004) — pas de mise en cache serveur au-delà de la durée d'une requête. Un éventuel ralentissement avec un grand nombre d'objets est acceptable (cf. spec.md Edge Cases, SC-004) : correction avant vitesse.
- Le frontend appelle cet endpoint au chargement de la page `/admin/storage` et propose un bouton de rafraîchissement manuel (pas de polling automatique) — cohérent avec le pattern déjà utilisé pour « Régénérer le lien » d'invitation (`TeamPage.tsx`).
