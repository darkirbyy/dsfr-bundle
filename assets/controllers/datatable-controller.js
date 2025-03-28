import { Controller } from '@hotwired/stimulus';
import DataTable from 'datatables.net-dt';
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.html5';
import 'pdfmake';

export default class DatatableController extends Controller {
  static targets = [
    'exportCsvButton',
    'exportPdfButton',
    'visible',
    'exportable',
    'searchable',
    'searchInput',
    'searchButton',
    'filtrable',
    'sortable',
    'pageFirst',
    'pagePrev',
    'pageEllipsisBefore',
    'pageBefore',
    'pageCurrent',
    'pageAfter',
    'pageEllipsisAfter',
    'pageNext',
    'pageLast',
    'records',
  ];

  static values = {
    options: Object,
  };

  connect() {
    // Définir les colonnes visibles
    let visibleColumns = Array();
    this.visibleTargets.forEach((element) => {
      visibleColumns.push(this.getColumnIndex(element));
    });

    // Définir les colonnes exportables
    let exportableColumns = Array();
    this.exportableTargets.forEach((element) => {
      exportableColumns.push(this.getColumnIndex(element));
    });

    // Définir les colonnes de recherche
    let searchColumns = Array();
    this.searchableTargets.forEach((element) => {
      searchColumns.push(this.getColumnIndex(element));
    });

    // Recupère la table elle-même
    const tableElement = this.element.querySelector('table');

    // Initialiser DataTable avec une configuration adaptée
    this.dataTable = new DataTable(tableElement, {
      layout: {
        topStart: null,
        topEnd: null,
        bottomStart: null,
        bottomEnd: null,
      },
      autoWidth: true,
      paging: this.optionsValue['paging'] ?? true,
      pageLength: this.optionsValue['pagingLength'] ?? 50,
      pagingType: 'simple',
      searching: true,
      ordering: true,
      orderCellsTop: true,
      columnDefs: [
        { orderable: false, targets: '_all' }, // géré manuellement
        { searchable: true, targets: searchColumns },
        { searchable: false, targets: '_all' },
        { visible: true, targets: visibleColumns },
        { visible: false, targets: '_all' },
      ],
      language: {
        emptyTable: 'Aucune donnée à afficher',
        zeroRecords: 'Aucun résultat',
      },
      buttons: [
        {
          name: 'csv',
          extend: 'csvHtml5',
          title: this.optionsValue['exportingName'] ?? 'Export',
          exportOptions: {
            columns: exportableColumns,
          },
        },
        {
          name: 'pdf',
          extend: 'pdfHtml5',
          title: this.optionsValue['exportingName'] ?? 'Export',
          exportOptions: {
            columns: exportableColumns,
            // modifier: {
            //   page: 'all',
            // },
            format: {
              header: (data, columnIdx) => {
                return tableElement.querySelector(
                  '[data-datatable-column="' + columnIdx + '"] .fr-cell__title'
                ).innerText;
              },
            },
          },
        },
      ],
    });

    // Récupération de l'api
    this.dataApi = new DataTable.Api(tableElement);

    // Initialiser les boutons d'export
    this.setupExportListeners();

    // Initialiser la recherche
    this.setupSearchListeners();

    // Initialiser le filtrage
    this.setupFilterListeners();

    // Initialiser le tri
    this.setupSortListeners();

    // Initialiser la pagination
    this.setupPaginationListeners();

    // Calcul initial du tableau
    this.performRedraw();
  }

  disconnect() {
    if (this.dataTable) {
      this.dataTable.destroy();
    }
  }

  setupExportListeners() {
    if (!(this.optionsValue['exporting'] ?? true)) {
      return;
    }

    /*global pdfMake*/
    pdfMake.fonts = {
      Roboto: {
        normal:
          'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf',
        bold: 'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Medium.ttf',
        italics:
          'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Italic.ttf',
        bolditalics:
          'https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-MediumItalic.ttf',
      },
    };

    this.exportCsvButtonTarget.addEventListener('click', () => {
      this.dataTable.buttons('csv:name').trigger();
    });

    this.exportPdfButtonTarget.addEventListener('click', () => {
      this.dataTable.buttons('pdf:name').trigger();
    });
  }

  setupSearchListeners() {
    if (!(this.optionsValue['searching'] ?? true)) {
      return;
    }

    // Initialisation de la recherche
    this.updateSearch();

    // Écouter le clic sur le bouton de recherche
    this.searchButtonTarget.addEventListener('click', (event) => {
      event.preventDefault();
      this.updateSearch();
      this.performRedraw();
    });

    // Écouter la touche Entrée dans le champ de recherche
    this.searchInputTarget.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.updateSearch();
        this.performRedraw();
      }
    });

    // Option: recherche en temps réel
    if (this.optionsValue['searchingLive'] ?? true) {
      this.searchInputTarget.addEventListener('input', () => {
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(() => {
          this.updateSearch();
          this.performRedraw();
        }, this.optionsValue['searchingLiveDelay'] ?? 500);
      });
    }
  }

  updateSearch() {
    // Appliquer la recherche
    this.dataApi.search(this.searchInputTarget.value ?? null);
  }

  setupFilterListeners() {
    if (this.filtrableTargets.length == 0) {
      return;
    }

    // Fermer les menus de filtrage quand on clique en dehors
    window.addEventListener('click', (event) => {
      const closestDatatableFilter = event.target.closest('.datatable-filter');
      this.filtrableTargets.forEach((element) => {
        const datatableFilter = element.querySelector('.datatable-filter');
        if (datatableFilter != closestDatatableFilter) {
          this.hideElement(datatableFilter.querySelector('fieldset'));
        }
      });
    });

    this.filterValues = Array();
    this.filtrableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const button = element.querySelector('[id^="datatable-filter"]');
      const fieldset = element.querySelector('fieldset');
      const checkboxes = fieldset.querySelectorAll('input[type]');

      // Affiche ou ferme le menu de filtrage quand on clique sur le bouton
      button.addEventListener('click', () => {
        if (fieldset.classList.contains('fr-hidden')) {
          button.setAttribute('aria-expanded', true);
          this.showElement(fieldset);
        } else {
          button.setAttribute('aria-expanded', false);
          this.hideElement(fieldset);
        }
      });

      // Initialisation du tableau de valeur autorisées pour le filtre
      this.updateFilter(checkboxes, columnIndex);

      // Ajouter une recherche fixe, par layer. Ne pas utiliser cell qui est vide car la recherche globale sur ce champ est désactivé !
      this.dataApi
        .column(columnIndex)
        .search.fixed('filter' + columnIndex.toString(), (cell, data) => {
          return this.filterValues[columnIndex].includes(
            data[columnIndex]['@data-search']
          );
        });

      // Ajout des écouteurs pour les cases à cocher
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          this.updateFilter(checkboxes, columnIndex);
          this.performRedraw();
        });
      });
    });
  }

  updateFilter(checkboxes, columnIndex) {
    // Mettre à jour les valeurs autorisées pour le filtre
    this.filterValues[columnIndex] = Array.from(checkboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.getAttribute('data-datatable-value'));
  }

  setupSortListeners() {
    if (this.sortableTargets.length == 0) {
      return;
    }

    this.sortableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const button = element.querySelector('[id^="datatable-sort"]');
      const initDirection = element.getAttribute('data-datatable-sort-init');

      // Initialisation du tri s'il es définit
      if (initDirection) {
        this.performSort(button, columnIndex, initDirection);
      }

      // Ajout des écouteurs pour les boutons de tri
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.performSort(button, columnIndex);
        this.performRedraw();
      });
    });
  }

  performSort(button, columnIndex, newDirection = 'asc') {
    // Récupérer la colonne et direction actuelle du tri
    const currentOrder = this.dataTable.order();

    // Si la colonne est déjà triée, basculer la direction
    if (currentOrder.length && currentOrder[0] === columnIndex) {
      newDirection = currentOrder[1] === 'asc' ? 'desc' : 'asc';
    }

    // Appliquer le tri
    this.dataTable.order([columnIndex, newDirection]).draw();

    // Mettre à jour les attributs Aria
    this.sortableTargets.forEach((element) => {
      element
        .querySelector('[id^="datatable-sort"]')
        .removeAttribute('aria-sort');
    });
    button.setAttribute('aria-sort', newDirection + 'ending');
  }

  setupPaginationListeners() {
    if (!(this.optionsValue['paging'] ?? true)) {
      return;
    }
    //  Ajout des écouteurs pour les boutons de pagination
    const paginationElements = [
      { element: this.pageFirstTarget, apiEvent: 'first' },
      { element: this.pagePrevTarget, apiEvent: 'previous' },
      { element: this.pageBeforeTarget, apiEvent: 'previous' },
      { element: this.pageNextTarget, apiEvent: 'next' },
      { element: this.pageAfterTarget, apiEvent: 'next' },
      { element: this.pageLastTarget, apiEvent: 'last' },
    ];

    paginationElements.forEach(({ element, apiEvent }) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        // Si le bouton est activé uniquement, on change de page et on met à jour la pagination
        if (!event.currentTarget.hasAttribute('aria-disabled')) {
          this.dataApi.page(apiEvent).draw('page');
          this.updatePagination();
        }
      });
    });
  }

  updatePagination() {
    if (!(this.optionsValue['paging'] ?? true)) {
      return;
    }

    const pageInfo = this.dataApi.page.info();
    const totalPages = Math.max(1, pageInfo.pages);
    const currentPage = pageInfo.page + 1;

    const isFirstPage = currentPage === 1;
    const isFirstOrSecondPage = currentPage === 1 || currentPage === 2;
    const isLastPage = currentPage === totalPages;
    const isLastOrSecondPage =
      currentPage === totalPages || currentPage === totalPages - 1;

    // Première page et page précédente
    if (isFirstPage) {
      this.disableElement(this.pageFirstTarget);
      this.disableElement(this.pagePrevTarget);
      this.disableElement(this.pageBeforeTarget);
      this.hideElement(this.pageBeforeTarget);
    } else {
      this.enableElement(this.pageFirstTarget);
      this.enableElement(this.pagePrevTarget);
      this.enableElement(this.pageBeforeTarget);
      this.showElement(this.pageBeforeTarget);

      let pageBeforeNum = (currentPage - 1).toString();
      this.pageBeforeTarget.textContent = pageBeforeNum;
      this.pageBeforeTarget.setAttribute('title', 'Page ' + pageBeforeNum);
    }

    // Page avant ellipse
    if (isFirstOrSecondPage) {
      this.hideElement(this.pageEllipsisBeforeTarget);
    } else {
      this.showElement(this.pageEllipsisBeforeTarget);
    }

    // Page courante
    let pageCurrentNum = currentPage.toString();
    this.pageCurrentTarget.textContent = pageCurrentNum;
    this.pageCurrentTarget.setAttribute('title', 'Page ' + pageCurrentNum);

    // Page suivante et dernière page
    if (isLastPage) {
      this.disableElement(this.pageLastTarget);
      this.disableElement(this.pageNextTarget);
      this.disableElement(this.pageAfterTarget);
      this.hideElement(this.pageAfterTarget);
    } else {
      this.enableElement(this.pageLastTarget);
      this.enableElement(this.pageNextTarget);
      this.enableElement(this.pageAfterTarget);
      this.showElement(this.pageAfterTarget);

      let pageAfterNum = (currentPage + 1).toString();
      this.pageAfterTarget.textContent = pageAfterNum;
      this.pageAfterTarget.setAttribute('title', 'Page ' + pageAfterNum);
    }

    // Page après ellipse
    if (isLastOrSecondPage) {
      this.hideElement(this.pageEllipsisAfterTarget);
    } else {
      this.showElement(this.pageEllipsisAfterTarget);
    }
  }

  updateRecords() {
    // Recupère le nombre de lignes affichées (sans compter la pagination)
    const pageInfo = this.dataApi.page.info();
    const records = pageInfo.recordsDisplay;

    // Met à jour la valeur dans la page
    let recordsNum = records.toString();
    this.recordsTarget.textContent =
      recordsNum + ' ligne' + (records > 1 ? 's' : '');
  }

  performRedraw() {
    // Recalculer les lignes selon les filtres/recherche/order + retour à la première page
    this.dataApi.draw('full-reset');

    // Mettre à jour la pagination et le nombre de lignes
    this.updateRecords();
    this.updatePagination();
  }

  hideElement(element) {
    element.classList.add('fr-hidden');
    element.classList.remove('fr-displayed-lg');
  }

  showElement(element) {
    element.classList.add('fr-displayed-lg');
    element.classList.remove('fr-hidden');
  }

  disableElement(element) {
    element.setAttribute('aria-disabled', 'true');
    element.removeAttribute('href');
  }

  enableElement(element) {
    element.setAttribute('href', '#');
    element.removeAttribute('aria-disabled');
  }

  getColumnIndex(element) {
    return parseInt(element.getAttribute('data-datatable-column'), 10);
  }
}
