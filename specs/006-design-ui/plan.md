# Implementation Plan: Passe de style UI

**Branch**: `006-design-ui` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-design-ui/spec.md`

## Summary

Introduire un design system CSS central (variables + styles de base pour
formulaires/boutons/cartes/alertes), un composant `Layout` avec navigation
supérieure à icônes pour toutes les pages authentifiées, et restyler les 10
pages existantes en conséquence — sans aucun changement de comportement
fonctionnel (routes, appels API, logique métier inchangés).

## Technical Context

**Language/Version**: TypeScript / React 19 (frontend existant, aucun
changement de version).

**Primary Dependencies**: `lucide-react` (nouvelle dépendance — bibliothèque
d'icônes SVG légère et tree-shakeable). Aucune autre dépendance ajoutée :
CSS simple (variables + classes), pas de framework CSS ni de bibliothèque
de composants (cf. spec.md FR-006).

**Storage**: Non applicable (aucun changement backend/données).

**Testing**: Les tests Vitest existants (`LoginPage.test.tsx`) DOIVENT
continuer de passer sans modification de leur intention — au besoin,
adapter les sélecteurs si le DOM change de structure (ex. wrapper
supplémentaire), jamais le comportement testé.

**Target Platform**: Identique (navigateur, via `docker compose`).

**Project Type**: Modification du frontend existant uniquement — aucun
changement backend, aucune migration.

**Performance Goals**: Non applicable (page web statique/SPA déjà légère).

**Constraints**: Zéro régression fonctionnelle (spec.md FR-005) ; zéro
changement d'API/contrat (cette feature ne touche que `frontend/`).

**Scale/Scope**: 10 pages existantes + 1 nouveau composant partagé
(`Layout`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md rédigé avant ce plan, cohérent avec la décision "passe de style dédiée" déjà actée en amont (mémoire projet) — pas de nouvelle clarification produit nécessaire. |
| II. Scope Discipline (YAGNI) | PASS | Pas de framework CSS, pas de thème sombre, pas de refonte de la navigation en sidebar, pas d'optimisation mobile poussée — tous explicitement écartés dans spec.md/Assumptions. |
| III. Explicit Over Assumed | PASS | Les choix de goût visuel (palette, layout top-nav) n'ont pas de conséquence produit/données et sont donc tranchés directement (exception explicitement permise par le principe III de la constitution), documentés en Assumptions plutôt que bloquants. |
| IV. Security & Data Ownership | PASS | Aucun changement de sécurité, d'auth ou de données — feature purement présentation. |
| V. Consistent, Boring Stack | PASS | Une seule nouvelle dépendance (icônes), justifiée par une exigence explicite du brief ; pas de nouvel outil de build. |
| VI. Reproducible Local Environment | PASS | Aucun changement à `docker-compose.yml` ; `npm install` suffit à récupérer la nouvelle dépendance frontend au prochain build d'image. |

Aucune violation → Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/006-design-ui/
├── plan.md
├── research.md
├── data-model.md         # N/A explicite (aucune entité)
├── quickstart.md
└── tasks.md
```

### Source Code (repository root)

```text
frontend/src/
├── index.css                          # réécrit : variables + styles de base + composants partagés
├── App.css                            # supprimé (remplacé par index.css)
├── components/
│   └── Layout.tsx                     # nouveau : nav supérieure à icônes + conteneur de page
├── App.tsx                            # modifié : pages authentifiées enveloppées dans <Layout>
└── pages/
    ├── LoginPage.tsx                  # modifié : mise en page centrée dédiée
    ├── SignupPage.tsx                 # modifié : idem
    ├── ProfilePage.tsx                # modifié : classes du design system, nav retirée (gérée par Layout)
    ├── TeamsDirectoryPage.tsx         # modifié : idem
    ├── CreateTeamPage.tsx             # modifié : idem
    ├── TeamPage.tsx                   # modifié : idem
    ├── JoinTeamPage.tsx               # modifié : idem
    ├── StorePage.tsx                  # modifié : idem, nav retirée
    ├── PublishResourcePage.tsx        # modifié : idem
    └── ResourcePage.tsx               # modifié : idem
```

**Structure Decision**: Un seul nouveau composant partagé (`Layout.tsx`)
plutôt qu'une bibliothèque de composants complète (`Button.tsx`,
`Card.tsx`, etc.) — les styles réutilisables (boutons, cartes, formulaires)
sont exprimés en classes CSS appliquées directement aux éléments natifs
dans chaque page, cohérent avec le principe Scope Discipline : à l'échelle
de ce projet, une couche de composants React supplémentaire ajouterait de
l'indirection sans bénéfice mesurable par rapport à des classes CSS
partagées.

## Complexity Tracking

Aucune violation de la constitution à justifier.
