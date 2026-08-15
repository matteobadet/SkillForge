# Implementation Plan: Recherche/filtres et corrections de champs

**Branch**: `008-recherche-polish` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-recherche-polish/spec.md`

## Summary

Corriger un bug CSS réel (sélecteur `input[type='...']` qui ne cible pas
les `<input>` sans attribut `type` explicite, sur 5 champs), introduire un
composant `FileInput` stylé réutilisable (avatar, archive de ressource) sur
le motif déjà établi par `IconPicker`, et ajouter une recherche/filtre
client-side sur le Store (nom/équipe/publieur + type) et l'annuaire des
équipes (nom).

## Technical Context

**Language/Version**: TypeScript / React (frontend uniquement — aucun
changement backend, aucun nouvel endpoint).

**Primary Dependencies**: Aucune nouvelle dépendance.

**Storage**: Non applicable.

**Testing**: Vitest pour la logique de filtrage (fonction pure testable
isolément).

**Target Platform**: Identique aux features précédentes.

**Project Type**: Frontend uniquement.

**Performance Goals**: Non applicable (filtrage en mémoire sur des
dizaines d'éléments au plus).

**Constraints**: Aucun appel réseau supplémentaire déclenché par la
recherche/filtre (FR-003/FR-004 appliqués sur les données déjà chargées).

**Scale/Scope**: Correctif CSS ciblé + 1 nouveau composant partagé + 2 vues
existantes enrichies.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md rédigé à partir d'un retour utilisateur direct sur captures d'écran de l'application réelle — aucune ambiguïté produit restante. |
| II. Scope Discipline (YAGNI) | PASS | Recherche/filtre strictement client-side (pas de nouvel endpoint, pas de pagination serveur) ; pas de recherche par tags (déjà écartée du MVP) — cohérent avec l'échelle "usage entre amis". |
| III. Explicit Over Assumed | PASS | Aucune décision de goût visuel supplémentaire nécessaire — corrige un écart entre l'intention déjà actée (feature 006) et son implémentation. |
| IV. Security & Data Ownership | PASS | Aucun changement d'autorisation ; filtrage purement présentation sur des données déjà autorisées pour l'appelant. |
| V. Consistent, Boring Stack | PASS | Aucune nouvelle dépendance ; réutilise le motif déjà établi (`IconPicker`) pour le nouveau composant `FileInput`. |
| VI. Reproducible Local Environment | PASS | Aucun changement backend/infra. |

Aucune violation → Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/008-recherche-polish/
├── plan.md
├── research.md
├── data-model.md          # N/A explicite
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/src/
├── index.css                          # modifié : sélecteur input élargi (cf. research.md #1)
├── components/
│   └── FileInput.tsx                  # nouveau : bouton stylé + input caché (extrait du motif IconPicker)
├── lib/
│   └── filter.ts                      # nouveau : fonctions pures de filtrage (testées, cf. research.md #2)
└── pages/
    ├── CreateTeamPage.tsx              # modifié : type="text" explicite
    ├── TeamPage.tsx                    # modifié : type="text" explicite
    ├── PublishResourcePage.tsx         # modifié : type="text" explicite + FileInput pour l'archive
    ├── ResourcePage.tsx                # modifié : type="text" explicite
    ├── ProfilePage.tsx                 # modifié : type="text" explicite + FileInput pour l'avatar
    ├── StorePage.tsx                   # modifié : champ recherche + filtre type
    └── TeamsDirectoryPage.tsx          # modifié : champ recherche

frontend/tests/
└── filter.test.ts                     # nouveau
```

**Structure Decision**: Extraction de `FileInput` en composant partagé
plutôt que dupliquer le motif "input caché + label stylé" dans
`ProfilePage`/`PublishResourcePage` (déjà dupliqué une fois dans
`IconPicker`, cf. feature 007 — la troisième occurrence justifie
l'extraction, cohérent avec le principe Scope Discipline qui n'interdit
pas l'abstraction quand la duplication devient réelle). La logique de
filtrage est extraite en fonctions pures (`lib/filter.ts`) plutôt
qu'inline dans les pages, pour être testable sans monter les composants.

## Complexity Tracking

Aucune violation de la constitution à justifier.
