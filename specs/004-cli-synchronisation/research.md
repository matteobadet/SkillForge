# Phase 0 Research: CLI de synchronisation

Les 3 décisions produit ambiguës (distribution, authentification, nom) ont
été résolues avec l'utilisateur. Ce document couvre les décisions
techniques d'implémentation restantes.

## 1. Bibliothèque de parsing d'arguments

- **Decision**: `commander`.
- **Rationale**: standard de facto pour les CLI Node, API simple pour
  définir des sous-commandes (`login`, `pull <teamId>`, etc.) avec options
  (`--dir`, `--api-url`, `--name`, `--type`), aide générée automatiquement.
- **Alternatives considered**: parsing manuel de `process.argv` — rejeté,
  réinvente l'aide/les erreurs de syntaxe pour un gain nul.

## 2. Compression/décompression ZIP

- **Decision**: `adm-zip`.
- **Rationale**: API synchrone simple (`new AdmZip(path).extractAllTo(dir)`,
  `zip.addLocalFolder(...)`), suffisante à cette échelle (fichiers de
  quelques Mo, pas de streaming nécessaire), une seule dépendance pour les
  deux sens (compresser pour `push`, décompresser pour `pull`).
- **Alternatives considered**: `archiver` (écriture) + `unzipper`
  (lecture) séparés — rejeté, deux dépendances pour un besoin qu'une seule
  bibliothèque couvre.

## 3. Saisie interactive du mot de passe

- **Decision**: `prompts`.
- **Rationale**: bibliothèque légère et maintenue, gère nativement le
  masquage du mot de passe (type `password`) sans code Node bas niveau
  (manipuler `process.stdin` en mode raw manuellement).
- **Alternatives considered**: `inquirer` — fonctionnellement équivalent
  mais nettement plus lourd (nombreuses dépendances transitives) pour un
  besoin de deux prompts (email, mot de passe).

## 4. Stockage des credentials locaux

- **Decision**: `~/.skillforge/credentials.json` contenant `{ apiUrl,
  accessToken, refreshToken }`, fichier créé avec des permissions `600`
  (lecture/écriture propriétaire uniquement) sur les systèmes qui le
  supportent (POSIX ; sur Windows, protection par défaut du dossier
  utilisateur).
- **Rationale**: même nature de secret que le `localStorage` du frontend
  (feature 001) — pas de chiffrement supplémentaire jugé nécessaire à cette
  échelle (usage entre amis, machine personnelle), mais restreindre les
  permissions du fichier est une précaution simple et peu coûteuse.
- **Alternatives considered**: trousseau système (keychain macOS,
  Credential Manager Windows) via une bibliothèque type `keytar` — rejeté,
  dépendance native compilée par plateforme, complexité d'installation
  disproportionnée pour ce contexte (principe Scope Discipline).

## 5. Rafraîchissement automatique du token

- **Decision**: `apiClient.ts` réplique la logique de
  `frontend/src/api/client.ts` (feature 001) : sur réponse 401, appelle
  `POST /api/auth/refresh` avec le refresh token stocké, réessaie une fois
  la requête originale, échoue proprement (message + code de sortie non
  nul) si le refresh échoue aussi.
- **Rationale**: cohérence de comportement avec le frontend web ; la
  rotation des refresh tokens (feature 001, FR-014) s'applique aussi bien
  ici — chaque refresh réussi met à jour `credentials.json` avec le nouveau
  refresh token.

## 6. Mapping type de ressource → dossier local

- **Decision**: `Skill` → `skills/`, `MCP` → `mcp/`, `Agent` → `agents/`
  (minuscules, pluriel sauf MCP qui est déjà un sigle), sous le dossier
  cible (`~/.claude` par défaut).
- **Rationale**: correspond aux conventions de dossiers habituelles d'un
  répertoire `.claude` (`skills/`, `agents/`) ; `mcp/` est un choix cohérent
  par analogie, à ajuster librement par l'utilisateur après `pull` si son
  usage réel diffère (cf. spec.md Assumptions — pas de fusion automatique
  de config MCP dans ce MVP).

## 7. Nom de dossier local pour une ressource

- **Decision**: le nom de la ressource est "sluggifié" pour former le nom
  du dossier local (minuscules, espaces/caractères non alphanumériques
  remplacés par `-`) — ex. `"Mon Skill CLI"` → `mon-skill-cli/`.
- **Rationale**: évite les soucis d'échappement shell/chemins avec espaces
  ou caractères spéciaux dans le nom de ressource ; convention courante des
  outils CLI similaires.
- **Alternatives considered**: utiliser le nom exact tel quel — rejeté,
  fragile sur certains usages shell (espaces, apostrophes) même si
  techniquement supporté par les systèmes de fichiers.

**Output**: aucune inconnue technique ne subsiste.
