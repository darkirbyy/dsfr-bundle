// assets/controllers/dsfr_autocomplete_controller.js
import { Controller } from '@hotwired/stimulus';
import TomSelect from 'tom-select';

export default class TomSelectController extends Controller {
  static values = {
    options: Object,
  };

  connect() {
    // Récupération des options avec valeurs par défaut
    const number = this.optionsValue['number'] ?? 10;
    const multiple = this.optionsValue['multiple'] ?? false;
    const create = this.optionsValue['create'] ?? false;

    // Configuration des plugins en fonction des options
    const plugins = {
      no_backspace_delete: {},
      clear_button: {
        title: 'Supprimer toute la sélection',
      },
    };
    if (multiple) {
      plugins.remove_button = {
        title: 'Supprimer cette option',
      };
    }

    // On crée le tomselect
    new TomSelect(this.element, {
      maxOptions: number,
      maxItems: multiple ? null : 1,
      plugins: plugins,
      closeAfterSelect: true,
      create: create,
      openOnFocus: false,
      hidePlaceholder: false,

      // On modifie quelques classes CSS à l'initialisaion
      onInitialize: function () {
        this.wrapper.addEventListener('click', () => {
          this.focus();
        });
        this.wrapper.classList.add('tomselect');
        this.dropdown.classList.add('fr-card', 'fr-card--shadow');
      },

      // On modifie le rendu pour coller au DSFR
      render: {
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
      },
    });

    // On cache le select initial (la valeur sera répliquée dessus automatiquement)
    this.element.classList.add('fr-hidden');
  }
}
