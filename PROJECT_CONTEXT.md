# PROJECT_CONTEXT

## Projet
- Nom : Loot Tables for Owlbear
- Type : Extension Owlbear Rodeo (frontend web + manifest Owlbear + déploiement GitLab Pages)
- Objectif : Permettre au MJ de créer, modifier, importer, exporter et lancer des tables de loot, puis de valider un tirage pour partager les gains à tous les participants d’une room Owlbear.

## Stack
- Front : React + TypeScript + Vite
- Back : Aucun back dédié
- BDD : Aucune BDD serveur ; stockage principal local navigateur pour les tables
- Outils / infra :
  - Git + GitLab
  - GitLab Pages pour l’hébergement public
  - Owlbear Rodeo Extension SDK (`@owlbear-rodeo/sdk`)
  - Manifest Owlbear servi publiquement

## Décisions validées
- Les tables de loot restent stockées localement dans le navigateur, pas dans les metadata de room Owlbear.
- Il faut documenter clairement qu’il faut faire des sauvegardes/export JSON réguliers.
- Les résultats validés, eux, sont partagés via Owlbear (room metadata + broadcast + notification + modale Owlbear).
- Le MJ a l’interface complète de gestion ; les joueurs ont une interface de consultation/réception.
- Toujours travailler par patches incrémentaux, sans refonte inutile.
- Toujours fournir les fichiers complets patchés quand on modifie du code.

## État actuel
- Ce qui fonctionne :
  - Extension Owlbear installable via manifest public GitLab Pages
  - Création / édition / suppression / duplication de tables
  - Gestion d’objets avec nom, lien, niveau, catégorie, rareté, valeur
  - Import/export JSON
  - Import/export CSV par table
  - Import CSV dans une table existante avec choix ajouter/remplacer
  - Collage multiple depuis Excel
  - Détection de doublons simples à l’import
  - Recherche / tri des tables
  - Tri des objets dans une table
  - Tables repliables/dépliables
  - Tirage configurable
  - Tirage rapide avec mémorisation des derniers paramètres
  - Mémorisation locale de plusieurs états d’interface
  - Intégration Owlbear SDK minimale fonctionnelle
  - Différenciation MJ / joueurs
  - Validation d’un tirage par le MJ
  - Notification Owlbear à tous lors d’un tirage validé
  - Vraie modale Owlbear de gain chez tous les clients
  - Popover principal Owlbear redimensionné dynamiquement selon la largeur réelle du contenu utile
  - Marges latérales du popover principal rééquilibrées pour éviter que le contenu colle au bord droit
  - Barre recherche/tri, cartes de tables et footer secondaire alignés sur une largeur utile commune
  - Footer secondaire restructuré sur deux lignes pour mieux tenir dans le popover
  - Boutons de lancement rapide / lancer déplacés dans la ligne d’actions principale des tables
  - Support multi-systèmes avec séparation des données PF2E / DND5E
  - Fenêtre Paramètres (bouton engrenage) pour centraliser les préférences d’affichage
  - Sélecteur de système déplacé dans la fenêtre Paramètres
  - Sélecteur de langue FR/EN avec provider i18n global
  - Boutons de langue avec vraies icônes de drapeau (assets SVG)
  - Mapping des termes de jeu (catégories/raretés/types) selon la langue affichée
  - Type d’objet disponible sur les items (notamment utile pour DND5E)
  - Modal unique d’import/export (JSON/CSV) pour centraliser les transferts de fichiers
  - Formats CSV adaptés selon le système (PF2E avec niveau, DND5E avec type)
  - Ajout de nouvelles raretés/catégories compatibles PF2E et DND5E
  - Ajout de la devise `pe` (pièce d’électrum)
  - Roll avancé avec bornes min/max (niveau, quantité, valeur en cuivre) et modes de probabilité étendus
  - Bornes de roll automatiquement dérivées de la table + saisie manuelle inline des min/max
  - En mode édition de table : barre d’actions flottante (Enregistrer/Annuler) visible pendant le scroll
  - Bouton “remonter en haut” dans la même zone flottante de l’éditeur
  - Traduction automatique des devises selon système/langue (ex. EN: cp/sp/ep/gp/pp)
  - Liste des devises filtrée par système (PF2E sans `pe`/`ep`, DND5E avec `pe`/`ep`)
  - Import/collage CSV/JSON tolérant les termes FR/EN pour catégorie/rareté/type
  - Normalisation des catégories arme/armure vers les formes plurielles (`Armes`, `Armures`)
  - Collage multiple depuis Excel tolérant tabulation, `;` et `,`
  - Pondération des modes de probabilité DND5E corrigée pour respecter le sens bas/haut des raretés
- Ce qui est en cours :

- Ce qui est en cours :
  - Relecture UX des traductions FR/EN et homogénéisation terminologique (notamment termes importés EN→FR)
  - Validation terrain du roll avancé (bornes automatiques, sliders, champs manuels)

- Ce qui bloque :
  - Le popover Owlbear reste dépendant des limites de rendu de la plateforme ; même avec redimensionnement dynamique, le comportement réel doit encore être validé dans Owlbear sur plusieurs cas d’usage.
  - La migration/lisibilité des anciens exports hétérogènes (avant séparation PF2E/DND5E) nécessite encore des tests utilisateurs réels, malgré la nouvelle couche de normalisation.

## Architecture du projet
- `public/manifest.json`
  - Déclare l’extension Owlbear
  - Pointe vers `/` comme popover principal
  - Pointe vers `/icon.svg`
- `public/icon.svg`
  - Icône de l’extension
- `src/main.tsx`
  - Point d’entrée
  - Détecte `?view=gain-modal` pour rendre une vue dédiée à la modale Owlbear des gains
  - Pose un `data-view` sur `body`, `html` et `#root` pour distinguer popover principal et modale de gain
  - Sinon rend l’application principale
- `src/App.tsx`
  - UI principale de l’extension
  - Gère tables, imports/exports unifiés, tirages, validation, rôle MJ/joueur, footer secondaire, état Owlbear
  - Gère le système courant (PF2E / DND5E) et charge les données associées
  - Gère la langue courante (FR/EN) et l’intégration des textes localisés
  - Expose une modal Paramètres (engrenage en haut à droite) pour système/langue
  - Mesure la largeur réelle du contenu principal pour redimensionner le popover Owlbear
- `src/owlbear.ts`
  - Couche utilitaire Owlbear SDK
  - `waitForOwlbearReady`
  - configuration du popover principal
  - redimensionnement dynamique de la largeur du popover principal
  - lecture rôle / room / player name
  - room metadata
  - notifications
  - broadcast des tirages validés
  - ouverture/fermeture de la modale Owlbear de gain
- `src/components/TableList.tsx`
  - Affichage des tables
  - Actions MJ seulement
  - Affichage des objets en consultation
  - Porte l’essentiel du dernier chantier de layout (largeurs partagées, densité des blocs, grille d’objets, alignements)
- `src/components/TableEditor.tsx`
  - Édition d’une table
  - Lignes d’objets validables individuellement
  - Import CSV dans table
  - Collage multiple Excel
  - Barre d’actions flottante (save/cancel) et bouton de remontée rapide en haut
- `src/components/RollDialog.tsx`
  - Paramétrage avancé d’un tirage (bornes min/max niveau, quantité, valeur en cuivre)
  - Sliders + saisie manuelle synchronisée des bornes
  - Modes de probabilité étendus
- `src/components/ResultDialog.tsx`
  - Résultat du tirage pour le MJ
  - Validation du tirage
  - Historique local récent
- `src/components/SharedGainPage.tsx`
  - Vue dédiée affichée dans la vraie modale Owlbear
  - Lit `lastValidatedRoll` dans les metadata de room
  - Affichage différent MJ / joueur
- `src/utils/storage.ts`
  - Stockage local tables + état UI
  - Import/export JSON/CSV
  - Clés de stockage distinctes par système (PF2E / DND5E)
  - Adaptation du format CSV selon le système de la table
  - Normalisation des entrées FR/EN (catégorie, rareté, type, devise) au chargement et à l’import
- `src/utils/loot.ts`
  - Logique de tirage, probabilités, catégories disponibles
  - Application des filtres min/max niveau, quantité, valeur (cuivre)
- `src/i18n/index.tsx`
  - Provider i18n, gestion de la locale active et hook `useI18n`
- `src/i18n/locales/fr.ts` / `src/i18n/locales/en.ts`
  - Dictionnaires de traductions de l’interface
- `src/i18n/gameTerms.ts`
  - Mapping localisé des termes de jeu selon système/langue
  - Mapping de devise selon langue + options de devises autorisées selon système
- `src/assets/flag-fr.svg` / `src/assets/flag-gb.svg`
  - Icônes de drapeau utilisées dans la modal Paramètres

## Bug(s) ou problème(s) connu(s)
- La base technique largeur / scroll / fond du popover principal a été largement stabilisée, mais un dernier polish visuel reste nécessaire selon le rendu réel dans Owlbear.
- Le redimensionnement dynamique du popover dépend encore du comportement effectif de la plateforme Owlbear ; il faut continuer à valider le rendu réel après chaque micro-ajustement.
- Le footer secondaire et certaines zones d’actions ont été densifiés récemment ; les prochaines retouches doivent rester locales pour éviter de casser les alignements déjà obtenus.

## Fonctionnalités
### Déjà faites
- [x] Déploiement GitLab Pages public
- [x] Manifest Owlbear fonctionnel
- [x] Icône d’extension
- [x] Création / édition / suppression de tables
- [x] Duplication de table
- [x] Lignes d’objets modifiables individuellement
- [x] Catégories prédéfinies
- [x] Raretés prédéfinies
- [x] Valeur avec montant + devise
- [x] Tri des tables
- [x] Recherche de table
- [x] Tri des objets dans une table ouverte
- [x] Tables repliables/dépliables
- [x] Import/export JSON global
- [x] Export JSON par table
- [x] Export CSV par table
- [x] Support multi-systèmes PF2E / DND5E
- [x] Stockage local séparé par système
- [x] Internationalisation FR/EN (sélecteur de langue + provider i18n)
- [x] Fenêtre Paramètres (engrenage) pour regrouper système + langue
- [x] Boutons de langue avec drapeaux SVG (FR/EN)
- [x] Mapping localisé des termes de jeu (catégories/raretés/types)
- [x] Traduction automatique des devises selon langue (FR/EN)
- [x] Filtrage des devises par système (PF2E sans pe/ep)
- [x] Champs item étendus (type) pour couvrir DND5E
- [x] Import CSV en nouvelle table
- [x] Import CSV dans une table existante
- [x] Choix ajouter/remplacer lors d’un import CSV dans une table
- [x] Détection de doublons simples à l’import
- [x] Collage multiple depuis Excel
- [x] Collage multiple tolérant tabulation + point-virgule + virgule
- [x] Reconnaissance des termes EN/FR en import/collage (catégorie, rareté, type, devise)
- [x] Normalisation des catégories arme/armure vers les formes plurielles
- [x] Barre flottante d’actions en édition de table (Enregistrer / Annuler)
- [x] Bouton de remontée rapide en haut de page dans l’éditeur
- [x] Correction d’encodage UTF-8 CSV
- [x] Modal unique import/export (JSON/CSV)
- [x] Mémorisation locale de l’UI
- [x] Tirage configuré
- [x] Tirage configuré avec bornes min/max (niveau, quantité, valeur en cuivre)
- [x] Saisie manuelle inline des bornes min/max du roll (synchronisée sliders)
- [x] Modes de probabilité étendus dans le roll
- [x] Tirage rapide
- [x] Historique local récent des tirages
- [x] Intégration Owlbear SDK minimale
- [x] Room metadata pour quelques états légers
- [x] Broadcast d’un tirage validé
- [x] Notification Owlbear à tous
- [x] Modale Owlbear dédiée pour les gains
- [x] Différenciation MJ / joueurs
- [x] Côté joueur : pas d’actions de gestion
- [x] Côté joueur : la modale de gain ne montre pas la valeur des objets
- [x] Nom d’objet cliquable dans la modale de gain si URL présente

### En cours
- [ ] Finaliser le polish visuel du popover principal Owlbear maintenant que la base largeur/scroll/fond est en place
- [ ] Valider en situation réelle Owlbear les derniers réglages de largeur dynamique, marges et alignements

### À faire ensuite
- [ ] Continuer le polish visuel de la vue principale
- [ ] Éventuellement historique partagé des gains validés
- [ ] Éventuellement améliorer encore la UI pour le format popover Owlbear
- [ ] Éventuellement stockage lié à la scène plus tard
- [ ] Éventuellement synchronisation plus riche MJ / joueurs
- [ ] Plus tard : notes
- [ ] Plus tard : tags supplémentaires

## Décisions techniques déjà validées
Noter ici les choix qu’il ne faut pas re-discuter à chaque nouveau chat.

- Ne pas stocker les tables complètes dans les metadata de room Owlbear.
- Garder les tables en stockage local navigateur.
- Utiliser Owlbear seulement pour les états partagés légers et les tirages validés.
- Toujours garder les exports JSON/CSV comme sécurité utilisateur.
- Le flux validé est : tirage MJ → validation → room metadata + broadcast → notification + modale Owlbear chez tous.
- Différenciation de rôle obligatoire :
  - MJ : gestion complète + tirages + validation
  - Joueur : consultation uniquement + réception du butin
- Les modales de gain détaillées doivent être des vraies modales Owlbear, pas seulement des modales React internes au popover.
- Les correctifs doivent être localisés et incrémentaux.

## État actuel précis
Décrire où on en est exactement au moment de reprendre.

L’extension est globalement fonctionnelle et jouable.
Le déploiement GitLab Pages est réglé et le manifest Owlbear fonctionne.
Les fonctionnalités cœur (tables, imports, tirages, validation, partage) sont en place.
Le popover principal a beaucoup avancé :
- le `#root` et le `body` distinguent maintenant explicitement la vue popover principale et la vue modale de gain
- la largeur du popover est maintenant recalculée dynamiquement à partir de la largeur réelle du contenu principal
- la largeur minimale fixe du conteneur principal a été retirée
- les marges gauche/droite ont été rééquilibrées pour éviter que le contenu colle au bord droit
- la barre recherche/tri, les cartes de table et le footer secondaire partagent désormais une largeur utile cohérente
- le footer secondaire a été restructuré sur deux lignes pour mieux tenir dans le popover
- la grille de lecture des objets a été resserrée, alignée à gauche, et la colonne montant/devise a été fusionnée
- les boutons de lancement rapide et de lancer sont remontés dans la ligne d’actions principale des tables

Depuis la dernière mise à jour, le périmètre fonctionnel a encore évolué :
- internationalisation FR/EN branchée à l’échelle de l’application (sélecteur + textes localisés)
- terminologie de jeu contextualisée selon système/langue (PF2E vs DND5E)
- roll enrichi avec bornes min/max (niveau, quantité, valeur cuivre), modes de probabilité supplémentaires et bornes automatiques dérivées de la table
- champs manuels min/max ajoutés en complément des sliders pour un réglage précis
- sélecteurs système/langue déplacés dans une modal Paramètres (engrenage), avec boutons visuels
- drapeaux de langue passés sur des assets SVG explicites (plus robustes que le rendu emoji selon plateforme)
- mode édition de table amélioré avec actions flottantes persistantes + bouton de remontée rapide
- correction appliquée sur la pondération de rareté DND5E pour réaligner le comportement “raretés basses/hautes” avec les intitulés des modes
- devises localisées selon langue/système, avec exclusion de `pe/ep` pour PF2E
- import/collage rendu plus permissif et robuste (FR+EN, séparateurs multiples)
- normalisation automatique des catégories/raretés/types pour réduire les incohérences de données

Le sujet encore ouvert n’est plus une refonte du comportement global, mais un polish visuel ciblé du popover principal dans Owlbear :
- vérifier que la largeur dynamique reste agréable selon les cas réels
- vérifier les derniers alignements visuels entre header, cartes, footer et marges
- éviter toute régression sur le scroll global et le fond principal

## Journal de session
### Session du 2026-03-16
- sujets traités :
  - Mise en place de l’extension Owlbear Loot Tables
  - Déploiement GitLab Pages
  - Correction des pipelines GitLab
  - Création/édition/import/export/tirage des tables
  - Tirage rapide
  - Amélioration des imports CSV/Excel
  - Intégration SDK Owlbear
  - Validation du tirage et partage à tous
  - Différenciation MJ / joueurs
  - Mise en place d’une vraie modale Owlbear de gain
  - Début de polish UI du popover principal
- fichiers modifiés :
  - `.gitlab-ci.yml`
  - `public/manifest.json`
  - `public/icon.svg`
  - `README.md`
  - `src/main.tsx`
  - `src/App.tsx`
  - `src/types.ts`
  - `src/owlbear.ts`
  - `src/utils/storage.ts`
  - `src/utils/loot.ts`
  - `src/components/TableList.tsx`
  - `src/components/TableEditor.tsx`
  - `src/components/RollDialog.tsx`
  - `src/components/ResultDialog.tsx`
  - `src/components/ConfirmModal.tsx`
  - `src/components/SharedGainPage.tsx`
  - `src/components/GainModal.tsx` (existe/servait pendant une phase intermédiaire ; la vraie modale finale passe par `SharedGainPage`)
- décisions prises :
  - stockage local conservé pour les tables
  - sauvegarde recommandée via README
  - vraie modale Owlbear pour les gains
  - rôles MJ/joueur distincts
  - bouton de validation de tirage conservé côté MJ
- problèmes restants :
  - largeur réelle du popover principal
  - scroll horizontal/vertical global
  - fond noir principal à ajuster selon la largeur réelle
- prochaine action utile :
  - reprendre le travail sur `src/App.tsx` et éventuellement `src/styles/ui.ts` pour stabiliser définitivement le conteneur principal du popover

### Session du 2026-03-18
- sujets traités :
  - Stabilisation incrémentale du layout du popover principal Owlbear
  - Unification des largeurs utiles entre la barre recherche/tri, les cartes de tables et le footer secondaire
  - Réduction de la densité horizontale de la vue de lecture des objets
  - Fusion de l’affichage montant + devise dans la vue de consultation
  - Déplacement des boutons de lancement rapide / lancer dans la ligne d’actions principale
  - Redimensionnement dynamique du popover principal en fonction de la largeur réelle du contenu
  - Rééquilibrage des marges latérales du popover
- fichiers modifiés :
  - `src/App.tsx`
  - `src/owlbear.ts`
  - `src/main.tsx`
  - `src/index.css`
  - `src/components/TableList.tsx`
  - `src/components/TableEditor.tsx`
- décisions prises :
  - conserver l’approche incrémentale par petites touches sur le layout
  - garder un redimensionnement dynamique du popover basé sur la largeur réelle du contenu
  - garder une petite marge de sécurité à droite du popover pour l’aération visuelle
  - garder une largeur partagée entre la barre de recherche/tri, la liste des tables et le footer secondaire
  - garder le footer secondaire en deux lignes plutôt que de forcer une seule ligne trop longue
- problèmes restants :
  - vérifier dans Owlbear le comportement réel du popover selon plusieurs états d’interface
  - finir le polish visuel des espacements et alignements fins
- prochaine action utile :
  - vérifier en situation réelle Owlbear les derniers réglages de largeur dynamique et corriger uniquement les derniers écarts visuels constatés

### Session du 2026-03-24
- sujets traités :
  - Ajout du support multi-systèmes (PF2E / DND5E)
  - Séparation des clés de stockage local par système
  - Évolution des types de données (système sur table, type sur item)
  - Unification des flux d’import/export dans une modal dédiée
  - Mise à jour des formats CSV selon le système
  - Ajustements UI/layout liés au nouveau flux de transfert
- fichiers modifiés :
  - `PROJECT_CONTEXT.md`
  - `README.md`
  - `src/App.tsx`
  - `src/components/TableEditor.tsx`
  - `src/components/TableList.tsx`
  - `src/main.tsx`
  - `src/owlbear.ts`
  - `src/types.ts`
  - `src/utils/loot.ts`
  - `src/utils/storage.ts`
  - `src/index.css`
- décisions prises :
  - Conserver une logique de stockage local mais cloisonnée par système de jeu
  - Centraliser import/export dans une seule modal pour réduire la complexité perçue
  - Garder un CSV simple et explicite, avec colonnes dépendantes du système
- problèmes restants :
  - Vérifier en tests utilisateurs la compréhension du changement de système (risque de confusion si les tables “disparaissent” lors d’un switch)
  - Continuer le polish visuel final dans le popover Owlbear

### Session du 2026-03-25
- sujets traités :
  - Intégration i18n complète (provider + dictionnaires FR/EN + branchement UI)
  - Ajout du mapping des termes de jeu selon système/langue
  - Évolution du roll vers des bornes min/max (niveau, quantité, valeur cuivre)
  - Ajout de modes de probabilité supplémentaires
  - Ajout des bornes automatiques calculées depuis la table + saisie manuelle inline des min/max
  - Mise à jour de la documentation utilisateur et du contexte projet
- fichiers modifiés :
  - `PROJECT_CONTEXT.md`
  - `README.md`
  - `src/App.tsx`
  - `src/components/ResultDialog.tsx`
  - `src/components/RollDialog.tsx`
  - `src/components/SharedGainPage.tsx`
  - `src/components/TableEditor.tsx`
  - `src/components/TableList.tsx`
  - `src/i18n/index.tsx`
  - `src/i18n/gameTerms.ts`
  - `src/i18n/locales/fr.ts`
  - `src/i18n/locales/en.ts`
  - `src/index.css`
  - `src/main.tsx`
  - `src/owlbear.ts`
  - `src/types.ts`
  - `src/utils/loot.ts`
  - `src/utils/storage.ts`
- décisions prises :
  - Conserver FR comme langue par défaut, avec bascule utilisateur explicite vers EN
  - Garder les bornes automatiques du roll comme valeur de départ, tout en autorisant un override manuel précis
  - Continuer à privilégier des itérations UI localisées sans refonte globale
- problèmes restants :
  - Finaliser la relecture terminologique FR/EN sur quelques libellés métier
  - Confirmer en usage Owlbear réel le confort du roll avancé sur petits popovers

### Session du 2026-03-26
- sujets traités :
  - Déplacement des sélecteurs système/langue vers une modal Paramètres accessible via un bouton engrenage
  - Remplacement des drapeaux emoji par de vraies icônes de drapeau SVG dans les boutons de langue
  - Ajout d’une barre d’actions flottante en édition de table (Enregistrer / Annuler)
  - Ajout d’un bouton de remontée rapide en haut de page dans l’éditeur
  - Traduction des devises à l’affichage selon langue active (FR/EN)
  - Restriction des devises proposées selon système de jeu (PF2E sans pe/ep)
  - Reconnaissance directe des valeurs EN dans import/collage (category/rarity/type/currency)
  - Normalisation des catégories doublons “Arme/Armes” et “Armure/Armures” vers pluriel
  - Renforcement du collage multiple pour accepter tabulation, `;`, `,`
  - Correction d’affichage EN des catégories dans `RollDialog` via le mapping centralisé `gameTerms`
  - Harmonisation de la logique de traduction : `RollDialog` référence désormais la même source que `TableList` / `TableEditor` (pas de mapping local dupliqué)
  - Amélioration de la robustesse du mapping de `gameTerms` (comparaison tolérante aux accents / apostrophes / séparateurs) pour mieux couvrir les variantes importées
  - Ajustement de l’aperçu de valeur dans `RollDialog` : affichage en équivalences complètes (`pp / po / pe / pa` en DND5E, `pp / po / pa` en PF2E) au lieu d’une décomposition additive
- fichiers modifiés :
  - `PROJECT_CONTEXT.md`
  - `src/App.tsx`
  - `src/components/TableEditor.tsx`
  - `src/components/TableList.tsx`
  - `src/components/ResultDialog.tsx`
  - `src/components/SharedGainPage.tsx`
  - `src/components/RollDialog.tsx`
  - `src/i18n/locales/fr.ts`
  - `src/i18n/locales/en.ts`
  - `src/i18n/gameTerms.ts`
  - `src/assets/flag-fr.svg`
  - `src/assets/flag-gb.svg`
  - `src/utils/storage.ts`
- décisions prises :
  - Conserver les préférences de système/langue dans une modal dédiée pour alléger la barre d’actions principale
  - Utiliser des drapeaux SVG pour garantir un rendu cohérent des icônes de langue selon OS/navigateurs
  - Garder les actions critiques d’édition toujours visibles pour éviter les validations ratées en bas de page
- problèmes restants :
  - Vérifier en conditions Owlbear réelles que la barre flottante n’empiète pas sur certaines zones interactives
  - Ajuster au besoin l’espacement mobile/popover très étroit si overlap sur petits écrans
  - Garder un format canonique interne FR pour les données, tout en acceptant la saisie/import EN en entrée
  - Normaliser les catégories arme/armure en pluriel pour éviter les doublons visuels et de tri
  - Rendre le collage plus permissif sans casser le format tabulé initial
- problèmes restants :
  - Vérifier en import utilisateurs réels des fichiers CSV hétérogènes (quoting, accents, colonnes partiellement traduites)
  - Continuer la validation Owlbear réelle (popover + overlays flottants) sur diverses tailles d’écran

  ### Session du 2026-03-27
- sujets traités :
  - Livraison du lot multi-systèmes PF2E/DND5E (modèle de données + stockage + adaptation UI)
  - Intégration i18n FR/EN (provider, locales, mapping des termes métier)
  - Refonte import/export (modal unifiée, CSV adaptés par système, normalisation FR/EN, collage multi-séparateurs)
  - Évolution du roll avancé (bornes min/max niveau/quantité/valeur, sliders, champs manuels, modes étendus)
  - Stabilisation UI Owlbear (mesure de largeur utile + redimensionnement dynamique popover)
- fichiers modifiés :
  - `src/App.tsx`
  - `src/components/TableList.tsx`
  - `src/components/TableEditor.tsx`
  - `src/components/RollDialog.tsx`
  - `src/components/ResultDialog.tsx`
  - `src/components/SharedGainPage.tsx`
  - `src/utils/storage.ts`
  - `src/utils/loot.ts`
  - `src/types.ts`
  - `src/i18n/index.tsx`
  - `src/i18n/gameTerms.ts`
  - `src/i18n/locales/fr.ts`
  - `src/i18n/locales/en.ts`
  - `src/owlbear.ts`
  - `src/main.tsx`
  - `src/index.css`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- décisions prises :
  - Garder les données de tables en local, séparées par système de jeu
  - Centraliser les transferts (import/export) dans une modal dédiée pour simplifier le flux utilisateur
  - Conserver l’approche itérative sur le layout Owlbear (ajustements ciblés plutôt que refonte)
- points de vigilance :
  - Vérifier avec des fichiers utilisateurs réels la robustesse de la normalisation FR/EN (catégories, raretés, types, devises)
  - Continuer la validation du rendu popover en situation Owlbear réelle (tailles et densités variées)

  ### Session du 2026-03-28
- sujets traités :
  - Correction du sens de pondération des probabilités DND5E dans `utils/loot` pour réaligner les modes low/high avec leur intention fonctionnelle
  - Recalibrage des puissances DND5E (`soft`/`strong`) pour conserver une différence de comportement lisible en utilisation réelle
  - Mise à jour de la documentation projet/utilisateur en conservant la structure existante des documents
- fichiers modifiés :
  - `src/utils/loot.ts`
  - `README.md`
  - `PROJECT_CONTEXT.md`
- décisions prises :
  - Conserver le modèle de probabilité existant mais corriger uniquement la direction des distances de rareté côté DND5E
  - Garder une mise à jour documentaire incrémentale, sans réorganisation lourde des sections déjà en place
- points de vigilance :
  - Revalider en test manuel les modes “raretés basses” / “raretés hautes” en DND5E pour confirmer le ressenti attendu
  - Continuer à documenter les changements par date dans ce journal pour faciliter les reprises de contexte

## Règles à respecter
- Toujours donner le fichier complet patcher.
- Ne pas repartir de zéro ni proposer une refonte totale sans raison.
- Conserver les décisions validées ci-dessus.
- Prioriser les correctifs ciblés et concrets.
- Vérifier que les changements ne cassent pas la logique Owlbear déjà fonctionnelle.
- Ne pas remettre en question le choix de stockage local des tables.
- Penser à la compatibilité MJ / joueurs à chaque changement d’UI.

## Prompt de reprise recommandé
À coller au début d’un nouveau chat :

Contexte : lis le PROJECT_CONTEXT.md ci-dessous comme source principale de vérité.
Je veux reprendre le projet sans repartir de zéro.
Considère que les décisions techniques déjà notées sont validées.
Aide-moi de façon concrète et incrémentale, en évitant les refontes inutiles.
Le dernier sujet ouvert est la stabilisation de l’interface principale du popover Owlbear (largeur réelle, scroll global, fond principal), sans casser les fonctionnalités déjà en place.
