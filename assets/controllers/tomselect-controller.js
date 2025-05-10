import { Controller } from '@hotwired/stimulus';
import TomSelect from 'tom-select';

/*
 * Ce controller initialise tomselect pour les champs d'autocomplétion
 */
export default class TomSelectController extends Controller {
  static values = {
    options: Object,
  };

  connect() {
    // Récupération des options avec valeurs par défaut
    const number = this.optionsValue['number'] ?? null;
    const multiple = this.optionsValue['multiple'] ?? false;
    const backspace = this.optionsValue['backspace'] ?? true;
    const create = this.optionsValue['create'] ?? false;
    const url = this.optionsValue['url'] ?? null;
    const delay = this.optionsValue['delay'] ?? 500;

    // Configuration des plugins en fonction des options
    const plugins = {};

    if (!backspace) {
      plugins.no_backspace_delete = {};
      plugins.clear_button = {
        title: 'Supprimer toute la sélection',
      };
    }

    if (multiple) {
      plugins.remove_button = {
        title: 'Supprimer cette option',
      };
    }

    // Options TomSelect
    const options = {
      maxOptions: number,
      maxItems: multiple ? null : 1,
      plugins: plugins,
      closeAfterSelect: true,
      create: create,
      openOnFocus: false,
      hidePlaceholder: false,
      loadThrottle: url ? delay : null,
    };

    // Si une URL est fournie, on configure le chargement dynamique
    if (url) {
      // Désactiver la recherche côté client quand on utilise l'AJAX
      options.score = function () {
        return function () {
          return 1;
        };
      };

      // Minimum de 3 caractères pour déclencher la recherche
      options.shouldLoad = function (query) {
        return query.length > 2;
      };

      // Effacer les options lorsque l'entrée change
      options.onType = function () {
        this.clearOptions();
      };

      // Fonction de chargement des options
      options.load = function (query, callback) {
        const fullUrl = url + '?search=' + encodeURIComponent(query);

        fetch(fullUrl, {
          method: 'GET',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error('Erreur réseau');
            }
            return response.json();
          })
          .then((json) => {
            callback(json);
          })
          .catch((error) => {
            console.error('Tomselect, erreur de chargement : ', error);
            callback();
          });
      };
    }

    // On modifie quelques classes CSS à l'initialisation
    options.onInitialize = function () {
      this.wrapper.addEventListener('click', () => {
        this.focus();
      });
      this.wrapper.classList.add('tomselect');
      this.dropdown.classList.add('fr-card', 'fr-card--shadow');
    };

    // On modifie le rendu pour coller au DSFR
    options.render = {
      item: function (data, escape) {
        if (multiple) {
          return '<span class="fr-tag">' + escape(data.text) + '</span>';
        } else {
          return '<span>' + escape(data.text) + '</span>';
        }
      },
      option_create: function (data, escape) {
        return (
          '<div class="create option"><span class="fr-icon--sm fr-icon-add-circle-fill fr-mr-1v" aria-hidden="true"></span>Créer l\'option <strong>' +
          escape(data.input) +
          '</strong></div>'
        );
      },
      no_results: function () {
        return '<div class="option">Aucun résultat</div>';
      },
      loading: function () {
        return '<div class="option"><span class="fr-mr-1v fr-icon--sm fr-icon-refresh-line"></span>Chargement...</div>';
      },
    };

    // On crée le tomselect
    new TomSelect(this.element, options);

    // On cache le select initial (la valeur sera répliquée dessus automatiquement)
    this.element.classList.add('fr-hidden');
  }
}
