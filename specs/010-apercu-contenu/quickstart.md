# Quickstart: Aperçu du contenu d'une ressource

## Prérequis

Stack locale démarrée (`docker compose up`), un compte connecté, une
équipe existante.

## 1. Ressource avec `SKILL.md`

```bash
mkdir -p /tmp/preview-test && echo "# Mon Skill de test" > /tmp/preview-test/SKILL.md
cd /tmp/preview-test
skillforge push <TEAM_ID> . --name "Test Aperçu SKILL" --type Skill
```

Ouvrir la page de la ressource dans le navigateur.
**Attendu** : le contenu de `SKILL.md` s'affiche mis en forme (titre en
gras/grande taille) directement sur la page, sans clic sur Télécharger.

## 2. Priorité SKILL.md > README.md

Publier une archive contenant à la fois `SKILL.md` et `README.md` à la
racine (contenus différents pour bien distinguer).
**Attendu** : seul le contenu de `SKILL.md` s'affiche.

## 3. Aucun fichier candidat

```bash
mkdir -p /tmp/no-preview-test && echo "print('hello')" > /tmp/no-preview-test/main.py
cd /tmp/no-preview-test
skillforge push <TEAM_ID> . --name "Test Sans Aperçu" --type Skill
```

**Attendu** : la page affiche "Aucun aperçu disponible pour cette
ressource." — pas d'erreur, pas d'espace vide silencieux.

## 4. Visibilité (équipe privée)

Publier une ressource dans une équipe privée. Avec un compte qui n'est pas
membre de cette équipe, appeler directement :

```bash
curl -i https://<api>/api/resources/<ID>/preview -H "Authorization: Bearer <token non membre>"
```

**Attendu** : `404`, identique au comportement de
`GET /api/resources/{id}` déjà en place.

## 5. Troncature

Publier une archive avec un `README.md` de plus de 100 000 caractères.
**Attendu** : `truncated: true` dans la réponse, et le frontend affiche
l'indication "Aperçu tronqué — téléchargez l'archive pour le contenu
complet."

## 6. Ressource déjà publiée avant cette feature

Ouvrir la page d'une ressource publiée avant l'implémentation de cette
feature (ex. via une équipe existante en local).
**Attendu** : l'aperçu fonctionne immédiatement, sans migration ni
republication — l'extraction se fait à la demande depuis l'archive déjà
stockée dans MinIO (cf. research.md #1).
