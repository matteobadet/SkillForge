# Quickstart: Icônes équipes/ressources et affichage en cards

Prérequis : stack démarrée, un utilisateur connecté membre/owner d'une
équipe.

## User Story 1 — Choisir une icône de palette

```bash
curl -s -X POST http://localhost:5080/api/teams \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"name":"Equipe Icone","visibility":"Public","iconPreset":"Rocket"}'
# -> 201, iconPreset:"Rocket", iconUrl:null

curl -s -X PATCH http://localhost:5080/api/teams/$TEAM_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"iconPreset":"Bot"}'
# -> 200, iconPreset:"Bot"
```

## User Story 2 — Upload d'une icône personnalisée

```bash
curl -s -X POST http://localhost:5080/api/teams/$TEAM_ID/icon \
  -H "Authorization: Bearer $TOKEN" -F "file=@./icon.png;type=image/png"
# -> 200, iconObjectKey défini, iconPreset:null, iconUrl:"http://..."

# Repasser sur une icône de palette efface l'upload précédent
curl -s -X PATCH http://localhost:5080/api/teams/$TEAM_ID \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"iconPreset":"Globe"}'
# -> 200, iconUrl:null, iconPreset:"Globe"
```

## User Story 3 — Cards dans le Store et l'annuaire

1. Publier deux ou trois ressources avec des icônes différentes (palette et
   upload) dans une même équipe.
2. Consulter `/store` : chaque ressource s'affiche en card avec son icône.
3. Consulter `/teams` : chaque équipe s'affiche en card avec son icône.
4. Consulter la page de l'équipe : la section "Ressources" utilise
   également des cards.
