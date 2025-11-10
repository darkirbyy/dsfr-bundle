# Datatable

## Dépendances

Il faut avoir ajouté les dépendances suivantes à l'import-map via :

```sh
symfony console importmap:require datatables.net-dt datatables.net-buttons datatables.net-buttons/js/buttons.html5 pdfmake
```

## Installation

Pour intégrer le css et le controller stimulus au projet, ajouter les imports suivant :

- dans `app.js` pour le css

    ```js
    // assets/app.js
    import '../vendor/darkirby/dsfr-bundle/assets/styles/datatable.css';
    ```

- dans `bootstrap.js` pour le controller stimulus

    ```js
    // assets/bootstrap.js
    [...]
    import DatatableController from '../vendor/darkirby/dsfr-bundle/assets/controllers/datatable-controller.js';

    [...]
    app.register('global--datatable', DatatableController);
    ```

- dans `services.yaml` pour les fonctions Twig :

    ```yaml
        Darkirby\DsfrBundle\Extension\TwigExtension:
            tags:
                - { name: twig.extension }
    ```

## Utilisation

Le fichier qui inclut datatable peut définir les variables suivantes :

- **datatableOptions** *array* (OBLIGATOIRE) définit les options globales du tableau. Il peut contenir les clés suivantes :
  - **id**: *string* (OBLIGATOIRE) identifiant unique du tableau
  - **paging**: *bool* (optionnel, défaut true) Active ou non la pagination
  - **pagingLength**: *int* (optionnel, défaut 50) Nombre de lignes par page
  - **selecting**: *bool* (optionnel, défaut false) Active ou non la colonne de sélection des lignes
  - **selectingProperty**: *string* (optionnel, défaut 'id') La propriété de l'objet à stocker lors de la sélection d'une ligne
  - **searching**: *bool* (optionnel, défaut true) Active ou non la zone de recherche
  - **searchingLive**: *bool* (optionnel, défaut true) Active ou non la recherche live, dès que l'utilisateur tape dans la zone de recherche
  - **searchingLiveDelay**: *int* (optionnel, défaut true) Délai en millisecondes avant de déclencher une recherche live
  - **exporting**: *bool* (optionnel, défaut true) Active ou non l'export pdf/csv
  - **exportingName**: *string* (optionnel, défaut 'Export') Nom des fichiers exportés
  - **exportingLandscape**: *bool* (optionnel, défaut false) Exporter en format paysage si oui, sinon en format portrait
  - **exportingStretch**: *bool* (optionnel, défaut true) Étendre la taille des colonnes pour remplir toute la largeur de la page

Il y a deux méthodes pour générer le `thead` et le `tbody` du tableau : en définissant les colonnes, ou en définissant le contenu à la main.

### En définissant les colonnes

On rajoute les variables suivantes :

- **datatableObjects**: *array* (OBLIGATOIRE) doit contenir tous les données de la table sous la forme d'un array d'objet

- **datatableCustom** *array* (OBLIGATOIRE si custom = true pour une des colonnes, voir plus bas) définit les paramètres des colonnes custom. Il peut contenir les clés suivantes :
  - **filePath**: *string* (OBLIGATOIRE) chemin du ficher twig qui contient les blocks customs
  - **param**: *array* (optionnel) paramètres supplémentaire à envoyer aux blocs customs
<!-- - **attributeMode** : *normal|deep* (optionnel, défaut normal) utiliser 'deep' pour accéder à des sous propriétés (par exemple 'ville.adresse.rue'), mais plus lent -->

- **datatableColumns** est un *array d'array*, dont chaque élément définit une colonne du tableau. Chaque ligne peut contenir les clés suivantes :
  - **property**: *string* (OBLIGATOIRE) quelle propriété de l'objet doit être affichée. Peut être une sous propriété (exemple adresse.ville).
  - **label**: *string* (OBLIGATOIRE) nom de la colonne à afficher dans l'en-tête.
  - **tooltip**: *string* (optionnel) texte de description supplémentaire qui s'affichera en infobulle
  - **class**: *string* (optionnel) classes CSS à rajouter à l'en-tête de colonne.
  - **custom**: *bool* (optionnel, défaut false) dans ce cas, property est le nom d'un bloc à insérer puis le **filePath**, le bloc ayant accès à : object (= l'objet de la ligne courante) et param
  - **visible**: *bool* (optionnel, défaut false) la colonne doit-elle être visible ?
  - **exportable**: *bool* (optionnel, défaut true) la colonne doit-elle être affichée dans les exports csv/pdf ?
  - **exportProperty**: *string* (optionnel, défaut null) quelle propriété de l'objet doit être utiliser pour l'export (exemple statut.libelle si on formate le statut avec des tags/badges etc)
  - **searchable**: *bool* (optionnel, défaut false) la colonne doit-elle être cherchable ?
  - **sortable**: *bool* (optionnel, défaut false) la colonne doit-elle être triable ?
  - **sortProperty**: *string* (optionnel, défaut null) quelle propriété de l'objet doit être utiliser pour le tri (exemple date.timestamp si on formate la date autrement)
  - **sortInit**: *asc|desc|none* (optionnel, défaut none) la colonne doit-elle être triée par défaut ? Attention, ne doit être placé que sur une seule colonne
  - **filtrable**: *bool* (optionnel, défaut false) la colonne doit-elle être filtrable ?
  - **filterProperty**: *string* (optionnel, défaut null) quelle propriété de l'objet doit être utiliser pour le filtrage (exemple statut.libelle si on formate le statut avec des tags/badges etc)
  - **filterType**: *checkbox|radio* (optionnel, défaut checkbox) filtrage avec choix unique (radio buttons) ou multiple (checbox buttons)
  - **filterMode**: *normal|range* (optionnel, défaut normal) filtrage par égalité de valeur ou par appartenance à un intervalle
  - **filterChoices**: *array[array]* (OBLIGATOIRE si filtrable est vrai) les différents choix de filtrage, dont chaque élément est un aray contenant :
    - **label** : *string* (OBLIGATOIRE) : le libellé à afficher
    - **value** : *string* (OBLIGATOIRE si filterMode = 'normal') : la valeur à comparer
    - **valueMin** : *string* (OBLIGATOIRE si filterMode = 'range') : la borne inférieure à comparer
    - **valueMax** : *string* (OBLIGATOIRE si filterMode = 'range') : la borne supérieure à comparer
  - **filterInit**: *array[string]* (optionnel, défaut []) état initial du filtrage, doit contenir les labels des filterChoices à activer. Si laissé vide :
    - si filterType = 'checkbox', tous les choix sont cochés par défaut
    - si filterType = 'radio', le premier choix est coché par d"faut

### En définissant le contenu

On rajoute une variable **datatableContent** qui contient le html brut avec les balises `thead` et le `tbody`. Pour s'intégrer avec le controller stimulus, les cellules d'en-tête doivent avoir deux attributs :

- `data-global--datatable-column="x"` où **x** est un nombre qui décrit le positionnement de la colonne (0, 1, 2, ...)
- `data-global--datatable-target="visible exportable searchable sortable"` où l'on peut choisir une ou plusieurs des possibilités

## Exemples

### En définissant par colonnes

```twig
{% set datatableObjects = personnes %}

{% set datatableOptions = {
    paging: true,
    pagingLength: 30,
    searching: true,
    searchingLive: false,
    searchingLiveDelay: 300,
    exporting: true,
    exportingName: 'Listes des personnes',
} %}

{% set datatableCustom = { filePath: 'personne/colonne.html.twig' } %}

{% set datatableColumns = [
    { property: 'lieu.nom', label: 'Lieu', sortable: true },
    { property: 'nom', label: 'Nom', searchable: true, sortable: true, sortInit: 'asc' },
    { property: 'prenom', label: 'Prénom', searchable: true, sortable: true },
    { property: 'dateNaissanceFormat', label: 'Date de naissance', sortable: true, sortProperty: 'dateNaissance.timestamp' },
    { property: 'statut.toString', label: 'Statut', filtrable: true, filterChoices: ['En cours', 'Attente', 'Fini'], filterType: 'radio' },
    { property: 'action_column', label: 'Actions', custom: true },
] %}

{{ include('@DarkirbyDsfr/component/datatable.html.twig') }}
```

### En définissant par contenu

```twig
{% set datatableOptions = {
    paging: true,
    pagingLength: 10,
} %}

{% set datatableContent %}
    <thead>
        <tr>
            <th scope="col" data-global--datatable-target="visible exportable searchable" data-global--datatable-column="0">Nom</th>
            <th scope="col" data-global--datatable-target="visible exportable searchable" data-global--datatable-column="1">Prénom</th>
            <th scope="col" data-global--datatable-target="visible exportable" data-global--datatable-column="2">Lieu</th>
            <th scope="col" data-global--datatable-target="visible" data-global--datatable-column="3">Actions</th>
        </tr>
    </thead>
    <tbody>
        <tr data-row-key="1">
            <td>Jean</td>
            <td>Dupont</td>
            <td>Paris</td>
            <td>Bouton d'action</td>
        </tr>
    ...
    </tbody>
{% endset %}
```
