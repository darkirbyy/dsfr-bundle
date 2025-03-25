# Bundle DSFR

Bundle contenant des ressources utiles pour un projet DSFR.

## Pré-requis

- Back-end:
  - **PHP**: 8.1
  - **Composer**: >= 2.8 pour la gestion des dépendances
- Front-end:
  - **Node.js**: 18.x pour le DSFR
  - **npm**: >= 9.2 pour la gestion des dépendances
- Sources : **git**

## Installation

Après avoir cloné le bundle, installer les dépendances avec `composer install` et `npm install`.

Pour utiliser le git hook : `git config core.hooksPath ./githooks`. Le git hook exécute le passage du prettier + linter avant commit.

## Utilisation

Dans un projet Symfony :

- ajouter dans `composer.json` :

    ```json
    "repositories": [
            {"type": "git", "url": "https://github.com/darkirbyy/dsfr-bundle.git"}
        ]
    ```

- exécuter `composer require darkirby/dsfr-bundle:dev-main`.

:warning: Le projet Symfony doit utiliser le DSFR via Node (via `npm install @gouvfr/dsfr`).

Pour pouvoir utiliser les assets du bundle, il faut ajouter la configuration suivante dans `asset_mapper.yaml` :

```yaml
# config/packages/asset_mapper.yaml
framework:
    asset_mapper:
        paths:
           [...]
            - vendor/darkirby/dsfr-bundle/assets/
```

Consulter la documentations dans le dossier `docs`. Le bundle propose :

- une intégration de Datatable avec le DSFR : [datatable](docs/datatable.md)
- une intégration de Tomselect avec le DSFR : [tomselect](docs/tomselect.md)
- des contraintes de validation custom étendant celles de Symfony : [validation](docs/validation.md)
