<?php

declare(strict_types=1);

namespace App\Validation\Constraint;

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

        // Ignore null values, as there is nothing to cascade validation to
        if (null === $value) {
            return;
        }

        $this->context->getValidator()->inContext($this->context)->validate($value, groups: $constraint->getTrigger());
    }
}
