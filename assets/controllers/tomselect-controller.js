// assets/controllers/dsfr_autocomplete_controller.js
import { Controller } from '@hotwired/stimulus';
import TomSelect from 'tom-select';

export default class TomSelectController extends Controller {
  connect() {
    new TomSelect(this.element, {
      maxOptions: 10,
      maxItems: 1,
      plugins: ['remove_button'],
      // plugins: ['clear_button'],
      closeAfterSelect: true,
      create: false,
      openOnFocus: false,
      onInitialize: function () {
        // Supprime les classes de Tom Select
        this.wrapper.classList.remove('fr-select');
        this.wrapper.classList.add('tomselect');
        this.dropdown.classList.add('fr-card', 'fr-card--shadow');
        this.wrapper.querySelector('input').classList.add('fr-input');
      },
      // onItemAdd: function(value, $item){
      //     console.log(this.wrapper.querySelector('input'));
      //     this.wrapper.querySelector('input').value = value;
      // },
      render: {
        item: function (data, escape) {
          return (
            '<button class="fr-tag fr-mr-1v" aria-label="Retirer la personne" onclick="event.preventDefault();">' +
            escape(data.text) +
            '</button>'
          );
          // return '<p class="fr-tag fr-mr-2v">'+escape(data.text)+'</p>';
          // return '<span>'+escape(data.text)+'</span>';
        },
        no_results: function () {
          return '<div class="option">Aucun résultat</div>';
        },
      },
    });
    this.element.classList.add('fr-hidden');
  }
}
