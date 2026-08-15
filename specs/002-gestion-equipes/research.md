# Phase 0 Research: Gestion des équipes

Toutes les décisions produit ambiguës (rôles d'équipe, mécanique du lien
d'invitation, visibilité publique, création d'équipe) ont été résolues avec
l'utilisateur directement dans `spec.md`. Ce document couvre les décisions
techniques d'implémentation restantes.

## 1. Jeton du lien d'invitation

- **Decision**: contrairement aux refresh tokens (hachés, feature 001), le
  jeton d'invitation est stocké **en clair** en base (`TeamInviteLink.Token`,
  opaque aléatoire 256 bits). Le lien exposé est `https://<host>/invite/<jeton>`.
- **Rationale**: un refresh token compromis permet une usurpation complète de
  session, donc doit être haché ; un lien d'invitation compromis ne permet
  qu'à quelqu'un de rejoindre une équipe (action mineure, réversible via
  retrait de membre ou régénération du lien). Le stocker en clair permet de
  répondre à `GET /api/teams/{id}/invite-link` en ré-affichant le lien actif
  à l'owner à tout moment (sans devoir le régénérer juste pour le consulter,
  ce qui invaliderait les invitations en cours) — exigence produit
  raisonnable non couverte par un stockage haché à sens unique.
- **Alternatives considered**: hachage façon refresh token — rejeté après
  réflexion en implémentation : casse la consultation du lien actif sans le
  régénérer, ce qui est le comportement attendu (cf. contracts/teams-api.md,
  `GET /invite-link` vs `POST /invite-link/regenerate`).

## 2. Un seul lien actif par équipe

- **Decision**: contrainte unique partielle en base — au plus une ligne
  `TeamInviteLink` avec `RevokedAt IS NULL` par équipe. Régénérer révoque
  l'ancien lien puis en crée un nouveau, dans la même transaction.
- **Rationale**: correspond à FR-003 ("exactement un lien actif à la
  fois") ; simplifie l'UI (un seul lien à afficher/copier).
- **Alternatives considered**: plusieurs liens actifs simultanés (façon
  Discord) — hors périmètre validé (l'utilisateur a choisi "lien permanent
  régénérable", implicitement unique).

## 3. Modèle de rôle d'équipe

- **Decision**: enum applicatif `TeamRole { Owner, Member }` sur
  `TeamMember`, storage `string` en base (cohérent avec `UserRole` en
  feature 001).
- **Rationale**: correspond exactement à la décision "Propriétaire +
  membres" validée avec l'utilisateur ; pas de sur-ingénierie avec un
  système de permissions granulaires non demandé.

## 4. Contrainte d'unicité d'appartenance

- **Decision**: contrainte unique EF Core sur `(TeamId, UserId)` dans
  `TeamMember`, empêchant une double adhésion. Rejoindre alors qu'on est
  déjà membre est un no-op (FR-004, Acceptance Scenario 2), pas une erreur.
- **Rationale**: correspond directement à l'exigence spec ; évite une
  logique applicative de déduplication en plus de la contrainte DB.

## 5. Filtrage de visibilité côté requête

- **Decision**: toute requête de lecture d'équipe(s) applique le filtre
  "Public OU (utilisateur est membre) OU (utilisateur est Admin)" au niveau
  de la requête EF Core (pas de filtrage post-hoc en mémoire), pour qu'une
  équipe privée n'apparaisse jamais dans une réponse même partielle.
- **Rationale**: garantit SC-003 de façon vérifiable (un test peut asserter
  qu'aucune ligne privée ne sort de la requête) plutôt que de compter sur un
  filtrage applicatif après coup, plus fragile.
- **Alternatives considered**: récupérer toutes les équipes puis filtrer en
  C# — rejeté, risque d'oubli de filtrage sur un futur endpoint, et moins
  efficace.

## 6. Suppression d'équipe

- **Decision**: `DELETE /api/teams/{id}` (Owner uniquement) supprime en
  cascade `TeamMember` et `TeamInviteLink` associés (`ON DELETE CASCADE`,
  même pattern que `RefreshToken` → `User` en feature 001).
- **Rationale**: pas de ressources encore rattachées à une équipe à ce
  stade (feature 003 traitera la suppression en cascade des ressources
  séparément) ; cascade simple et sûre pour les entités actuelles.

**Output**: aucune inconnue technique ne subsiste.
