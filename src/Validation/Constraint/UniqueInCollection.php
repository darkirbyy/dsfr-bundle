<?php

declare(strict_types=1);

namespace App\Validation\Constraint;

use Symfony\Component\Validator\Constraint;

/**
 *  On aimerait utiliser  #[Assert\Unique(fields: ['xxx'])] mais Unique ne marche pas avec des collections d'objets...
 *  De plus la contrainte UniqueEntity n'est pas suffisante avec une collection car elle n'est vérifié que contre les éléments déjà en base.
 *  Enfin le UniqueConstraint ne permet pas d'avoir une erreur sur le formulaire mais juste une exception Doctrine !
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_METHOD | \Attribute::IS_REPEATABLE)]
class UniqueInCollection extends Constraint
{
    public function __construct(
        array $groups = [Constraint::DEFAULT_GROUP],
        protected string $message = 'Cet élément est déjà présent dans la collection.',
        protected string $idPath = 'id',
        protected string $errorPath = '',
    ) {
        parent::__construct(groups: $groups);
    }

    public function getIdPath(): string
    {
        return $this->idPath;
    }

    public function getErrorPath(): string
    {
        return $this->errorPath;
    }

    public function getMessage(): string
    {
        return $this->message;
    }
}
