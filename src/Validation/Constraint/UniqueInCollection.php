<?php

declare(strict_types=1);

namespace Darkirby\DsfrBundle\Validation\Constraint;

use Symfony\Component\Validator\Constraint;

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
