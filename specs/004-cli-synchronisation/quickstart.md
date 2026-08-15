# Quickstart: CLI de synchronisation

Prérequis : stack SkillForge démarrée (`docker compose up`, cf. feature
001), un compte existant, membre d'au moins une équipe (cf. feature 002)
contenant au moins une ressource (cf. feature 003).

## Build & lien local (développement)

```bash
cd cli
npm install
npm run build
npm link   # rend la commande "skillforge" disponible globalement en local
```

## User Story 1 — Login / logout

```bash
skillforge login
# Email: ami@example.com
# Mot de passe: ********
# -> Connecté en tant que ami1-nouveau.

skillforge teams
# -> liste des équipes de ami1-nouveau

skillforge logout
# -> déconnecté ; skillforge teams échoue ensuite avec code 1
```

## User Story 3 — Pull

```bash
skillforge login
skillforge pull <TEAM_ID> --dir ./test-claude-dir
# -> N ressource(s) synchronisée(s) dans ./test-claude-dir.
ls ./test-claude-dir/skills/
```

## User Story 4 — Push

```bash
mkdir -p ./mon-skill && echo "---
name: mon-skill
---
Contenu." > ./mon-skill/SKILL.md

skillforge push <TEAM_ID> ./mon-skill --name "Mon Skill CLI" --type Skill
# -> Ressource "Mon Skill CLI" publiée.

# Modifier puis republier avec le même nom :
echo "Contenu modifié." >> ./mon-skill/SKILL.md
skillforge push <TEAM_ID> ./mon-skill --name "Mon Skill CLI" --type Skill
# -> Ressource "Mon Skill CLI" mise à jour.

# Vérifier le round-trip complet :
skillforge pull <TEAM_ID> --dir ./verif
diff -r ./mon-skill ./verif/skills/mon-skill-cli/
```
