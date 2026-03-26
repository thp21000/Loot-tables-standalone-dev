# Loot Tables for Owlbear
<img alt="Legacy Code: O S+ I+ C E M V+ D+ !A" src="https://img.shields.io/badge/Legacy%20Code-O%20S%2B%20I%2B%20C%20E%20M%20V%2B%20D%2B%20!A-informational">

---

## 🇫🇷 Version française

Une extension Owlbear Rodeo pour créer, modifier, importer, exporter et lancer des tables de loot, avec support de plusieurs systèmes de jeu.

### Fonctionnalités

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

### Installation dans Owlbear Rodeo

Ajouter cette URL comme extension :

`https://thp21000.github.io/loot-tables-for-OBR/manifest.json`

### Sauvegarde recommandée

Les tables de loot sont actuellement stockées localement dans le navigateur.  
Il est fortement recommandé de faire des exports JSON réguliers pour éviter toute perte de données.

### Utilisation

#### Choisir le système

- Ouvrir la fenêtre **Paramètres** (bouton engrenage).
- Utiliser les boutons **PF2E / DND5E**.
- Chaque système a son propre stockage local.
- Changer de système ne supprime rien : cela affiche simplement l’autre “espace” de tables.

#### Créer une table

- Cliquer sur **Créer une nouvelle table**
- Donner un nom à la table
- Ajouter les objets ligne par ligne
- Enregistrer la table

#### Importer des objets

Deux possibilités :

- importer un CSV comme nouvelle table
- importer un CSV dans une table existante

Lors d'un import dans une table existante, il est possible de :
- ajouter les objets à la table
- remplacer les objets existants

Les doublons simples sont ignorés à l'import.

#### Tirer du loot

Deux options :

- bouton vert **▶** : ouvre la fenêtre complète de configuration
- bouton jaune **⚡** : tirage rapide avec les derniers paramètres utilisés

#### Formats CSV attendus

##### PF2E

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

##### DND5E

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
- `Rare`
- `Très rare (niv 11)`
- `Légendaire (niv 17)`
- `Artéfact`

Exemple :

```csv
name;url;category;type;rarity;valueAmount;valueCurrency
Longsword +1;https://example.com;Armes;Arme martiale;Rare;500;po
Potion of Healing;https://example.com;Consommable;Potion;Courant;50;po
```

#### Devises disponibles

- `pc`
- `pa`
- `pe`
- `po`
- `pp`

### Limites actuelles

- les données sont stockées localement dans le navigateur (séparées par système)
- si les données du site sont supprimées par le navigateur, certains états locaux peuvent être perdus
- le stockage lié à la room ou à la scène n'est pas encore activé

### Notes récentes (roll)

- Les sliders min/max du roll sont bornés automatiquement à partir des valeurs de la table sélectionnée :
  - niveau min/max basé sur les niveaux d’objets de la table
  - valeur min/max (pc) basée sur les valeurs converties en cuivre des objets de la table
  - quantité max basée sur le nombre d’objets de la table
- Les bornes min/max peuvent aussi être saisies manuellement via des champs compacts inline.

### Feuille de route

- intégration plus poussée au SDK Owlbear
- stockage lié à la room
- stockage lié à la scène
- synchronisation MJ / joueurs
- interface mieux optimisée pour le format popover
- notes sur les objets
- tags supplémentaires

### Développement

```bash
npm install
npm run build
```

### Déploiement

Le projet est publié via Github Pages.

---

## 🇬🇧 English version

An Owlbear Rodeo extension to create, edit, import, export, and roll loot tables, with support for multiple game systems.

### Features

- Create and edit loot tables
- Support for **PF2E** and **DND5E** systems (selector in UI)
- Item management with:
  - name
  - sheet URL
  - level
  - category
  - type (especially useful for DND5E)
  - rarity
  - value
- Local storage separated by system (PF2E and DND5E tables are isolated)
- Table sorting and search
- Collapsible item display
- JSON import / export
- CSV import / export (system-aware format)
- CSV import into an existing table
- Multi-paste from Excel
- Simple duplicate detection on import
- Single modal for all file transfers (JSON/CSV import/export)
- Configurable roll with:
  - level range (min/max)
  - quantity range (min/max)
  - value range in cp (min/max)
  - categories
  - duplicates allowed or not
  - probability mode
- Precise manual min/max input (synchronized with sliders)
- Quick roll with last-used settings
- Local persistence of multiple UI states

### Installation in Owlbear Rodeo

Add this URL as an extension:

`https://thp21000.github.io/loot-tables-for-OBR/manifest.json`

### Recommended backup

Loot tables are currently stored locally in your browser.  
It is strongly recommended to export JSON backups regularly to avoid data loss.

### Usage

#### Choose system

- Open **Settings** (gear button).
- Use **PF2E / DND5E** buttons.
- Each system has its own local storage.
- Switching system does not delete anything: it simply shows the other table space.

#### Create a table

- Click **Create a new table**
- Give your table a name
- Add items row by row
- Save the table

#### Import items

Two options:

- import a CSV as a new table
- import a CSV into an existing table

When importing into an existing table, you can:
- append items
- replace existing items

Simple duplicates are ignored during import.

#### Roll loot

Two options:

- green **▶** button: opens full roll configuration
- yellow **⚡** button: quick roll with last-used settings

#### Expected CSV formats

##### PF2E

Expected columns:
- `name`
- `url`
- `level`
- `category`
- `rarity`
- `valueAmount`
- `valueCurrency`

Available categories
- `Arme`
- `Armure`
- `Consommable`
- `Contenant`
- `Equipement`
- `Trésor`
- `Autre`

Available rarities
- `Courant`
- `Peu courant`
- `Rare`
- `Unique`

Example:

```csv
name;url;level;category;rarity;valueAmount;valueCurrency
Short Sword;https://example.com;1;Weapon;Common;9;sp
Healing Potion;https://example.com;1;Consumable;Common;4;gp
```

##### DND5E

Expected columns:
- `name`
- `url`
- `category`
- `type`
- `rarity`
- `valueAmount`
- `valueCurrency`

Available categories
- `Armes`
- `Armures`
- `Équipement d'aventurier`
- `Outils`
- `Montures et véhicules`
- `Marchandises`
- `Objets magiques`
- `Poisons`
- `Herbes`

Available rarities
- `Aucun`
- `Commun (niv 1)`
- `Peu commun (niv 1)`
- `Rare`
- `Très rare (niv 11)`
- `Légendaire (niv 17)`
- `Artéfact`

Example:

```csv
name;url;category;type;rarity;valueAmount;valueCurrency
Longsword +1;https://example.com;Weapons;Martial Weapon;Rare;500;gp
Potion of Healing;https://example.com;Consumable;Potion;Common;50;gp
```

#### Available currencies

- `pc`
- `pa`
- `pe`
- `po`
- `pp`

### Current limitations

- data is stored locally in the browser (separated by system)
- if site data is cleared by the browser, some local states may be lost
- room/scene linked storage is not enabled yet

### Recent notes (roll)

- Roll min/max sliders are automatically bounded from selected table values:
  - level min/max based on table item levels
  - value min/max (cp) based on item values converted to copper
  - quantity max based on the table item count
- Min/max bounds can also be entered manually using compact inline inputs.

### Roadmap

- deeper Owlbear SDK integration
- room-linked storage
- scene-linked storage
- GM / player synchronization
- improved UI for popover format
- notes on items
- additional tags

### Development

```bash
npm install
npm run build
```

### Deployment

The project is published through Github Pages.