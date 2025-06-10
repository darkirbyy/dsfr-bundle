<?php

declare(strict_types=1);

namespace Darkirby\DsfrBundle\Validation\Constraint;

use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\ConstraintValidator;
use Symfony\Component\Validator\Exception\UnexpectedTypeException;

class UniqueInCollectionValidator extends ConstraintValidator
{
    public function validate($collection, Constraint $constraint): void
    {
        // Vérifiez que la contrainte est bien du type UniqueInCollection
        if (!$constraint instanceof UniqueInCollection) {
            throw new UnexpectedTypeException($constraint, __NAMESPACE__ . '\UniqueInCollection');
        }

        // Si la collection n'est pas iterable, la validation ne peut pas s'appliquer
        if (!is_iterable($collection)) {
            return;
        }

        // On parcourt tous les éléments, on récupère l'id de l'entité ou d'une sous-entité
        // et on vérifie qu'on obtient jamais deux fois la même
        $ids = [];
        foreach ($collection as $index => $item) {
            $id = $this->getIdFromPath($item, $constraint->getIdPath());

            if (isset($ids[$id])) {
                $this->context
                    ->buildViolation($constraint->getMessage())
                    ->atPath('[' . $index . '].' . $constraint->getErrorPath())
                    ->addViolation();
            } else {
                $ids[$id] = true;
            }
        }
    }

    /**
     * Récupère l'ID d'un élément en suivant le chemin spécifié (par exemple "eleve.id" revient à getEleve()->getId()).
     */
    private function getIdFromPath($item, string $path)
    {
        $parts = explode('.', $path);
        foreach ($parts as $part) {
            $getter = 'get' . ucfirst($part);
            if (is_object($item) && method_exists($item, $getter)) {
                $item = $item->$getter();
            } else {
                return null;
            }
        }

        return $item;
    }
}
