# Tomselect

## Dépendances

Il faut avoir ajouté `tom-select` à l'import-map via :

```sh
symfony console importmap:require tom-select
```

## Installation

Pour intégrer le css et le controller stimulus au projet, ajouter les imports suivant :

- dans `app.js` pour le css

    ```js
    // assets/app.js
    import '../vendor/darkirby/dsfr-bundle/assets/styles/tomselect.css';
    ```

- dans `bootstrap.js` pour le controller stimulus

    ```js
    // assets/bootstrap.js
    [...]
    import TomselectController from '../vendor/darkirby/dsfr-bundle/assets/controllers/tomselect-controller.js';

    [...]
    app.register('tomselect', TomselectController);
    ```

## Utilisation
