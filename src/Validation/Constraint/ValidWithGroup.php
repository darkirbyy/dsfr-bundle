<?php

declare(strict_types=1);

namespace Darkirby\DsfrBundle\Validation\Constraint;

use Symfony\Component\Validator\Constraint;

/**
 * La contrainte #[Assert\Valid] se comporte bizarrement par rapport aux groupes de validation.
 * Cette contrainte permet de choisir quels groupes de validation sur l'entité mère déclenche la contrainte,
 * et quels groupes sont vérifiés sur l'entité fille.
 */
#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_METHOD)]
class ValidWithGroup extends Constraint
{
    public function __construct(array $groups = [Constraint::DEFAULT_GROUP], protected array $trigger = [Constraint::DEFAULT_GROUP])
    {
        parent::__construct(groups: $groups);
    }

    public function getTrigger(): array
    {
        return $this->trigger;
    }
}
