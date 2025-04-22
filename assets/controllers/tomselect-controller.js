// assets/controllers/dsfr_autocomplete_controller.js
import { Controller } from '@hotwired/stimulus';
import TomSelect from 'tom-select';

export default class TomSelectController extends Controller {
  connect() {
    new TomSelect(this.element, {
      maxOptions: 10,
      maxItems: 1,
      // plugins: ['remove_button'],
      plugins: {
        no_backspace_delete: {},
        clear_button: {
          title: 'Supprimer la sélection',
        },
      },
      closeAfterSelect: true,
      create: false,
      openOnFocus: false,
      hidePlaceholder: false,
      onInitialize: function () {
        this.wrapper.addEventListener('click', () => {
          this.focus();
        });
        this.wrapper.classList.add('tomselect');
        this.dropdown.classList.add('fr-card', 'fr-card--shadow');
      },
      render: {
        item: function (data, escape) {
          // return (
          //   '<button class="fr-tag" aria-label="Retirer la personne" onclick="event.preventDefault();">' +
          //   escape(data.text) +
          //   '</button>'
          // );
          // return '<p class="fr-tag">'+escape(data.text)+'</p>';
          return '<span>' + escape(data.text) + '</span>';
        },
        no_results: function () {
          return '<div class="option">Aucun résultat</div>';
        },
      },
    });

    this.element.classList.add('fr-hidden');
  }
}
