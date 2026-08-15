# Quickstart: Passe de style UI

Prérequis : stack démarrée (`docker compose up`, avec le frontend
reconstruit après cette feature : `docker compose up --build -d frontend`).

## User Story 1 — Navigation avec icônes

1. Se connecter (`/login`).
2. Vérifier que le menu supérieur affiche des icônes + libellés pour
   Store, Équipes, Profil, et une action Déconnexion.
3. Cliquer chaque lien, vérifier la navigation et que le lien actif est
   visuellement distingué.

## User Story 2 — Cohérence visuelle

Parcourir dans l'ordre, sans régression fonctionnelle par rapport aux
features 001-005 :

1. `/signup` → créer un compte.
2. `/store` → vue vide puis peuplée après publication.
3. `/teams` → créer une équipe, `/teams/:id` → inviter, gérer les membres.
4. `/teams/:id/resources/new` → publier une ressource ; `/resources/:id`
   → télécharger, upvoter, modifier, supprimer.
5. `/profile` → modifier pseudo, uploader un avatar.
6. Avec un compte Admin (cf. feature 001/005 quickstart) : vérifier le
   bouton de suppression modération sur une ressource tierce.

Sur chaque page : mêmes couleurs/boutons/espacements, aucune trace de HTML
non stylé.

## Non-régression automatisée

```bash
cd backend && dotnet test    # inchangé, doit rester au vert
cd frontend && npm run test  # inchangé, doit rester au vert
cd frontend && npm run build # doit compiler sans erreur TypeScript
```
