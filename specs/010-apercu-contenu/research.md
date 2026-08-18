# Phase 0 Research: Aperçu du contenu d'une ressource

## 1. Lecture de l'archive depuis MinIO

**Decision**: Télécharger l'archive complète en mémoire (`MemoryStream`) via
le client MinIO interne existant (`ObjectStorageService`/`IMinioClient`
keyed `"internal"`), l'ouvrir avec `System.IO.Compression.ZipArchive`,
extraire uniquement l'entrée candidate, puis libérer le flux immédiatement
(`using`/`await using` stricts).

**Rationale**: `ZipArchive` a besoin de lire le répertoire central du zip
(situé en fin de fichier) pour connaître ses entrées ; une lecture par
plage HTTP (range request) partielle nécessiterait de réimplémenter cette
logique à la main ou d'ajouter une dépendance dédiée au "seekable remote
zip", complexité disproportionnée pour des archives plafonnées à 50 Mo
(limite déjà existante, feature 003) et un usage peu fréquent (une requête
par ouverture de page ressource, pas une boucle chaude).

**Alternatives considered**: Lecture par plage HTTP partielle du zip
(rejeté : complexité élevée pour un gain marginal à cette échelle) ; mise
en cache de l'aperçu extrait (rejeté par YAGNI — l'extraction en mémoire
d'une seule entrée texte est déjà rapide, cf. #6 ci-dessous ; une mise en
cache pourra être ajoutée plus tard si un besoin réel apparaît).

## 2. Sélection du fichier candidat

**Decision**: Parcourir les entrées de premier niveau de l'archive
(`entry.FullName` sans `/`), comparer en ignorant la casse à `SKILL.md`
puis `README.md` ; retourner la première correspondance selon cet ordre de
priorité. Aucune recherche récursive dans des sous-dossiers.

**Rationale**: Cohérent avec les Assumptions du spec — `SKILL.md` est la
convention la plus spécifique au cas d'usage principal de l'app (Skills
Claude), affichée en priorité si les deux existent ; se limiter à la racine
évite l'ambiguïté de plusieurs fichiers candidats dans des sous-dossiers
différents.

**Alternatives considered**: Recherche récursive dans toute l'archive
(rejeté : ambiguïté si plusieurs README.md dans des sous-dossiers,
complexité non justifiée par le spec).

## 3. Rendu Markdown côté frontend

**Decision**: `react-markdown` (parseur Markdown → arbre JSX, pas de chaîne
HTML intermédiaire) avec le plugin `rehype-sanitize` (liste blanche de
balises/attributs autorisés, retire tout `<script>`, gestionnaire d'événement
inline, ou balise active).

**Rationale**: `react-markdown` ne passe jamais par
`dangerouslySetInnerHTML` en usage par défaut — il construit directement des
éléments React à partir de l'arbre Markdown, ce qui élimine par
construction la classe de bugs "j'ai oublié d'assainir avant d'injecter".
`rehype-sanitize` est le plugin standard de l'écosystème `unified`/`rehype`
pour ce besoin exact (FR-008). C'est un ajout frontend pur : aucun impact
sur les ressources serveur du VPS de production (rendu 100% navigateur).

**Alternatives considered**: `marked` + `DOMPurify` + `dangerouslySetInnerHTML`
(rejeté : fonctionnellement équivalent mais réintroduit une étape manuelle
d'assainissement avant injection HTML brute — plus de surface d'erreur pour
un gain nul) ; rendu texte brut monospace (rejeté par le spec, FR-002 exige
une mise en forme lisible).

## 4. Format de réponse de l'endpoint

**Decision**: `GET /api/resources/{id}/preview` retourne toujours `200 OK`
avec `{ available: bool, fileName: string | null, content: string | null,
truncated: bool }`. L'absence de fichier candidat, une archive corrompue,
ou une entrée illisible sont tous mappés vers `available: false` — jamais
une erreur HTTP.

**Rationale**: Le spec (FR-003) traite l'absence d'aperçu comme un état
normal du domaine, pas une erreur — un `404`/`500` forcerait le frontend à
distinguer artificiellement "erreur réseau" de "pas d'aperçu", pour un état
qui doit visuellement être traité de la même façon dans les deux cas
(message clair, page qui continue de fonctionner). Les erreurs de
permission (ressource privée non visible) restent gérées par le `404`
existant de `GetVisibleResourceAsync` (comportement identique à `GetById`).

**Alternatives considered**: `404` dédié type `preview_not_found` (rejeté :
oblige le frontend à traiter un cas métier normal comme une erreur réseau à
intercepter).

## 5. Troncature

**Decision**: Limite de 100 000 caractères sur le contenu texte décodé
(UTF-8), tronqué proprement à cette limite avec `truncated: true` si la
taille réelle du fichier dépasse ce seuil.

**Rationale**: Reste dans l'esprit "frugal" du VPS (research.md #9 de la
feature 009) sans complexifier avec une troncature "intelligente" (par
ligne/section Markdown) — une coupure brute à 100k caractères, avec un
indicateur visuel côté frontend, suffit pour l'usage (aperçu, pas lecture
intégrale).

**Alternatives considered**: Troncature par ligne/paragraphe Markdown
(rejeté : complexité inutile pour un cas rare — la plupart des
README/SKILL.md réels font quelques Ko, pas 100 Ko).

## 6. Tests d'extraction (backend)

**Decision**: Construire des archives zip en mémoire dans les tests xUnit
via `System.IO.Compression.ZipArchive` en mode `Create` (pas de fixtures
binaires versionnées), pour couvrir : présence de `SKILL.md` seul, des
deux fichiers (priorité), aucun fichier candidat, fichier dans un
sous-dossier (doit être ignoré), contenu dépassant la limite de troncature.

**Rationale**: Cohérent avec le style de test déjà en place dans le projet
(pas de fixtures binaires dans le dépôt) ; couvre directement les règles de
FR-003/FR-005/FR-006 sans dépendre de MinIO dans les tests unitaires (le
service d'extraction prend un `Stream` en entrée, testable indépendamment
du stockage).
