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
    app.register('global--tomselect', TomselectController);
    ```

## Utilisation

Dans un FormType, ajouter les attributs suivants dans le `attr` des options d'un champ :

```php
'data-controller' => 'global--tomselect',
'data-global--tomselect-options-value' => json_encode([
    'create' => true,
    ...
]),
```

L'attribut `data-global--tomselect-options-value` peut-être omis pour utiliser toutes les options par défaut. Sinon, il peut contenir les clés suivantes :

- **backspace**: *bool* (optionnel, défaut true) Si vrai, l'utilisateur peut supprimer des options avec la touche "Retour arrière", sinon un bouton pour vider le champ s'affiche toute à droite
- **number**: *int|null* (optionnel, défaut null) Nombres d'options à afficher dans le menu déroulant, null = toutes
- **multiple**: *bool* (optionnel, défaut false) Champ à sélection multiple ou non
- **create**: *bool* (optionnel, défaut false) Autorise l'utilisateur à créer ces propres valeurs
- **autoopen**: *bool* (optionnel, défaut false) Ouvre automatiquement le dropdown avec les différents choix
- **url**: *string* (optionnel, défaut null) Si vide, toutes les options doivent être préchargées avec la page. Sinon, les options seront chargés dynamiquement via un appel AJAX sur l'URL spécifiée dès qu'au moins 3 caractères sont saisis : celle-ci reçoit un query parameter `search` égal à la valeur saisie par l'utilisateur et doit renvoyer les options possibles sous forme d'un JSON dont chaque option est un table avec les clés `value` et `text`.
- **delay**: *int* (optionnel, défaut 500) Si les options sont dynamiquement chargés (voir **url**), temps d'attente en millisecondes avant d'envoyer une nouvelle requête au serveur

## Exemples

Exemple sans chargement dynamique : les 5 meilleures options s'affichent (même si plus correspondent), l'utilisateur peut en choisir plusieurs mais ne peut pas en créer.

```php
 ->add('personne', EntityType::class, [
        'required' => true,
        'class' => Personne::class,
        'label' => 'Choisir une personne',    
        'placeholder' => 'Taper les premières lettres du nom/prénom',
        'attr' => [
            'data-controller' => 'global--tomselect',
            'data-global--tomselect-options-value' => json_encode([
                'number' => 5,
                'multiple' => true,
                'create' => false,
            ]),
        ]
    ])
```

Exemple avec chargement dynamique : les options sont renvoyées par le serveur par la route `personne_search`, 200 millisecondes après saisie par l'utilisateur.

```php
 ->add('personne', ChoiceType::class, [
        'required' => true,
        'class' => Personne::class,
        'label' => 'Choisir une personne',
        'placeholder' => 'Taper les premières lettres du nom/prénom',    
        'attr' => [
            'data-controller' => 'global--tomselect',
            'data-global--tomselect-options-value' => json_encode([
                'url' => $this->urlGenerator->generate('personne_search'),
                'delay' => 200,
            ]),
        ]
    ])
```

Note pour le chargement dynamique :

- On peut autowire `UrlGeneratorInterface` pour construire automatiquement l'URL d'une route donnée et rester ainsi consistant avec le fonctionnement de Symfony

- Voici un exemple PHP de la route de recherche, qui renvoie un JSON :

    ```php
    #[Route('/search', name: 'personne_search')]
    public function search(Request $request): JsonResponse
    {
        $search = $request->query->getString('search');
        $data = [];

        // Traitement pour calculer les données

        return new JsonResponse($data);
    }
    ```

- Si on utilise un `EntityType` ou un `ChoiceType`, il est préférable de rajouter `'choices' => []` dans les options afin d'éviter que Symfony ne charge toutes les options (ce qui contredirait le principe d'un chargement asynchrone). Mais dans ce cas, le champ ne passe pas la validation. On peut s'inspirer de ce code pour gérer cette situation.

    ```php
    $builder->addEventListener(FormEvents::PRE_SUBMIT, function (FormEvent $event) {
        $data = $event->getData();
        $form = $event->getForm();
        
        // On vérifie que personne est dans les données soumises et on met le choix dans le champ
        if (!empty($data['personne'])) { 
            $options = $form->get('personne')->getConfig()->getOptions();                  
            $personne = $this->personneRepo->find($data['personne']);
            $options['choices'] = [$personne];
            $form->add('personne', EntityType::class, $options);
            
        }
     });
    ```
