# Bundle DSFR

Bundle contenant des ressources utiles pour un projet DSFR.

## Dépendances

TODO : dépendance dsfr via node

## Installation

Pour pouvoir utiliser les assets du bundle, il faut ajouter le chemin dans `asset_mapper.yaml` :

```yaml
# config/packages/asset_mapper.yaml
framework:
    asset_mapper:
        paths:
           [...]
            - vendor/darkirby/dsfr-bundle/assets/
```

## Utilisation

Consulter la documentations dans le dossier `docs`. Le bundle propose :

- une intégration de Datatable avec le DSFR : [datatable](docs/datatable.md)
- des contraintes de validation étendant celle de Symfony : [validation](docs/validation.md)
