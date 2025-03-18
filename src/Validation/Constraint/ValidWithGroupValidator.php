<?php

declare(strict_types=1);

namespace Darkirby\DsfrBundle\Validation\Constraint;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class ValidWithGroupValidator extends ConstraintValidator
{
    public function validate(mixed $value, Constraint $constraint): void
    {
        if (!$constraint instanceof ValidWithGroup) {
            throw new UnexpectedTypeException($constraint, __NAMESPACE__ . '\ValidWithGroup');
        }

        // Si c'est null, on ignore car il n'y a aucune validation à déclencher
        if (null === $value) {
            return;
        }

        $this->context->getValidator()->inContext($this->context)->validate($value, groups: $constraint->getTrigger());
    }
}
