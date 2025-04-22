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

Dans un FormType, ajouter les attributs suivants dans le `attr` des options d'un champ :

```php
'data-controller' => 'tomselect',
'data-tomselect-options-value' => json_encode([
    'create' => true,
    ...
]),
```

L'attribut `data-tomselect-options-value` peut-être omis pour utiliser toutes les options par défaut. Sinon, il peut contenir les clés suivantes :

- **number**: *int* (optionnel, défaut 10) Nombres d'options à afficher dans le menu déroulant
- **multiple**: *bool* (optionnel, défaut false) Champ à sélection multiple ou non
- **create**: *bool* (optionnel, défaut false) Autorise l'utilisateur à créer ces propres valeurs

Exemple :

```php
 ->add('personne', EntityType::class, [
        'required' => true,
        'class' => Personne::class,
        'label' => 'Choisir une personne',    
        'attr' => [
            'data-controller' => 'tomselect',
            'data-tomselect-options-value' => json_encode([
                'number' => 20,
                'multiple' => true,
                'create' => false,
            ]),
        ]
        'placeholder' => 'Taper les premières lettres du nom/prénom',
    ])
```
