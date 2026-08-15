# Phase 0 Research: Passe de style UI

Aucune ambiguïté produit bloquante (feature de présentation pure, décisions
de goût visuel sans conséquence sur les données/l'API — cf. plan.md,
principe III). Décisions techniques ci-dessous.

## 1. Bibliothèque d'icônes

- **Decision**: `lucide-react`.
- **Rationale**: réponse directe à l'exigence du brief ("menu moderne avec
  icônes") ; bibliothèque SVG tree-shakeable (seules les icônes importées
  sont incluses au build), API simple (`<Store size={18} />`), pas de
  dépendance à un CSS externe (contrairement à Font Awesome).
- **Alternatives considered**: icônes SVG écrites à la main (zéro
  dépendance) — rejeté, plus de code à maintenir pour un gain marginal vu
  la faible taille de `lucide-react` une fois tree-shaké ; `react-icons`
  — fonctionnellement équivalent mais bundle plus lourd (regroupe
  plusieurs familles d'icônes).

## 2. Architecture CSS

- **Decision**: variables CSS (`:root { --color-*, --space-*, --radius-*,
  ... }`) dans `index.css`, plus des classes utilitaires/composants
  nommées par intention (`.btn`, `.btn-primary`, `.btn-danger`, `.card`,
  `.field`, `.alert`, `.alert-error`, `.nav`, `.nav-link`) appliquées
  directement dans le JSX de chaque page. Suppression de `App.css`
  (contenu par défaut du template Vite, non utilisé une fois le design
  system en place).
- **Rationale**: pas de build-step supplémentaire (contrairement à
  Tailwind/Sass), cohérent avec la stack existante (Vite + CSS natif déjà
  en place depuis la feature 001) ; les variables centralisent la palette/
  les espacements pour une cohérence garantie sans dupliquer des valeurs
  magiques par page (répond à SC-001).
- **Alternatives considered**: CSS Modules par page — rejeté, plus de
  fichiers pour un bénéfice (scoping) non nécessaire ici (pas de collision
  de noms de classes attendue à cette échelle) ; styled-components/
  CSS-in-JS — rejeté, nouvelle dépendance de runtime pour un besoin que le
  CSS natif couvre déjà.

## 3. Palette et identité visuelle

- **Decision**: thème clair, une couleur d'accent (indigo/violet, `#5b5bd6`
  approx.) pour les actions primaires et les éléments actifs de nav, gris
  neutres pour le texte/fond/bordures, rouge pour les actions destructives
  et messages d'erreur, vert pour les messages de succès.
- **Rationale**: palette simple à 4-5 couleurs, facile à maintenir via
  variables CSS, lisible et cohérente avec l'identité "Forge/Skill" du nom
  du projet sans nécessiter d'actifs graphiques (logo, illustrations) hors
  périmètre de cette feature.

## 4. Navigation

- **Decision**: composant `Layout.tsx` avec une barre de navigation
  supérieure fixe (nom du projet + liens Store/Équipes/Profil avec icônes
  + bouton Déconnexion), enveloppant toutes les pages authentifiées via
  `App.tsx`. Les pages `Login`/`Signup` restent en dehors de `Layout`
  (cf. spec.md FR-004).
- **Rationale**: une barre supérieure est plus simple à rendre correctement
  responsive qu'une barre latérale rétractable, pour un gain visuel
  équivalent à cette échelle (peu de liens de navigation : 3).
- **Alternatives considered**: barre latérale (sidebar) — rejetée, plus
  complexe à gérer sur petit écran pour un nombre de liens trop faible
  pour en justifier le coût.

**Output**: aucune inconnue technique ne subsiste.
