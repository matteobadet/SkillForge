# Implementation Plan: CLI de synchronisation

**Branch**: `004-cli-synchronisation` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-cli-synchronisation/spec.md`

## Summary

Créer un package CLI Node.js/TypeScript (`skillforge-cli`, exécutable
`skillforge`) distribué via npm, consommant exclusivement l'API REST déjà
livrée (features 001-003) : `login`/`logout` (JWT + refresh, stockage local
des tokens), `teams` (liste des équipes), `pull <teamId>` (téléchargement +
décompression des ressources d'une équipe), `push <teamId> <chemin>`
(compression + création/mise à jour d'une ressource). Aucun changement
backend/frontend requis.

## Technical Context

**Language/Version**: TypeScript / Node.js 24 (même version que le
frontend), compilé en JavaScript pour la distribution npm.

**Primary Dependencies**: `commander` (parsing d'arguments CLI, standard et
léger), `prompts` (saisie interactive email/mot de passe, masquage du mot
de passe), `adm-zip` (compression/décompression `.zip`, seule bibliothèque
zip nécessaire — Node n'a pas de support zip natif). `fetch` natif de
Node 24 pour les appels HTTP (pas de dépendance HTTP supplémentaire).

**Storage**: Aucune (côté serveur) — côté client, un fichier local
`~/.skillforge/credentials.json` (permissions restreintes au propriétaire).

**Testing**: Vitest (déjà utilisé côté frontend) pour les tests unitaires
des modules purs (résolution de chemins locaux, mapping type→dossier,
logique de credentials) ; pas de test d'intégration réseau automatisé
(hors périmètre, cf. Scope Discipline) — validation manuelle via
quickstart.md contre l'API réelle (docker compose).

**Target Platform**: CLI multiplateforme (Windows/macOS/Linux) via Node.js.

**Project Type**: Nouveau package indépendant `cli/` à la racine du
monorepo (ni backend, ni frontend) — cohérent avec la constitution
("CLI... décidé et spécifié dans sa propre feature").

**Performance Goals**: Non applicable (usage manuel, ponctuel, entre amis).

**Constraints**: Aucun nouvel endpoint backend (FR-008) ; doit fonctionner
avec l'API telle que livrée dans les features 001-003 sans modification.

**Scale/Scope**: Usage individuel, une poignée d'équipes/ressources.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md validé (3 clarifications tranchées : distribution npm, auth email/mdp, nom `skillforge`) avant ce plan. |
| II. Scope Discipline (YAGNI) | PASS | Pas de fusion de config MCP, pas de synchronisation automatique/démon, pas de nouvel endpoint backend — tout explicitement écarté dans spec.md. |
| III. Explicit Over Assumed | PASS | Les 3 décisions produit réellement ambiguës ont été validées avec l'utilisateur ; le reste (structure de dossiers locale, format de credentials) est un détail d'implémentation sans conséquence produit. |
| IV. Security & Data Ownership | PASS | Réutilise exactement le mécanisme JWT + refresh token à rotation déjà en place (feature 001) ; aucun nouveau secret côté serveur ; le fichier de credentials local est propre à cette CLI et n'est jamais commité (cf. Project Structure). |
| V. Consistent, Boring Stack | PASS | TypeScript/Node, déjà utilisé côté frontend — pas de nouveau langage (Go/Rust envisagés puis écartés, cf. clarification utilisateur). |
| VI. Reproducible Local Environment | PASS | La CLI est un package Node autonome (`npm install`, `npm run build`) sans dépendance à Docker Compose pour son propre développement ; elle cible une instance SkillForge (locale ou distante) déjà démarrée. |

Aucune violation → Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/004-cli-synchronisation/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
cli/
├── package.json                     # nom "skillforge-cli", bin "skillforge"
├── tsconfig.json
├── src/
│   ├── index.ts                     # point d'entrée, définition des commandes (commander)
│   ├── config.ts                    # résolution SKILLFORGE_API_URL / --api-url, dossier cible
│   ├── credentials.ts               # lecture/écriture ~/.skillforge/credentials.json
│   ├── apiClient.ts                 # wrapper fetch + refresh automatique (même logique que frontend/src/api/client.ts)
│   ├── commands/
│   │   ├── login.ts
│   │   ├── logout.ts
│   │   ├── teams.ts
│   │   ├── pull.ts
│   │   └── push.ts
│   └── resourceTypeFolders.ts       # mapping ResourceType -> nom de dossier pluriel
└── tests/
    ├── config.test.ts
    ├── credentials.test.ts
    └── resourceTypeFolders.test.ts
```

**Structure Decision**: Nouveau dossier `cli/` de premier niveau, séparé de
`backend/` et `frontend/` — package Node indépendant avec son propre
`package.json` (pas un sous-module du frontend, même si même langage :
cycle de release et distribution différents — le frontend n'est jamais
publié sur npm, la CLI l'est). La logique de rafraîchissement de token
(`apiClient.ts`) réimplémente volontairement en TypeScript la même logique
que `frontend/src/api/client.ts` plutôt que de la partager via un package
commun : à cette échelle (deux implémentations d'une dizaine de lignes,
environnements d'exécution différents — navigateur vs Node), extraire un
package partagé ajouterait de la complexité de tooling (workspace npm,
publication interne) sans bénéfice mesurable (cf. principe Scope
Discipline).

## Complexity Tracking

Aucune violation de la constitution à justifier.
