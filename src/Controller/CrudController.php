<?php

declare(strict_types=1);

namespace App\Controller\Param;

use App\Service\FormManager;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepositoryInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\Routing\Annotation\Route;

/**
 * Controller abstrait qui sert de base pour un CRUD.
 */
abstract class CrudController extends AbstractController
{
    protected ServiceEntityRepositoryInterface $repository;
    protected array $configPrincipal;
    protected array $configIndex;
    protected array $configConsulter;
    protected array $configAjouter;
    protected array $configEditer;

    /**
     * Définit la configuration principale du controller.
     *
     * Structure de l'array attendu :
     * - `route_prefix` : *string* (OBLIGATOIRE) le préfixe de la route
     * - `entity_class` : *string* (OBLIGATOIRE) la classe de l'entité
     * - `main_title` : *string* (OBLIGATOIRE) le titre principale affiché
     */
    abstract protected function setConfigPrincipal(): array;

    /**
     * Définit la configuration de la page d'index.
     *
     * Structure de l'array attendu :
     * - `cols` : *array* (OBLIGATOIRE): Définit les colonnes de datatable. Chaque élément est lui-même un array constitué de :
     *     - `property` : *string* (OBLIGATOIRE) la propriété de l'entité à afficher
     *     - `label` : *string* (OBLIGATOIRE)* le label affiché comme nom de colonne
     *     - autres propriétés optionnelles (voir datatable)
     * - `template` :  *string* (optionnel, défaut `'crud/index.html.twig'`) le template de rendu
     * - `button` : *array* (optionnel, défaut tous à true) contrôle la visibilité des boutons
     *     - `ajouter`, `consulter`, `editer`, `supprimer` *bool*
     */
    abstract protected function setConfigIndex(): array;

    /**
     * Définit la configuration pour la page de consultation.
     *
     * Structure de l'array attendu :
     * - `rows` (array, requis): Définit les lignes affichées. Chaque élément est lui-même un array constitué de :
     *     - `property` : *string* (OBLIGATOIRE) la propriété de l'entité à afficher
     *     - `label` : *string* (OBLIGATOIRE)* le label affiché en début de ligne
     * - `template` :  *string* (optionnel, défaut `'crud/consulter.html.twig'`) le template de rendu
     * - `button` : *array* (optionnel, défaut tous à true) contrôle la visibilité des boutons
     *      - `editer`, `supprimer` : *bool*
     */
    abstract protected function setConfigConsulter(): array;

    /**
     * Définit la configuration pour la page d'ajout.
     *
     * Structure de l'array attendu :
     * - `form_class` : *string* (OBLIGATOIRE) la classe du formulaire
     * - `template` :  *string* (optionnel, défaut `'crud/ajouter.html.twig'`) le template de rendu
     */
    abstract protected function setConfigAjouter(): array;

    /**
     * Définit la configuration pour la page de modification.
     *
     * Structure de l'array attendu :
     * - `form_class` : *string* (OBLIGATOIRE) la classe du formulaire
     * - `template` :  *string* (optionnel, défaut `'crud/editer.html.twig'`) le template de rendu
     * - `button` : *array* (optionnel, défaut true) contrôle la visibilité du bouton
     *      - `supprimer` : *bool*
     */
    abstract protected function setConfigEditer(): array;

    /**
     * Initialise le controller avec le repository de l'entité et la configuration.
     * DOIT être surchargé par le controller enfant.
     */
    public function __construct(ServiceEntityRepositoryInterface $repository)
    {
        $this->repository = $repository;
        $this->configPrincipal = $this->validateConfig($this->setConfigPrincipal(), ['route_prefix', 'entity_class', 'main_title'], []);
        $this->configIndex = $this->validateConfig(
            $this->setConfigIndex(),
            ['cols'],
            [
                'template' => 'crud/index.html.twig',
                'button' => ['ajouter' => true, 'consulter' => true, 'editer' => true, 'supprimer' => true],
            ],
        );
        $this->configConsulter = $this->validateConfig(
            $this->setConfigConsulter(),
            ['rows'],
            [
                'template' => 'crud/consulter.html.twig',
                'button' => ['editer' => true, 'supprimer' => true],
            ],
        );
        $this->configAjouter = $this->validateConfig(
            $this->setConfigAjouter(),
            ['form_class'],
            [
                'template' => 'crud/ajouter.html.twig',
            ],
        );
        $this->configEditer = $this->validateConfig(
            $this->setConfigEditer(),
            ['form_class'],
            [
                'template' => 'crud/editer.html.twig',
                'button' => ['supprimer' => true],
            ],
        );
    }

    /**
     * Affiche la liste des entités.
     */
    #[Route('', name: 'index', methods: ['GET'])]
    public function index(): Response
    {
        $objects = $this->repository->findAll();

        return $this->render($this->configIndex['template'], [
            'config_principal' => $this->configPrincipal,
            'config_index' => $this->configIndex,
            'objects' => $objects,
        ]);
    }

    /**
     * Gère la création d'une nouvelle entité.
     */
    #[Route('/ajouter', name: 'ajouter', methods: ['GET', 'POST'])]
    public function ajouter(Request $request, FormManager $fm): Response
    {
        return $this->editer(null, $request, $fm);
    }

    /**
     * Affiche les détails d'une entité.
     */
    #[Route('/{id}', name: 'consulter', methods: ['GET'], requirements: ['id' => '\d+'])]
    public function consulter(int $id): Response
    {
        $object = $this->repository->find($id);
        empty($object) ? throw new NotFoundHttpException($this->configPrincipal['entity_class'] . ' object non trouvé.') : null;

        return $this->render($this->configConsulter['template'], [
            'config_principal' => $this->configPrincipal,
            'config_consulter' => $this->configConsulter,
            'object' => $object,
        ]);
    }

    /**
     * Gère la création/modification d'une entité.
     */
    #[Route('/{id}/editer', name: 'editer', methods: ['GET', 'POST'], requirements: ['id' => '\d+'])]
    public function editer(?int $id, Request $request, FormManager $fm): Response
    {
        // Si `$id` est null, on créé une nouvelle entité, sinon on récupère celle existante
        $isNewObject = empty($id);
        if ($isNewObject) {
            $object = new ($this->configPrincipal['entity_class'])();
        } else {
            $object = $this->repository->find($id);
            empty($object) ? throw new NotFoundHttpException($this->configPrincipal['entity_class'] . ' object non trouvé.') : null;
        }

        $form = $this->createForm($isNewObject ? $this->configAjouter['form_class'] : $this->configEditer['form_class'], $object);
        $form->handleRequest($request);

        $flashSuccess = $isNewObject ? 'Paramètre ajouté avec succès.' : 'Paramètre modifié avec succès.';
        if ($fm->validateAndPersist($form, $object, $flashSuccess)) {
            return $this->redirectToRoute($this->configPrincipal['route_prefix'] . 'consulter', ['id' => $object->getId()]);
        }

        return $this->render($isNewObject ? $this->configAjouter['template'] : $this->configEditer['template'], [
            'config_principal' => $this->configPrincipal,
            'config_editer' => $this->configEditer,
            'form' => $form,
            'object' => $object,
        ]);
    }

    /**
     * Gère la suppression d'une entité.
     */
    #[Route('/{id}/supprimer', name: 'supprimer', methods: ['POST'], requirements: ['id' => '\d+'])]
    public function supprimer(int $id, FormManager $fm): Response
    {
        $object = $this->repository->find($id);
        empty($object) ? throw new NotFoundHttpException($this->configPrincipal['entity_class'] . ' object non trouvé.') : null;

        $flashSuccess = 'Paramètre supprimé avec succès.';
        if ($fm->checkTokenAndRemove('commission-suppression', $object, $flashSuccess)) {
            return $this->redirectToRoute($this->configPrincipal['route_prefix'] . 'index');
        }

        return $this->redirectToRoute($this->configPrincipal['route_prefix'] . 'consulter', ['id' => $object->getId()]);
    }

    /**
     * Vérifie sur les clés requises sont présentes et fusionne les array de configurations.
     */
    protected function validateConfig(array $config, array $requiredKeys, array $defaultKeys)
    {
        foreach ($requiredKeys as $key) {
            if (!isset($config[$key])) {
                throw new \InvalidArgumentException(sprintf('La clé de configuration "%s" est manquante.', $key));
            }
            if (in_array($key, ['cols', 'rows'])) {
                foreach ($config[$key] as $cell) {
                    $this->validateConfig($cell, ['property', 'label'], []);
                }
            }
        }

        return array_replace_recursive($defaultKeys, $config);
    }
}
