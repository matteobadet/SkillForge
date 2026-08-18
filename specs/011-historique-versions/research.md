# Phase 0 Research: Historique de versions des ressources

## 1. Réutiliser la convention de clé objet déjà unique par upload

**Decision**: Ne rien changer à la génération des clés MinIO. Chaque upload
(publication initiale ou remplacement) génère déjà une clé unique
(`{teamId}/{Guid.NewGuid()}.zip`, cf. `ResourcesController.Publish`/`Update`
existants) — le seul changement nécessaire est de **ne plus supprimer**
l'ancienne clé lors d'un remplacement (`Update` appelle aujourd'hui
`objectStorage.DeleteAsync(ResourcesBucket, previousKey)` juste après avoir
basculé `resource.ObjectKey` vers la nouvelle clé).

**Rationale**: L'essentiel du "problème" n'est pas le stockage (les
anciennes archives existent déjà sous des clés distinctes au moment du
remplacement) mais leur suppression immédiate. Corriger ce point précis
minimise le changement de code et le risque de régression sur le chemin
d'upload déjà testé.

**Alternatives considered**: Réorganiser les clés sous un préfixe
`{resourceId}/v{n}/...` (rejeté : aucun bénéfice fonctionnel, complexifie
la migration des ressources déjà publiées avant cette feature qui ont des
clés existantes ne suivant pas ce nouveau schéma).

## 2. Modèle de données et rétro-compatibilité sans migration de données

**Decision**: Table `resource_versions` (`ResourceId`, `VersionNumber`,
`ObjectKey`, `Note?`, `CreatedByUserId`, `CreatedAt`). Comportement en deux
temps :

- **Nouvelles ressources** (publiées après cette feature) : `Publish` crée
  directement la ligne de version 1 en plus de la ressource.
- **Ressources existantes avant cette feature** (aucune ligne de version) :
  - *Tant qu'elles ne sont jamais mises à jour* : le endpoint de listing
    des versions **synthétise** une version 1 virtuelle à la volée à
    partir de `Resource.CreatedAt`/`Resource.ObjectKey` — jamais écrite en
    base. Satisfait FR-006/SC-004 sans script de migration.
  - *Au premier remplacement d'archive après cette feature* : avant
    d'écraser `Resource.ObjectKey`, le service crée rétroactivement la
    ligne de version 1 (capturant l'état actuel, sur le point d'être
    remplacé) puis la ligne de version 2 pour le nouvel upload. C'est le
    seul moment où l'ancienne archive serait sinon irrémédiablement perdue
    (comportement actuel, le bug que cette feature corrige) — donc c'est
    le seul moment où un "backfill" réel et nécessaire a lieu.

**Rationale**: Une vraie perte de données ne peut survenir qu'au moment
d'un remplacement — c'est donc le seul moment où persister
rétroactivement une ligne a de la valeur. Pour les ressources jamais
retouchées, la synthèse à la lecture suffit et évite tout script de
migration de données sur la base de production.

**Alternatives considered**: Script de migration de données créant une
ligne de version 1 pour toutes les ressources existantes au déploiement
(rejeté : étape manuelle supplémentaire sur la base de production,
alors que la synthèse à la lecture obtient le même résultat visible sans
aucune opération risquée sur des données existantes).

## 3. Numérotation des versions

**Decision**: Entier séquentiel par ressource, calculé comme
`MAX(VersionNumber) + 1` au moment de la création d'une nouvelle version
(ou `1` s'il n'existe encore aucune ligne).

**Rationale**: Simple, lisible pour l'utilisateur ("version 3"), pas besoin
d'une séquence PostgreSQL dédiée pour un volume de versions par ressource
qui reste faible.

**Alternatives considered**: UUID pur sans numéro lisible (rejeté :
moins clair pour l'utilisateur final, FR-002 demande un identifiant de
version compréhensible).

## 4. Lacune découverte : pas d'UI web pour remplacer une archive

**Decision**: Ajouter une section "Remplacer l'archive" (upload de fichier
+ champ de note optionnel) dans la zone Gestion de `ResourcePage.tsx`,
visible uniquement par les utilisateurs `canManage`.

**Rationale**: En examinant `ResourcePage.tsx`, aucune UI web n'existe
aujourd'hui pour remplacer l'archive d'une ressource — seul
`skillforge push <teamId> <chemin> --name <nom existant>` (CLI) le permet.
La feature demandée doit fonctionner depuis "le CLI et le formulaire web"
(cf. description utilisateur) ; comme ce formulaire web n'existe pas
encore pour cette action précise, il fait partie du travail nécessaire
plutôt qu'une extension de périmètre non demandée.

**Alternatives considered**: Se limiter au CLI pour la publication de
nouvelles versions (rejeté : la note de version, US2, deviendrait alors
inaccessible aux utilisateurs qui ne passent jamais par le CLI, réduisant
la moitié de la valeur de cette feature à un sous-ensemble d'utilisateurs).

## 5. Suppression d'une ressource

**Decision**: `DeleteResourceAsync` supprime toutes les lignes
`resource_versions` (cascade EF Core au niveau base, comme les autres
relations de `Resource`) et boucle sur leurs `ObjectKey` pour supprimer
chaque archive de MinIO, pas seulement celle de `Resource.ObjectKey`.

**Rationale**: FR-008 exige la suppression complète de l'historique — un
cascade EF Core seul ne nettoie que PostgreSQL, pas les objets MinIO
correspondants ; il faut boucler explicitement sur les clés avant la
suppression de la ressource.

**Alternatives considered**: Conserver les archives orphelines dans MinIO
après suppression de la ressource (rejeté : contredit FR-008 et laisse
grossir le stockage sans aucune trace pour les retrouver/nettoyer plus
tard).

## 6. Validation de la note de version

**Decision**: Champ texte optionnel, limité à 300 caractères (cohérent
avec l'ordre de grandeur des champs `Description` déjà en place : 500
caractères pour une équipe/ressource, un peu moins ici car il s'agit d'une
note courte de changement, pas d'une description complète).

**Rationale**: Évite qu'une note de version devienne un second champ de
description complet — reste un résumé court par construction.

**Alternatives considered**: Aucune limite (rejeté : pas de raison
fonctionnelle de permettre un texte long pour une note de changement).

## 7. Tests

**Decision**: `ResourceVersioningTests.cs` (xUnit, base en mémoire comme
les tests existants) couvrant : version 1 créée à la publication,
nouvelle version créée + `ObjectKey` mis à jour lors d'un remplacement,
backfill rétroactif de la version 1 pour une ressource "legacy" lors de
son premier remplacement après cette feature, synthèse à la lecture pour
une ressource legacy jamais retouchée, suppression en cascade des versions
et de leurs objets lors de la suppression de la ressource, respect de la
visibilité (équipe privée). Côté frontend, `ResourceVersionHistory.test.tsx`
(Vitest) couvre l'affichage de plusieurs versions, le badge "version
actuelle", et l'affichage/l'absence de note.

**Rationale**: Cohérent avec le style de test déjà en place sur le projet
(base EF Core en mémoire côté backend, pas de fixtures binaires).
