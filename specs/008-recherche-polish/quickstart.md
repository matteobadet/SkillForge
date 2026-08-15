# Quickstart: Recherche/filtres et corrections de champs

## User Story 1/2 — Style des champs

1. Consulter `/teams/new`, `/profile`, `/teams/:id` (Modifier l'équipe) :
   les champs "Nom"/"Pseudo" doivent avoir bordure/fond/rayon identiques
   aux champs email/mot de passe de `/login`.
2. Consulter `/profile` et `/teams/:teamId/resources/new` : le contrôle
   d'upload de fichier doit ressembler au sélecteur d'icône (icône +
   texte cliquable), pas au bouton natif du navigateur.

## User Story 3 — Recherche/filtre Store

1. Publier au moins 2 ressources de types différents (Skill, MCP).
2. Sur `/store`, taper un terme correspondant au nom d'une seule
   ressource → seule celle-ci reste affichée.
3. Sélectionner le filtre "MCP" → seules les ressources de type MCP
   restent affichées.
4. Combiner recherche + filtre → intersection des deux critères.
5. Taper un terme sans correspondance → message "Aucun résultat" (distinct
   du message "Aucune ressource" à vide).

## User Story 4 — Recherche annuaire équipes

1. Sur `/teams`, taper un terme correspondant au nom d'une seule équipe →
   seule celle-ci reste affichée, dans "Mes équipes" et "Équipes
   publiques".

## Non-régression automatisée

```bash
cd frontend && npm run test   # inclut désormais lib/filter.test.ts
cd frontend && npm run build
```
