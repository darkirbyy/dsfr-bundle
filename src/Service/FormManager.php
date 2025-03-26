<?php

declare(strict_types=1);

namespace App\Service;

use AcStrasbourg\LibraryBundle\Enum\LibAlertTypeEnum;
use Doctrine\DBAL\Exception\ConstraintViolationException;
use Doctrine\ORM\EntityManagerInterface;
use Doctrine\ORM\Exception\ORMException;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\HttpFoundation\RequestStack;
use Symfony\Component\HttpFoundation\Session\Flash\FlashBagInterface;
use Symfony\Component\Security\Csrf\CsrfToken;
use Symfony\Component\Security\Csrf\CsrfTokenManagerInterface;

/**
 * Service pour validate/persist/remove une entité dans la base de données, gérant les messages flashs.
 */
class FormManager
{
    private FlashBagInterface $flashBag;

    public function __construct(private EntityManagerInterface $entityManager, private RequestStack $requestStack, private CsrfTokenManagerInterface $csrfTokenManager)
    {
        $this->flashBag = $requestStack->getSession()->getFlashBag();
    }

    /**
     * Valide une entité selon le form associé et la persiste avec un message personnalisé optionnel en cas de réussite.
     * Affiche les champs en erreurs sinon.
     *
     * @param FormInterface $form         le formulaire associé à l'entité
     * @param object        $object       l'entité à valider
     * @param string|null   $flashSuccess le message flash à afficher en cas de succès
     *
     * @return bool vrai si la validation + persiste sont passés, faux sinon
     */
    public function validateAndPersist(FormInterface $form, object $object, ?string $flashSuccess = null): bool
    {
        if ($form->isSubmitted()) {
            if ($form->isValid()) {
                return $this->persist($object, $flashSuccess);
            } else {
                $this->generateErrorsFlash($form);
            }
        }

        return false;
    }

    /**
     * Vérifie le jeton CSRF et supprime l'entité avec un message personnalisé optionnel en cas de réussite.
     * Affiche un message d'erreur sinon.
     *
     * @param string      $tokenName    le nom du jeton CSRF, sans le suffixe _token (attribut "name" en HTML ou 'csrf_field_name' => ... en PHP)
     * @param object      $object       l'entité à supprimer
     * @param string|null $flashSuccess le message flash à afficher en cas de succès
     *
     * @return bool vrai si la vérification + suppression sont passés, faux sinon
     */
    public function checkTokenAndRemove(string $tokenName, object $object, ?string $flashSuccess = null): bool
    {
        $tokenValue = $this->requestStack
            ->getCurrentRequest()
            ->getPayload()
            ->get($tokenName . '_token');
        if (!$this->csrfTokenManager->isTokenValid(new CsrfToken($tokenName, $tokenValue))) {
            $this->flashBag->add(LibAlertTypeEnum::Error->value, 'Jeton CSRF invalide.');

            return false;
        }

        return $this->remove($object, $flashSuccess);
    }

    /**
     * Persiste une entité en base, avec un message personnalisé optionnel en cas de réussite.
     * Attrape les erreurs ORMs et les affiche dans le message flash en cas d'erreur.
     *
     * @param object $object       l'entité à persister
     * @param array  $flashSuccess le message flash à afficher en cas de succès
     *
     * @return bool vrai si l'entité a pu être persister, faux sinon
     */
    public function persist(object $object, ?string $flashSuccess = null): bool
    {
        try {
            $this->entityManager->persist($object);
            $this->entityManager->flush();

            $flashSuccess ??= 'Enregistrement effectué avec succès';
            $this->flashBag->add(LibAlertTypeEnum::Success->value, $flashSuccess);

            return true;
        } catch (ORMException|ConstraintViolationException $e) {
            $this->flashBag->add(LibAlertTypeEnum::Error->value, $e->getMessage());

            return false;
        }
    }

    /**
     * Supprime une entité en base, avec un message personnalisé optionnel en cas de réussite.
     * Attrape les erreurs ORMs et les affiche dans le message flash en cas d'erreur.
     *
     * @param object $object       l'entité à supprimer
     * @param array  $flashSuccess le message flash à afficher en cas de succès
     *
     * @return bool vrai si l'entité a pu être supprimé, faux sinon
     */
    public function remove(object $object, ?string $flashSuccess = null): bool
    {
        try {
            $this->entityManager->remove($object);
            $this->entityManager->flush();

            $flashSuccess ??= 'Suppression effectuée avec succès';
            $this->flashBag->add(LibAlertTypeEnum::Success->value, $flashSuccess);

            return true;
        } catch (ORMException $e) {
            $this->flashBag->add(LibAlertTypeEnum::Error->value, $e->getMessage());

            return false;
        }
    }

    /**
     * Génère et ajoute un message flash contenant la listes des champs en erreurs.
     *
     * @param FormInterface $form le formulaire avec des champs en erreur
     */
    public function generateErrorsFlash(FormInterface $form): void
    {
        $errorLinks = self::determineErrorLinks($form);
        $flashWarning = count($errorLinks) > 1 ? 'Le formulaire contient des erreurs de saisies. Champs : ' : 'Le formulaire contient une erreur de saisie. Champ : ';
        $this->flashBag->add(LibAlertTypeEnum::Warning->value, $flashWarning . implode(', ', $errorLinks));
    }

    /**
     * Itère sur toutes les erreurs d'un formulaire en profondeur et récupère l'id des champs en erreur
     * afin de créer des liens ancre vers ces champs.
     *
     * @param FormInterface $form le formulaire avec des champs en erreur
     *
     * @return array tableau contenant les liens ancre vers chaque champ
     */
    public static function determineErrorLinks(FormInterface $form): array
    {
        $links = [];
        $formErrorIterator = $form->getErrors(true, true);
        foreach ($formErrorIterator as $formError) {
            $parent = $formError->getOrigin();
            $name = $parent->getName();
            $label = $parent->getConfig()->getOption('label');

            if (null === $label) {
                continue;
            } elseif (false === $label) {
                $label = "$name";
            }

            $array = [];
            while (null !== $parent) {
                $array[] = $parent->getName();
                $parent = $parent->getParent();
            }

            $id = implode('_', array_reverse($array));

            $links[] = '<a href="#' . $id . '">' . $label . '</a>';
        }

        return $links;
    }
}
