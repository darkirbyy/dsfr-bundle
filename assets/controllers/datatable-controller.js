import { Controller } from '@hotwired/stimulus';
import DataTable from 'datatables.net-dt';
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.html5';
import 'pdfmake';
import '../javascripts/vfs-marianne.js';

/*
 * Ce controller qui connecte les évènements datatable aux différents boutons dsfr (pagination, recherche, export)
 */
export default class DatatableController extends Controller {
  static targets = [
    'exportCsvButton',
    'exportPdfButton',
    'visible',
    'exportable',
    'sortable',
    'filtrable',
    'searchable',
    'searchInput',
    'searchButton',
    'selectCheckbox',
    'selectAllCheckbox',
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
    // Récupération des options avec valeurs par défaut
    this.paging = this.optionsValue['paging'] ?? true;
    this.pagingLength = this.optionsValue['pagingLength'] ?? 50;
    this.selecting = this.optionsValue['selecting'] ?? false;
    this.exporting = this.optionsValue['exporting'] ?? true;
    this.exportingName = this.optionsValue['exportingName'] ?? 'Export';
    this.exportingLandscape = this.optionsValue['exportingLandscape'] ?? false;
    this.exportingStretch = this.optionsValue['exportingStretch'] ?? true;
    this.searching = this.optionsValue['searching'] ?? true;
    this.searchingLive = this.optionsValue['searchingLive'] ?? true;
    this.searchingLiveDelay = this.optionsValue['searchingLiveDelay'] ?? 500;

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
    this.searchLabels = Array();
    this.searchableTargets.forEach((element) => {
      searchColumns.push(this.getColumnIndex(element));
      this.searchLabels.push(this.getExportHeader(element).toLowerCase());
    });

    // Récupère toutes les case à cochées de sélection avant qu'elles soient enlevées du DOM
    this.selectCheckboxes = this.selectCheckboxTargets;

    // Recupère la table elle-même
    this.tableElement = this.element.querySelector('table');

    // Initialiser DataTable avec une configuration adaptée
    this.dataTable = new DataTable(this.tableElement, {
      layout: {
        topStart: null,
        topEnd: null,
        bottomStart: null,
        bottomEnd: null,
      },
      autoWidth: false,
      paging: this.paging,
      pageLength: this.pagingLength,
      pagingType: 'simple',
      searching: true,
      ordering: true,
      order: [],
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
          title: this.exportingName,
          exportOptions: {
            columns: exportableColumns,
            format: {
              header: (data, columnIdx, node) => this.getExportHeader(node),
              body: (data, row, column, node) => this.getExportBody(data, node),
            },
          },
        },
        {
          name: 'pdf',
          extend: 'pdfHtml5',
          title: this.exportingName,
          customize: (doc) => this.getExportPdfCustomization(doc),
          exportOptions: {
            columns: exportableColumns,
            format: {
              header: (data, columnIdx, node) => this.getExportHeader(node),
              body: (data, row, column, node) => this.getExportBody(data, node),
            },
          },
        },
      ],
    });

    // Récupération de l'api
    this.dataApi = new DataTable.Api(this.tableElement);

    // Initialiser les boutons d'export
    this.setupExportListeners();

    // Initialiser la recherche
    this.setupSearchListeners();

    // Initialiser le filtrage
    this.setupFilterListeners();

    // Initialiser le tri
    this.setupSortListeners();

    // Initialiser la sélection
    this.setupSelectListeners();

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
    if (!this.exporting) {
      return;
    }

    /*global pdfMake*/
    pdfMake.fonts = {
      Marianne: {
        normal: 'Marianne-Regular.ttf',
        bold: 'Marianne-Bold.ttf',
        italics: 'Marianne-RegularItalic.ttf',
        bolditalics: 'Marianne-BoldItalic.ttf',
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
    if (!this.searching) {
      return;
    }

    // On complète le placeholder avec le nom des colonnes sur lesquelles porte la recherche
    this.searchInputTarget.setAttribute('placeholder', 'Recherche sur ' + this.searchLabels.join(' - '));

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
    if (this.searchingLive) {
      this.searchInputTarget.addEventListener('input', () => {
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(() => {
          this.updateSearch();
          this.performRedraw();
        }, this.searchingLiveDelay);
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
          this.hideFilterElement(datatableFilter.querySelector('fieldset'));
        }
      });
    });

    this.filterValues = Array();
    this.filtrableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const button = element.querySelector('[data-datatable-button="filter"]');
      const fieldset = element.querySelector('fieldset');
      const link = element.querySelector('a');
      const checkboxes = fieldset.querySelectorAll('input[type]');
      const mode = fieldset.getAttribute('data-datatable-filter-mode');

      // Affiche ou ferme le menu de filtrage quand on clique sur le bouton
      button.addEventListener('click', () => {
        if (fieldset.classList.contains('fr-hidden')) {
          button.setAttribute('aria-expanded', true);
          this.showFilterElement(fieldset);
        } else {
          button.setAttribute('aria-expanded', false);
          this.hideFilterElement(fieldset);
        }
      });

      // Initialisation du tableau de valeur autorisées pour le filtre
      this.updateFilter(checkboxes, columnIndex, link, mode);

      // Ajouter une recherche fixe, par layer. Ne pas utiliser cell qui est vide car la recherche globale sur ce champ est désactivé !
      this.dataApi.column(columnIndex).search.fixed('filter' + columnIndex.toString(), (cell, data) => {
        const cellValue = data[columnIndex]['@data-filter'];
        if (mode == 'range') {
          const cellNumber = parseFloat(cellValue);
          // Si la valeur n'est pas un nombre valide, on l'exclut
          if (isNaN(cellNumber)) {
            return false;
          }
          // Sinon, elle doit être dans au moins un des intervalles
          return this.filterValues[columnIndex].some((range) => {
            return cellNumber >= range.min && cellNumber <= range.max;
          });
        } else {
          return this.filterValues[columnIndex].includes(cellValue);
        }
      });

      // Ajout des écouteurs pour les cases à cocher
      checkboxes.forEach((checkbox) => {
        checkbox.addEventListener('change', () => {
          this.updateFilter(checkboxes, columnIndex, link, mode);
          this.performRedraw();
        });
      });

      // Ajout l'écouter pour le lien tout (dé)cocher
      link.addEventListener('click', (event) => {
        event.preventDefault();
        checkboxes.forEach((checkbox) => (checkbox.checked = this.filterValues[columnIndex].length == 0));
        this.updateFilter(checkboxes, columnIndex, link, mode);
        this.performRedraw();
      });
    });
  }

  updateFilter(checkboxes, columnIndex, link, mode) {
    // Mettre à jour les valeurs autorisées pour le filtre, selon le mode
    const checkedCheckboxes = Array.from(checkboxes).filter((checkbox) => checkbox.checked);
    if (mode == 'range') {
      this.filterValues[columnIndex] = checkedCheckboxes.map((checkbox) => {
        return {
          min: parseFloat(checkbox.getAttribute('data-datatable-value-min')),
          max: parseFloat(checkbox.getAttribute('data-datatable-value-max')),
        };
      });
    } else {
      this.filterValues[columnIndex] = checkedCheckboxes.map((checkbox) =>
        checkbox.getAttribute('data-datatable-value')
      );
    }
    link.textContent = this.filterValues[columnIndex].length == 0 ? 'Tout cocher' : 'Tout décocher';
  }

  setupSortListeners() {
    if (this.sortableTargets.length == 0) {
      return;
    }

    this.sortableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const button = element.querySelector('[data-datatable-button="sort"]');
      const initDirection = element.getAttribute('data-datatable-sort-init');

      // Initialisation du tri s'il est définit
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
      element.querySelector('[data-datatable-button="sort"]').removeAttribute('aria-sort');
    });
    button.setAttribute('aria-sort', newDirection + 'ending');
  }

  setupSelectListeners() {
    if (!this.selecting) {
      return;
    }

    // Tableau qui stocke l'id des lignes sélectionnées
    this.selectedRowId = Array();
    this.selectEvent = new CustomEvent(this.tableElement.id + '-select', {
      detail: { selectedRowId: this.selectedRowId },
    });

    // On initialise avec les cases cochées au chargement + ajout des écouteurs quand on coche/décoche
    this.selectCheckboxes.forEach((element) => {
      this.updateSelect(element);
      element.addEventListener('change', (event) => {
        this.updateSelect(event.target);
        this.updateAllSelect();
        this.updateRecords();
      });
    });

    // On initialise la case à cocher toutes les lignes visibles + ajout écouter quand on coche/décooche
    this.updateAllSelect();
    this.selectAllCheckboxTarget.addEventListener('change', () => {
      const selectCheckboxChecked = this.selectCheckboxTargets.filter((checkbox) => checkbox.checked).length;
      this.selectCheckboxTargets.forEach((checkbox) => {
        checkbox.checked = selectCheckboxChecked == 0 ? true : false;
        this.updateSelect(checkbox);
      });
      this.updateAllSelect();
      this.updateRecords();
    });
  }

  updateSelect(checkbox) {
    const rowId = checkbox.getAttribute('data-datatable-row-id');
    if (checkbox.checked) {
      if (!this.selectedRowId.includes(rowId)) {
        this.selectedRowId.push(rowId);
      }
    } else {
      const index = this.selectedRowId.indexOf(rowId);
      if (index > -1) {
        this.selectedRowId.splice(index, 1);
      }
    }
    checkbox.closest('tr').setAttribute('aria-selected', checkbox.checked);
  }

  updateAllSelect() {
    this.selectAllCheckboxTarget.checked = this.selectCheckboxTargets.filter((checkbox) => checkbox.checked).length;
    window.dispatchEvent(this.selectEvent);
  }

  setupPaginationListeners() {
    if (!this.paging) {
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
          this.updateAllSelect();
        }
      });
    });
  }

  updatePagination() {
    if (!this.paging) {
      return;
    }

    const pageInfo = this.dataApi.page.info();
    const totalPages = Math.max(1, pageInfo.pages);
    const currentPage = pageInfo.page + 1;

    const isFirstPage = currentPage === 1;
    const isFirstOrSecondPage = currentPage === 1 || currentPage === 2;
    const isLastPage = currentPage === totalPages;
    const isLastOrSecondPage = currentPage === totalPages || currentPage === totalPages - 1;

    // Première page et page précédente
    if (isFirstPage) {
      this.disablePagingElement(this.pageFirstTarget);
      this.disablePagingElement(this.pagePrevTarget);
      this.disablePagingElement(this.pageBeforeTarget);
      this.hidePagingElement(this.pageBeforeTarget);
    } else {
      this.enablePagingElement(this.pageFirstTarget);
      this.enablePagingElement(this.pagePrevTarget);
      this.enablePagingElement(this.pageBeforeTarget);
      this.showPagingElement(this.pageBeforeTarget);

      let pageBeforeNum = (currentPage - 1).toString();
      this.pageBeforeTarget.textContent = pageBeforeNum;
      this.pageBeforeTarget.setAttribute('title', 'Page ' + pageBeforeNum);
    }

    // Page avant ellipse
    if (isFirstOrSecondPage) {
      this.hidePagingElement(this.pageEllipsisBeforeTarget);
    } else {
      this.showPagingElement(this.pageEllipsisBeforeTarget);
    }

    // Page courante
    let pageCurrentNum = currentPage.toString();
    this.pageCurrentTarget.textContent = pageCurrentNum;
    this.pageCurrentTarget.setAttribute('title', 'Page ' + pageCurrentNum);

    // Page suivante et dernière page
    if (isLastPage) {
      this.disablePagingElement(this.pageLastTarget);
      this.disablePagingElement(this.pageNextTarget);
      this.disablePagingElement(this.pageAfterTarget);
      this.hidePagingElement(this.pageAfterTarget);
    } else {
      this.enablePagingElement(this.pageLastTarget);
      this.enablePagingElement(this.pageNextTarget);
      this.enablePagingElement(this.pageAfterTarget);
      this.showPagingElement(this.pageAfterTarget);

      let pageAfterNum = (currentPage + 1).toString();
      this.pageAfterTarget.textContent = pageAfterNum;
      this.pageAfterTarget.setAttribute('title', 'Page ' + pageAfterNum);
    }

    // Page après ellipse
    if (isLastOrSecondPage) {
      this.hidePagingElement(this.pageEllipsisAfterTarget);
    } else {
      this.showPagingElement(this.pageEllipsisAfterTarget);
    }
  }

  updateRecords() {
    // Recupère le nombre de lignes affichées et sélectionnées (sans compter la pagination)
    const pageInfo = this.dataApi.page.info();
    const records = pageInfo.recordsDisplay;
    const selects = this.selectedRowId.length;
    let recordsNum = records.toString();
    let selectsNum = selects.toString();

    let textContent = '';
    if (this.selecting) {
      let plural = selects > 1 ? 's' : '';
      textContent += selectsNum + ' ligne' + plural + ' sélectionnée' + plural + ' sur ';
    }
    textContent += recordsNum + ' ligne' + (records > 1 ? 's' : '');

    this.recordsTarget.textContent = textContent;
  }

  performRedraw() {
    // Recalculer les lignes selon les filtres/recherche/order + retour à la première page
    this.dataApi.draw('full-reset');

    // Mettre à jour la pagination et le nombre de lignes
    this.updateRecords();
    this.updatePagination();
  }

  hideFilterElement(element) {
    element.classList.add('fr-hidden');
  }

  showFilterElement(element) {
    element.classList.remove('fr-hidden');
  }

  hidePagingElement(element) {
    element.classList.add('fr-hidden');
    element.classList.remove('fr-displayed-lg');
  }

  showPagingElement(element) {
    element.classList.add('fr-displayed-lg');
    element.classList.remove('fr-hidden');
  }

  disablePagingElement(element) {
    element.setAttribute('aria-disabled', 'true');
    element.removeAttribute('href');
  }

  enablePagingElement(element) {
    element.setAttribute('href', '#');
    element.removeAttribute('aria-disabled');
  }

  getColumnIndex(element) {
    return parseInt(element.getAttribute('data-datatable-column'), 10);
  }

  getExportHeader(node) {
    const title = node.querySelector('.fr-cell__title');
    return title !== null ? title.textContent : node.textContent;
  }

  getExportBody(data, node) {
    const exportValue = node.getAttribute('data-export');
    return exportValue !== null ? exportValue : data;
  }

  getExportPdfCustomization(doc) {
    doc.footer = function (currentPage, pageCount) {
      return [
        {
          text: `${currentPage} / ${pageCount}`,
          alignment: 'center',
          fontSize: 8,
        },
      ];
    };

    doc.pageOrientation = this.exportingLandscape ? 'landscape' : 'portrait';

    if (this.exportingStretch) {
      doc.content[1].table.widths = Array(doc.content[1].table.body[0].length).fill('*');
    }

    doc.styles.tableHeader = {
      alignment: 'left',
      fontSize: 10,
      bold: true,
    };

    doc.defaultStyle = {
      alignment: 'left',
      font: 'Marianne',
      fontSize: 9,
    };
  }
}
