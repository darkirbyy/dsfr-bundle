<?php

declare(strict_types=1);

namespace Darkirby\DsfrBundle\Extension;

use Symfony\Component\PropertyAccess\PropertyAccessorInterface;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

class TwigExtension extends AbstractExtension
{
    public function __construct(private PropertyAccessorInterface $propertyAccessor) {}

    public function getFunctions(): array
    {
        return [new TwigFunction('html_attributes', [$this, 'getHtmlAttributes'], ['is_safe' => ['html']]), new TwigFunction('deep_attribute', [$this, 'getDeepAttribute'])];
    }

    public function getHtmlAttributes(array $attributes)
    {
        if (empty($attributes)) {
            return '';
        }

        $compiled = join('="%s" ', array_keys($attributes)) . '="%s"';

        return vsprintf($compiled, array_map('htmlspecialchars', array_values($attributes)));
    }

    public function getDeepAttribute($object, string $path)
    {
        if (null === $object || '' === $path) {
            return null;
        }

        if ($this->propertyAccessor->isReadable($object, $path)) {
            return $this->propertyAccessor->getValue($object, $path);
        }

        return null;
    }
}
