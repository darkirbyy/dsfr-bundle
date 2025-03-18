# Validation

## Dépendances

Aucune

## Installation

Ajouter une ligne d'import au début du fichier php :

```php
use Darkirby\DsfrBundle\Validation\Constraint as AssertCustom;
```

## Utilisation

### Contraintes

- La contrainte de Symfony `#[Assert\Valid]` se comporte bizarrement par rapport aux groupes de validation...

  La contrainte `#[Assert\ValidWithGroup]` permet de choisir quels groupes de validation sur l'entité mère déclenche la contrainte, et quels groupes sont vérifiés sur l'entité fille. Les paramètres sont :
  - `$groups` : *array[string]* (optionnel, défaut `['Default']`) : quels groupes sur l'entité mère déclenche cette validation
  - `$triggers` : *array[string]* (optionnel, défaut `['Default']`) : quels groupes sont à déclencher sur l'entité fille

- La contrainte de Symfony `#[Assert\Unique(fields: ['xxx'])]` ne marche pas avec des collections d'objets... De plus la contrainte UniqueEntity n'est pas suffisante avec une collection car elle n'est vérifié que contre les éléments déjà en base. Enfin le UniqueConstraint ne permet pas d'avoir une erreur sur le formulaire mais juste une exception Doctrine !

  La contrainte `#[Assert\UniqueInCollection]` permet de vérifier l'unicité d'une collection d'entité. Les paramètres sont :
  - `$groups` : *array[string]* (optionnel, défaut `['Default']`) : quels groupes déclenche cette validation
  - `$idPath` : *string* (optionnel, défaut `'id'`) : quelle propriété ou sous-propriété doit être vérifiée comme unique. Le point est utilisé pour accéder à une sous-propriété, par exemple `contact.id`.
  - `$errorPath` : *string* (optionnel, défaut `''`) : quelle propriété ou sous-propriété doit être mise en erreur dans le formulaire. Avec l'exemple suivant : `contact`.
  - `$errorPath` : *string* (optionnel, défaut `Cet élément est déjà présent dans la collection.`) : quel message d'erreur afficher en cas de violation.
