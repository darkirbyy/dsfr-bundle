<?php

declare(strict_types=1);

namespace Darkirby\DsfrBundle\Validation\Constraint;

use Symfony\Component\Validator\Constraint;

#[\Attribute(\Attribute::TARGET_PROPERTY | \Attribute::TARGET_METHOD | \Attribute::IS_REPEATABLE)]
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
