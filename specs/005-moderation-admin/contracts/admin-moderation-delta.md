# API Contract Delta: Modération admin

Aucun nouvel endpoint. Modification du comportement de deux endpoints
existants (cf. contracts/resources-api.md de la feature 003 et
contracts/teams-api.md de la feature 002 pour le contrat complet).

## DELETE /api/resources/{id} 🔒

**Nouveau** : autorisé aussi pour un compte `Admin`, même s'il n'est ni
publieur ni owner de l'équipe.

- `204 No Content` → publieur, owner d'équipe, **ou Admin**.
- `403 Forbidden` → tout autre appelant (inchangé).

## GET /api/teams 🔒

**Nouveau** : pour un compte `Admin`, renvoie toutes les équipes
(publiques et privées). Pour un compte `Utilisateur`, comportement
inchangé (équipes publiques uniquement).

## ResourceDetailDto (champ ajouté)

```json
{
  "...": "champs existants (contracts/resources-api.md)",
  "canDelete": false
}
```
