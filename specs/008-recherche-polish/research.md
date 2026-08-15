# Phase 0 Research: Recherche/filtres et corrections de champs

## 1. Cause du bug de style des champs de texte

- **Root cause identifiée** : `frontend/src/index.css` cible les champs via
  des sélecteurs d'attribut exacts (`input[type='text']`,
  `input[type='email']`, `input[type='password']`). Un `<input>` JSX sans
  attribut `type` explicite a pour état HTML implicite "text", mais le
  sélecteur CSS `[type='text']` ne matche PAS un élément où l'attribut est
  absent — seulement un élément où l'attribut est littéralement présent
  avec cette valeur. 5 champs du code (noms d'équipe/ressource, pseudo)
  n'ont pas cet attribut explicite, d'où leur rendu natif non stylé.
- **Decision**: élargir le sélecteur CSS pour couvrir tout `<input>` texte
  par exclusion des types qui doivent garder un comportement natif
  (`checkbox`, `radio`, `file`, `range`) plutôt que par inclusion
  exhaustive des types textuels :
  `input:not([type='checkbox']):not([type='radio']):not([type='file']):not([type='range'])`.
- **Rationale**: robuste par construction — un futur champ ajouté sans
  `type` explicite reste stylé automatiquement, plutôt que de dépendre de
  la discipline de toujours penser à ajouter `type="text"` dans le JSX.
- **Alternatives considered**: ajouter `type="text"` explicite sur les 5
  champs concernés sans toucher au CSS — fait en complément (bonne
  pratique HTML/accessibilité), mais insuffisant seul : ne corrige pas la
  fragilité du sélecteur pour d'éventuels futurs champs.

## 2. Composant `FileInput` partagé

- **Decision**: extraire le motif déjà présent dans `IconPicker.tsx`
  (input `type="file"` cachée via `style={{display:"none"}}`, déclenchée
  par un `<label>` stylé avec icône) en un composant `FileInput.tsx`
  réutilisable, paramétré par `accept`, le texte affiché, et le handler de
  changement.
- **Rationale**: le motif est sur le point d'apparaître une troisième fois
  (avatar, archive de ressource) — l'extraire évite une divergence de
  présentation entre les trois usages et centralise un futur ajustement.

## 3. Recherche/filtre côté client

- **Decision**: fonctions pures dans `frontend/src/lib/filter.ts` :
  `filterResources(resources, { query, type })` et
  `filterTeams(teams, { query })`, appliquées en mémoire sur les tableaux
  déjà chargés par `StorePage`/`TeamsDirectoryPage` (état local `query`/
  `type` mis à jour à chaque frappe, pas de nouvel appel réseau).
- **Rationale**: cohérent avec l'échelle du projet (dizaines d'éléments,
  pas de pagination serveur nécessaire) ; fonctions pures testables sans
  monter de composant React.
- **Alternatives considered**: recherche côté serveur (nouveau paramètre
  de requête sur `GET /api/resources`/`GET /api/teams`) — rejetée pour ce
  volume de données, ajouterait de la complexité (debounce, état de
  chargement supplémentaire) sans bénéfice perceptible à cette échelle.

**Output**: aucune inconnue technique ne subsiste.
