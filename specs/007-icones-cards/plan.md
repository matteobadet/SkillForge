# Implementation Plan: Icônes équipes/ressources et affichage en cards

**Branch**: `007-icones-cards` | **Date**: 2026-08-15 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/007-icones-cards/spec.md`

## Summary

Ajouter deux champs (`iconPreset`, `iconObjectKey`, mutuellement exclusifs)
à `Team` et `Resource`, un nouveau bucket MinIO `icons` pour les uploads
personnalisés, un composant `IconPicker` partagé (palette `lucide-react` +
upload) intégré aux formulaires de création/gestion, et remplacer les
listes du Store, de l'annuaire d'équipes et de la liste de ressources d'une
équipe par des grilles de cards avec icône.

## Technical Context

**Language/Version**: C# / .NET 9 (backend), TypeScript / React (frontend) — inchangés.

**Primary Dependencies**: Aucune nouvelle dépendance backend. Frontend :
réutilisation de `lucide-react` (déjà présent depuis la feature 006), aucun
ajout.

**Storage**: PostgreSQL — 2 colonnes nullable ajoutées sur `teams` et
`resources` chacune. MinIO — nouveau bucket `icons`.

**Testing**: xUnit pour la logique d'exclusivité preset/upload et les
droits de modification d'icône ; Vitest pour `IconPicker` si pertinent
(sélection palette vs upload, mutuellement exclusifs côté UI).

**Target Platform**: Identique aux features précédentes.

**Project Type**: Extension du backend et du frontend existants.

**Performance Goals**: Non applicable.

**Constraints**: Aucun des deux champs d'icône ne doit pouvoir être actif
simultanément (FR-003) — logique appliquée côté serveur, pas seulement
côté UI.

**Scale/Scope**: 2 entités modifiées, 1 nouveau bucket, 1 composant
frontend partagé, 3 vues restylées en cards (Store, annuaire équipes,
ressources d'une équipe).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Justification |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md rédigé à partir d'une demande utilisateur directe et détaillée (exemple concret fourni), aucune ambiguïté produit bloquante restante. |
| II. Scope Discipline (YAGNI) | PASS | Palette fixe (pas d'upload de palettes personnalisées côté admin), pas de recadrage/édition d'image, pas de galerie d'historique d'icônes — tout hors périmètre, non demandé. |
| III. Explicit Over Assumed | PASS | Choix de palette (lucide vs émojis), nouveau bucket dédié, formulaire combiné : décisions techniques sans conséquence produit, documentées en Assumptions (exception explicitement permise par le principe III). |
| IV. Security & Data Ownership | PASS | Droits de modification d'icône vérifiés côté serveur (owner/publieur uniquement, cf. FR-005/FR-007) ; upload validé par type MIME/taille comme les avatars et archives existants. |
| V. Consistent, Boring Stack | PASS | Zéro nouvelle dépendance ; réutilisation de `lucide-react` et du pattern `ObjectStorageService` déjà généralisé en feature 003. |
| VI. Reproducible Local Environment | PASS | Nouvelle migration EF Core appliquée automatiquement au démarrage ; nouveau bucket créé automatiquement au démarrage (même mécanisme que `avatars`/`resources`). |

Aucune violation → Complexity Tracking reste vide.

## Project Structure

### Documentation (this feature)

```text
specs/007-icones-cards/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
└── tasks.md
```

### Source Code (repository root)

```text
backend/SkillForge.Api/
├── Models/
│   ├── Team.cs                        # modifié : + IconPreset, IconObjectKey
│   └── Resource.cs                    # modifié : + IconPreset, IconObjectKey
├── Models/Dtos/
│   ├── TeamDtos.cs                    # modifié : + iconPreset/iconUrl, requêtes acceptent iconPreset
│   └── ResourceDtos.cs                # modifié : idem
├── Options/MinioOptions.cs            # modifié : + IconsBucket
├── Services/
│   ├── TeamService.cs                 # modifié : logique d'exclusivité icône
│   └── ResourceService.cs             # modifié : idem
├── Controllers/
│   ├── TeamsController.cs             # modifié : Create/Update acceptent iconPreset ; + POST /api/teams/{id}/icon
│   └── ResourcesController.cs         # modifié : Publish/Update acceptent iconPreset ; + POST /api/resources/{id}/icon
├── Data/AppDbContext.cs               # modifié : nouvelles colonnes (pas de contrainte SQL, exclusivité en code)
├── Data/Migrations/                   # + migration AddIcons
└── Program.cs                         # modifié : création du bucket icons au démarrage

frontend/src/
├── icons/
│   └── presets.ts                     # nouveau : liste curatée d'icônes lucide-react (clé + composant), icône par défaut par type de ressource
├── components/
│   └── IconPicker.tsx                 # nouveau : palette + upload, mutuellement exclusifs, réutilisé par CreateTeamPage/PublishResourcePage/TeamPage/ResourcePage
├── api/
│   ├── teams.ts                       # modifié : iconPreset/iconUrl, uploadTeamIcon
│   └── resources.ts                   # modifié : idem
└── pages/
    ├── CreateTeamPage.tsx             # modifié : + IconPicker
    ├── PublishResourcePage.tsx        # modifié : + IconPicker
    ├── TeamPage.tsx                   # modifié : + IconPicker en gestion, icône affichée en en-tête
    ├── ResourcePage.tsx                # modifié : idem
    ├── TeamsDirectoryPage.tsx         # modifié : cards au lieu de liste
    └── StorePage.tsx                  # modifié : cards au lieu de liste
```

**Structure Decision**: Un seul composant partagé `IconPicker` (au lieu de
deux composants dupliqués pour équipes/ressources) — l'entité cible
(équipe ou ressource) et l'action d'upload sont passées en props, cohérent
avec le principe Scope Discipline. Les cards (Store/annuaire/liste
d'équipe) sont des blocs JSX + classes CSS directement dans chaque page
plutôt qu'un composant `Card` générique supplémentaire, cohérent avec le
choix déjà fait en feature 006 (classes CSS partagées plutôt que
bibliothèque de composants).

## Complexity Tracking

Aucune violation de la constitution à justifier.
