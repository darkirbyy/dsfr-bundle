<?php

declare(strict_types=1);

namespace Darkirby\DsfrBundle\Service;

use Doctrine\DBAL\Exception\ForeignKeyConstraintViolationException;
use Doctrine\DBAL\Exception\NotNullConstraintViolationException;
use Doctrine\DBAL\Exception\UniqueConstraintViolationException;
use Exception;
use Psr\Log\LoggerInterface;

/**
 * Service qui gère les exceptions quand elle sont catch (pour affichage flash + logging).
 */
class ExceptionManager
{
    public function __construct(private LoggerInterface $logger)
    {
    }

    /**
     * Log les exceptions qui ont été catch pour garder trace.
     */
    public function handle(\Exception $exception): void
    {
        $this->logger->error($exception->getMessage());
    }

    /**
     * Récupère une exception après transaction sur une base de données et renvoie un message d'erreur clair pour l'utilisateur.
     *
     * @param \Exception $exception une exception de type DatabaseException ou ConstraintViolationException
     *
     * @return string un message affichable pour l'utilisateur
     */
    public function handleDatabase(\Exception $exception): string
    {
        $this->handle($exception);
        if ($exception instanceof ForeignKeyConstraintViolationException) {
            $message = "Impossible de supprimer cet élément tant que d'autres éléments y font référence.";
        } elseif ($exception instanceof NotNullConstraintViolationException) {
            $message = "Impossible d'ajouter ou de modifier cet élément car certains champs requis sont vides.";
        } elseif ($exception instanceof UniqueConstraintViolationException) {
            $message = "Impossible d'ajouter ou de modifier cet élément car certains champs doivent être uniques.";
        } else {
            $message = "Erreur lors de l'ajout, de la modification ou de la suppression de cet élément.";
        }

        return $message;
    }
}
