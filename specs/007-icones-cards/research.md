# Phase 0 Research: Icônes équipes/ressources et affichage en cards

Aucune ambiguïté produit bloquante (demande utilisateur précise, avec
exemple concret). Décisions techniques ci-dessous.

## 1. Palette d'icônes

- **Decision**: liste fixe d'environ 20 icônes `lucide-react`, choisies
  pour couvrir des thèmes pertinents (outils/dev/IA) : `Bot`, `Terminal`,
  `Cpu`, `Zap`, `Code2`, `Puzzle`, `Rocket`, `Wrench`, `Database`, `Globe`,
  `Shield`, `Sparkles`, `Package`, `Boxes`, `FlaskConical`, `Brain`,
  `Gamepad2`, `Palette`, `Music`, `Wand2`. Identifiant stocké en base =
  nom du composant (`"Bot"`, `"Terminal"`, ...).
- **Rationale**: cohérence visuelle totale avec le reste de l'UI (nav,
  boutons, badges déjà en `lucide-react` depuis la feature 006), zéro
  nouvelle dépendance, rendu identique sur toutes les plateformes
  (contrairement aux émojis, dont l'apparence varie par OS/navigateur).
- **Alternatives considered**: émojis (`🤖`, `⚡`, ...) — rejeté, rendu
  visuel incohérent avec le reste de l'interface et non garanti identique
  entre systèmes d'exploitation.

## 2. Exclusivité preset/upload

- **Decision**: au niveau service (`TeamService`/`ResourceService`), toute
  opération qui définit `IconPreset` met explicitement `IconObjectKey` à
  `null` (et supprime l'ancien objet MinIO s'il y en avait un), et
  inversement toute opération d'upload met `IconPreset` à `null`. Pas de
  contrainte SQL (ex. `CHECK`) pour cette règle — la logique applicative
  suffit et reste plus simple à faire évoluer.
- **Rationale**: garantit FR-003/SC-002 sans complexifier le schéma ;
  cohérent avec la manière dont les autres remplacements (avatar, archive
  de ressource) suppriment déjà l'ancien objet MinIO lors d'un remplacement
  (features 001/003).
- **Alternatives considered**: contrainte SQL `CHECK (icon_preset IS NULL
  OR icon_object_key IS NULL)` — envisagée mais jugée redondante avec la
  vérification déjà faite en code service à chaque écriture ; ajoutée
  seulement si un bug de régression futur le justifiait (YAGNI).

## 3. Bucket MinIO dédié `icons`

- **Decision**: nouveau bucket `icons` (variable `MINIO_BUCKET_ICONS`),
  séparé de `avatars` et `resources`, créé automatiquement au démarrage
  (même mécanisme que les buckets existants).
- **Rationale**: cohérent avec la séparation par nature de contenu déjà
  actée en feature 003 (research.md #2) — les icônes d'équipe/ressource
  ont un cycle de vie et une nature distincts des avatars utilisateur
  (feature 001) et des archives (feature 003).

## 4. Intégration au formulaire existant

- **Decision**: le composant `IconPicker` est intégré directement dans
  `CreateTeamPage`/`PublishResourcePage` (choix à la création) et dans les
  sections "Gestion" de `TeamPage`/`ResourcePage` (modification a
  posteriori). Pour la création : le choix de palette est envoyé comme
  champ `iconPreset` dans la requête de création existante (JSON pour
  l'équipe, `multipart/form-data` déjà utilisé pour la ressource) ; un
  upload de fichier au moment de la création utilise le nouvel endpoint
  dédié `POST .../icon` juste après la création (la ressource/l'équipe
  doit exister pour avoir un `id`).
- **Rationale**: réutilise les endpoints de création existants pour le cas
  palette (le plus simple, majoritaire) sans les complexifier avec un
  upload de fichier optionnel ; l'upload passe par un endpoint dédié déjà
  nécessaire de toute façon pour la modification a posteriori (US1
  Acceptance Scenario 3).
- **Alternatives considered**: tout gérer dans l'endpoint de création
  (accepter à la fois `iconPreset` et un fichier optionnel) — rejeté,
  duplique la logique d'upload entre création et modification pour un
  gain d'UX marginal (un aller-retour réseau de plus lors de la création
  avec upload n'est pas perceptible).

## 5. Cards CSS

- **Decision**: grille CSS (`display: grid; grid-template-columns:
  repeat(auto-fill, minmax(220px, 1fr))`) avec des cards carrées/
  rectangulaires affichant l'icône (cercle coloré `--accent-bg` avec
  l'icône en `--accent`, ou image uploadée en `object-fit: cover`), le nom,
  et les métadonnées secondaires — remplace les classes `.list`/
  `.list-item` sur les trois vues concernées (Store, annuaire équipes,
  ressources d'une équipe). Les classes `.list`/`.list-item` restent
  utilisées ailleurs (ex. liste des membres d'une équipe), non concernées
  par cette feature.
- **Rationale**: `auto-fill`/`minmax` s'adapte à la largeur disponible sans
  media query supplémentaire, cohérent avec l'absence d'optimisation
  mobile poussée déjà actée en feature 006.

**Output**: aucune inconnue technique ne subsiste.
