# Quickstart: Historique de versions des ressources

## Prérequis

Stack locale démarrée (`docker compose up`), un compte connecté, une
équipe et une ressource existantes (ou publiées via les étapes ci-dessous).

## 1. Version initiale

```bash
mkdir -p /tmp/v1 && echo "# v1" > /tmp/v1/SKILL.md
skillforge push <TEAM_ID> /tmp/v1 --name "Test Versions" --type Skill
```

Ouvrir la page de la ressource. **Attendu** : historique affiche une seule
version (v1), marquée comme actuelle.

## 2. Nouvelle version avec note

```bash
mkdir -p /tmp/v2 && echo "# v2" > /tmp/v2/SKILL.md
skillforge push <TEAM_ID> /tmp/v2 --name "Test Versions" --note "Ajout de la section v2"
```

**Attendu** : l'historique affiche désormais 2 versions ; v2 est actuelle
et porte la note "Ajout de la section v2" ; v1 reste consultable et
téléchargeable, et son contenu téléchargé correspond exactement à
`v1/SKILL.md` (pas `v2/SKILL.md`).

## 3. Téléchargement d'une version antérieure

Depuis la page ressource, télécharger explicitement la version 1.
**Attendu** : le fichier reçu contient bien `# v1`, pas `# v2` (SC-001).

## 4. Ressource legacy (publiée avant cette feature)

Ouvrir la page d'une ressource publiée avant l'implémentation (base locale
existante). **Attendu** : historique affiche une version unique
synthétisée (sa date de publication d'origine), sans erreur (SC-004).
Remplacer son archive une fois : l'historique passe alors à 2 versions
réelles (la version 1 rétroactive + la nouvelle), confirmant le backfill
au premier remplacement (research.md #2).

## 5. Visibilité

Publier une ressource dans une équipe privée. Avec un compte non membre,
appeler directement :

```bash
curl -i https://<api>/api/resources/<ID>/versions -H "Authorization: Bearer <token non membre>"
```

**Attendu** : `404`, identique au comportement des autres endpoints de
ressource.

## 6. Suppression

Supprimer une ressource ayant plusieurs versions. **Attendu** : toutes ses
archives (toutes versions confondues) disparaissent du bucket MinIO
`resources`, pas seulement la dernière.
