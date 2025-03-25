<?php

$finder = (new TwigCsFixer\File\Finder())
    ->in(__DIR__.'/../templates')
;

$ruleset = new TwigCsFixer\Ruleset\Ruleset();
$ruleset->addStandard(new TwigCsFixer\Standard\TwigCsFixer());

$ruleset->overrideRule(new TwigCsFixer\Rules\Punctuation\PunctuationSpacingRule(
    ['}' => 1],
    ['{' => 1],
));

$config = new TwigCsFixer\Config\Config();
$config->setRuleset($ruleset)
       ->setCacheFile(".cache/.twig-cs-fixer.cache")
       ->setFinder($finder)
;

return $config;