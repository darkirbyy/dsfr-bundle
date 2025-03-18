# Datatable

## Dépendances

Il faut avoir ajouté `datatables.net-dt` à l'import-map via :

```sh
symfony console importmap:require datatables.net-dt
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
    app.register('datatable', DatatableController);
    ```

## Utilisation

Le fichier qui inclut datatable doit définir les variables suivantes :

- **objects**: *array* (OBLIGATOIRE) doit contenir tous les données de la table sous la forme d'un array d'objet

- **customFilePath**: *string* (optionnel) chemin du ficher twig qui contient les blocks customs (voir plus bas)

- **datatableOptions** qui définit les options globales du tableau. Il peut-être omis pour utiliser toutes les options par défaut. Sinon, il peut contenir les clés suivantes :
  - **paging**: *bool* (optionnel, défaut true) Active ou non la pagination
  - **pagingLength**: *int* (optionnel, défaut 50) Nombre de lignes par page
  - **searching**: *bool* (optionnel, défaut true) Active ou non la zone de recherche
  - **searchingLive**: *bool* (optionnel, défaut true) Active ou non la recherche live, dès que l'utilisateur tape dans la zone de recherche
  - **searchingLiveDelay**: *int* (optionnel, défaut true) Délai en millisecondes avant de déclencher une recherche live

- **datatableColumns** est un *array d'array*, dont chaque élément définit une colonne du tableau. Chaque ligne peut contenir les clés suivantes :
  - **property**: *string* (OBLIGATOIRE) quelle propriété de l'objet doit être affichée. Peut être une sous propriété (exemple adresse.ville).
  - **label**: *string* (OBLIGATOIRE) nom de la colonne à afficher dans l'en-tête.
  - **visible**: *bool* (optionnel, défaut false) la colonne doit-elle être visible ?
  - **searchable**: *bool* (optionnel, défaut false) la colonne doit-elle être cherchable ?
  - **searchProperty**: *string* (optionnel, défaut null) quelle propriété de l'objet doit être utiliser pour la recherche (exemple identite.nomComplet si on utilise on nom abrégé pour l'affichage)
  - **sortable**: *bool* (optionnel, défaut false) la colonne doit-elle être triable ?
  - **sortProperty**: *string* (optionnel, défaut null) quelle propriété de l'objet doit être utiliser pour le tri (exemple date.timestamp si on formate la date autrement)
  - **sortInit**: *asc*|desc|none (optionnel, défaut none) la colonne doit-elle être triée par défaut ? Attention, ne doit être placé que sur une seule colonne
  - **filtrable**: *bool* (optionnel, défaut false) la colonne doit-elle être filtrable ?
  - **filterChoices**: *array[string]* (OBLIGATOIRE si filtrable est vrai) les différents choix de filtrage
  - **filterType**: *checkbox|radio* (optionnel, défaut checkbox) filtrage avec choix unique (radio buttons) ou multiple (checbox buttons)
  - **filterInit**: *array[string]* (optionnel, défaut []) état initial du filtrage, dépend de filterType
    - si filterType = 'checkbox', tous les choix sont cochés par défaut, mais ceux dans filterInit sont décochés
    - si filterType = 'radio', filterInit ne doit contenir qu'une valeur qui sera celle cochée par défaut
  - **custom**: *bool* (optionnel, défaut false) dans ce cas, toutes les autres options sont ignorées et property est le nom du block à insérer, qui a accès à l'objet de la ligne courante dans la variable object

Exemple :

```twig
{% set objects = personnes %}

{% set datatableOptions = {
    paging: true,
    pagingLength: 30,
    searching: true,
    searchingLive: false,
} %}

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
