# Loot Tables for Owlbear
<img alt="Legacy Code: O S+ I+ C E M V+ D+ !A" src="https://img.shields.io/badge/Legacy%20Code-O%20S%2B%20I%2B%20C%20E%20M%20V%2B%20D%2B%20!A-informational">

Une extension Owlbear Rodeo pour créer, modifier, importer, exporter et lancer des tables de loot, avec support de plusieurs systèmes de jeu.

## Fonctionnalités

- Création et modification de tables de loot
- Support des systèmes **PF2E** et **DND5E** (sélecteur dans l’UI)
- Gestion d'objets avec :
  - nom
  - lien de fiche
  - niveau
  - catégorie
  - type (notamment pour DND5E)
  - rareté
  - valeur
- Stockage local séparé par système (les tables PF2E et DND5E sont isolées)
- Tri et recherche des tables
- Affichage repliable des objets
- Import / export JSON
- Import / export CSV (format adapté au système)
- Import CSV dans une table existante
- Collage multiple depuis Excel
- Détection simple de doublons à l'import
- Modal unique pour tous les transferts de fichier (import/export JSON/CSV)
- Tirage configuré avec :
  - plage de niveau (min/max)
  - plage de quantité (min/max)
  - plage de valeur en pc (min/max)
  - catégories
  - doublons autorisés ou non
  - mode de probabilité
- Saisie manuelle précise des bornes min/max (synchronisée avec les sliders)
- Tirage rapide avec les derniers paramètres mémorisés
- Mémorisation locale de plusieurs états d'interface

## Installation dans Owlbear Rodeo

Ajouter cette URL comme extension :

`https://loot-tables-af787d.gitlab.io/manifest.json`

## Sauvegarde recommandée

Les tables de loot sont actuellement stockées localement dans le navigateur.  
Il est fortement recommandé de faire des exports JSON réguliers pour éviter toute perte de données.

## Utilisation

### Choisir le système

- Utiliser le sélecteur **PF2E / DND5E** en haut de l’application.
- Chaque système a son propre stockage local.
- Changer de système ne supprime rien : cela affiche simplement l’autre “espace” de tables.

### Créer une table

- Cliquer sur **Créer une nouvelle table**
- Donner un nom à la table
- Ajouter les objets ligne par ligne
- Enregistrer la table

### Importer des objets

Deux possibilités :

- importer un CSV comme nouvelle table
- importer un CSV dans une table existante

Lors d'un import dans une table existante, il est possible de :
- ajouter les objets à la table
- remplacer les objets existants

Les doublons simples sont ignorés à l'import.

### Tirer du loot

Deux options :

- bouton vert **▶** : ouvre la fenêtre complète de configuration
- bouton jaune **⚡** : tirage rapide avec les derniers paramètres utilisés

### Format CSV attendu

#### PF2E

Colonnes attendues :
- `name`
- `url`
- `level`
- `category`
- `rarity`
- `valueAmount`
- `valueCurrency`

Catégories disponibles
- `Arme`
- `Armure`
- `Consommable`
- `Contenant`
- `Equipement`
- `Trésor`
- `Autre`

Raretés disponibles
- `Courant`
- `Peu courant`
- `Rare`
- `Unique`

Exemple :

```csv
name;url;level;category;rarity;valueAmount;valueCurrency
Epée courte;https://example.com;1;Arme;Courant;9;pa
Potion de soins;https://example.com;1;Consommable;Courant;4;po
```
#### DND5E

Colonnes attendues :
- `name`
- `url`
- `category`
- `type`
- `rarity`
- `valueAmount`
- `valueCurrency`

Catégories disponibles
- `Armes`
- `Armures`
- `Équipement d'aventurier`
- `Outils`
- `Montures et véhicules`
- `Marchandises`
- `Objets magiques`
- `Poisons`
- `Herbes`

Raretés disponibles
- `Aucun`
- `Commun (niv 1)`
- `Peu commun (niv 1)`
- `Très rare (niv 11)`
- `Légendaire (niv 17)`
- `Artéfact`

Exemple :

```csv
name;url;category;type;rarity;valueAmount;valueCurrency
Longsword +1;https://example.com;Armes;Arme martiale;Rare;500;po
Potion of Healing;https://example.com;Consommable;Potion;Courant;50;po
```

## Limites actuelles

les données sont stockées localement dans le navigateur (séparées par système)
si les données du site sont supprimées par le navigateur, certains états locaux peuvent être perdus
le partage temps réel MJ / joueurs n'est pas encore implémenté
le stockage lié à la room ou à la scène n'est pas encore activé

## Notes récentes (roll)

- Les sliders min/max du roll sont bornés automatiquement à partir des valeurs de la table sélectionnée :
  - niveau min/max basé sur les niveaux d’objets de la table
  - valeur min/max (pc) basée sur les valeurs converties en cuivre des objets de la table
  - quantité max basée sur le nombre d’objets de la table
- Les bornes min/max peuvent aussi être saisies manuellement via des champs compacts inline.

## Feuille de route

- intégration plus poussée au SDK Owlbear
- stockage lié à la room
- stockage lié à la scène
- synchronisation MJ / joueurs
- interface mieux optimisée pour le format popover
- notes sur les objets
- tags supplémentaires

## Développement
```npm install
npm run build
```

## Déploiement

Le projet est publié via GitLab Pages.