# Quickstart: Suivi de l'espace de stockage MinIO (admin)

## Prérequis

- Stack locale démarrée : `docker compose up -d` (API, PostgreSQL, MinIO).
- Un compte avec le rôle `Admin` (cf. feature 005 — modération admin, pour promouvoir un compte).
- Un compte `Utilisateur` standard, pour vérifier le refus d'accès.

## Scénario 1 — Un admin voit le total et la répartition (US1, US2)

1. Se connecter avec le compte Admin.
2. Naviguer vers `/admin/storage` (lien visible dans la nav, réservé aux admins).
3. Vérifier qu'un total en Mo/Go s'affiche, avec la répartition par bucket (`resources`, `icons`, `avatars`), chacun avec son nombre d'objets et sa taille.
4. Publier une nouvelle ressource avec une archive notable (ex. 5 Mo) depuis un autre onglet.
5. Revenir sur `/admin/storage`, cliquer sur le bouton de rafraîchissement.
6. Vérifier que le total et la catégorie « Archives de ressources » ont augmenté d'environ 5 Mo (SC-003).

## Scénario 2 — Un compte non-Admin n'y a pas accès (FR-001, SC-002)

1. Se connecter avec le compte `Utilisateur` standard.
2. Vérifier que le lien vers `/admin/storage` n'apparaît pas dans la navigation.
3. Naviguer directement vers `/admin/storage` en tapant l'URL.
4. Vérifier que l'accès est refusé (redirection ou message d'erreur clair, pas de fuite de données de stockage).
5. Appeler directement `GET /api/admin/storage` avec le token de ce compte (ex. via `curl`) et vérifier une réponse `403`.

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Authorization: Bearer <jwt-utilisateur-standard>" \
  http://localhost:5000/api/admin/storage
# Attendu : 403
```

## Scénario 3 — Catégorie vide affichée sans erreur (US2 scénario 2)

1. Sur une instance fraîche sans avatar uploadé, consulter `/admin/storage` en tant qu'Admin.
2. Vérifier que la catégorie « Avatars » apparaît avec `0 objet` / `0 Mo`, pas absente de la liste ni en erreur.

## Validation de non-régression

- `dotnet test` (backend) — les tests existants (41 avant cette feature) doivent continuer à passer, plus les nouveaux tests couvrant `AdminController` (403 pour non-admin, 200 avec la forme attendue pour un admin) et le service de calcul de l'usage de stockage (somme correcte, bucket vide → zéro, propagation d'une erreur MinIO en 503).
