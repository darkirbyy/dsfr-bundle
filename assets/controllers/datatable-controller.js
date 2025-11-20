import { Controller } from '@hotwired/stimulus';
import DataTable from 'datatables.net-dt';
import 'datatables.net-buttons';
import 'datatables.net-buttons/js/buttons.html5';
import 'datatables.net-staterestore';
import 'pdfmake';
import '../javascripts/vfs-marianne.js';

/*
 * Ce controller qui connecte les évènements datatable aux différents boutons dsfr (pagination, recherche, export)
 */
export default class DatatableController extends Controller {
  static targets = [
    'resetButton',
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
    'infoSelects',
    'infoRecords',
  ];

  static values = {
    options: Object,
  };

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Initialisation ///////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  connect() {
    // Récupération des options avec valeurs par défaut
    this.paging = this.optionsValue['paging'] ?? true;
    this.pagingLength = this.optionsValue['pagingLength'] ?? 50;
    this.selecting = this.optionsValue['selecting'] ?? false;
    this.selectingProperty = this.optionsValue['selectingProperty'] ?? 'id';
    this.exporting = this.optionsValue['exporting'] ?? true;
    this.exportingName = this.optionsValue['exportingName'] ?? 'Export';
    this.exportingLandscape = this.optionsValue['exportingLandscape'] ?? false;
    this.exportingStretch = this.optionsValue['exportingStretch'] ?? true;
    this.searching = this.optionsValue['searching'] ?? true;
    this.searchingLive = this.optionsValue['searchingLive'] ?? true;
    this.searchingLiveDelay = this.optionsValue['searchingLiveDelay'] ?? 500;
    this.storing = this.optionsValue['storing'] ?? false;

    // On setup la datatable et on attrape les erreurs pour afficher un message, et on supprimer tous les states.
    try {
      this.setupDatatable();
    } catch (error) {
      if (this.dataTable) {
        this.dataTable.stateRestore.states().remove(true);
      }
      console.error(error.toString());
      alert(
        'Une erreur est survenue lors du chargement du tableau. Merci de recharger la page ou de contacter une administrateur si le problème persiste.'
      );
    } 
  }

  setupDatatable() {
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

    // Récupère toutes les cases à cocher de sélection avant qu'elles soient enlevées du DOM
    this.selectCheckboxes = this.selectCheckboxTargets;

    // Recupère la table elle-même
    this.tableElement = this.element.querySelector('table');

    // Enregistre une référence du controller stimulus pour les callbacks
    const controller = this;

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
      stateSaveParams: function (s, data) {
        data.filterValues = controller.filterValues;
        data.selectedRowId = controller.selectedRowId;
      },
      stateLoadParams: function (s, data) {
        controller.filterValues = data && data.filterValues ? data.filterValues : [];
        controller.selectedRowId = data && data.selectedRowId ? data.selectedRowId : [];
      },
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

    // Initialiser la recherche
    this.searchSetup();

    // Initialiser le tri
    this.sortSetup();

    // Initialiser le filtrage
    this.filterSetup();

    // Initialiser la pagination
    this.paginationSetup();

    // Initialiser la sélection
    this.selectSetup();

    // Initialiser la sauvegarde
    this.storeSetup();

    // Initialiser les boutons d'export
    this.exportSetup();

    // Calcul initial du tableau
    this.redrawInit();
  }

  disconnect() {
    if (this.dataTable && this.element.isConnected === false) {
      this.dataTable.destroy(false);
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Recherche ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  searchSetup() {
    if (!this.searching) {
      return;
    }

    // On complète le placeholder avec le nom des colonnes sur lesquelles porte la recherche
    this.searchInputTarget.setAttribute('placeholder', 'Recherche sur ' + this.searchLabels.join(' - '));

    // Initialisation de la recherche
    this.searchUpdate();

    // Écouter le clic sur le bouton de recherche
    this.searchButtonTarget.addEventListener('click', (event) => {
      event.preventDefault();
      this.searchUpdate();
      this.redrawNormal();
    });

    // Écouter la touche Entrée dans le champ de recherche
    this.searchInputTarget.addEventListener('keyup', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        this.searchUpdate();
        this.redrawNormal();
      }
    });

    // Option: recherche en temps réel
    if (this.searchingLive) {
      this.searchInputTarget.addEventListener('input', () => {
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(() => {
          this.searchUpdate();
          this.redrawNormal();
        }, this.searchingLiveDelay);
      });
    }
  }

  searchUpdate() {
    // Appliquer la recherche
    this.dataApi.search(this.searchInputTarget.value ?? null);
  }

  searchRedraw() {
    // Insère la recherche dans le champ
    this.searchInputTarget.value = this.dataTable.search() ?? '';
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Tri //////////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  sortSetup() {
    if (this.sortableTargets.length == 0) {
      return;
    }

    this.sortableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const button = element.querySelector('[data-global--datatable-button="sort"]');
      const initDirection = element.getAttribute('data-global--datatable-sort-init');

      // Initialisation du tri s'il est définit
      if (initDirection) {
        this.sortUpdate(button, columnIndex, initDirection);
      }

      // Ajout des écouteurs pour les boutons de tri
      button.addEventListener('click', (event) => {
        event.preventDefault();
        this.sortUpdate(button, columnIndex);
        this.redrawNormal();
      });
    });
  }

  sortUpdate(button, columnIndex, newDirection = 'asc') {
    // Récupérer la colonne et direction actuelle du tri
    const currentOrder = this.dataTable.order()[0];

    // Si la colonne est déjà triée, basculer la direction
    if (currentOrder != undefined && currentOrder[0] === columnIndex) {
      newDirection = currentOrder[1] === 'asc' ? 'desc' : 'asc';
    }

    // Appliquer le tri
    this.dataTable.order([columnIndex, newDirection]);

    // Mettre à jour les attributs Aria
    this.sortableTargets.forEach((element) => {
      element.querySelector('[data-global--datatable-button="sort"]').removeAttribute('aria-sort');
    });
    button.setAttribute('aria-sort', newDirection + 'ending');
  }

  sortRedraw() {
    // Mettre à jour les attributs Aria
    this.sortableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const button = element.querySelector('[data-global--datatable-button="sort"]');
      const currentOrder = this.dataTable.order()[0];

      button.removeAttribute('aria-sort');
      if (currentOrder != undefined && currentOrder[0] === columnIndex) {
        button.setAttribute('aria-sort', currentOrder[1] + 'ending');
      }
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Filtrage /////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  filterSetup() {
    if (this.filtrableTargets.length == 0) {
      return;
    }

    // Fermer les menus de filtrage quand on clique en dehors
    window.addEventListener('click', (event) => {
      const closestDatatableFilter = event.target.closest('.datatable-filter');
      this.filtrableTargets.forEach((element) => {
        const datatableFilter = element.querySelector('.datatable-filter');
        if (datatableFilter != closestDatatableFilter) {
          const fieldset = datatableFilter.querySelector('fieldset');
          const button = datatableFilter.querySelector('button');
          this.hideFilterElement(fieldset, button);
        }
      });
    });

    // Pour chaque menu de filtrage définit
    this.filterValues = Array();
    this.filtrableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const button = element.querySelector('[data-global--datatable-button="filter"]');
      const fieldset = element.querySelector('fieldset');
      const link = element.querySelector('a');
      const checkboxes = fieldset.querySelectorAll('input[type]');
      const mode = fieldset.getAttribute('data-global--datatable-filter-mode');

      // Affiche ou ferme le menu de filtrage quand on clique sur le bouton
      button.addEventListener('click', () => {
        if (fieldset.classList.contains('fr-hidden')) {
          this.showFilterElement(fieldset, button);
        } else {
          this.hideFilterElement(fieldset, button);
        }
      });

      // Initialisation du tableau de valeur autorisées pour le filtre
      this.filterUpdate(checkboxes, columnIndex, link, mode);

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
          this.filterUpdate(checkboxes, columnIndex, link, mode);
          this.redrawNormal();
        });
      });

      // Ajout l'écouter pour le lien tout (dé)cocher
      link.addEventListener('click', (event) => {
        event.preventDefault();
        checkboxes.forEach((checkbox) => (checkbox.checked = this.filterValues[columnIndex].length == 0));
        this.filterUpdate(checkboxes, columnIndex, link, mode);
        this.redrawNormal();
      });
    });
  }

  filterUpdate(checkboxes, columnIndex, link, mode) {
    // Mettre à jour les valeurs autorisées pour le filtre, selon le mode
    const checkedCheckboxes = Array.from(checkboxes).filter((checkbox) => checkbox.checked);
    if (mode == 'range') {
      this.filterValues[columnIndex] = checkedCheckboxes.map((checkbox) => {
        return {
          min: parseFloat(checkbox.getAttribute('data-global--datatable-value-min')),
          max: parseFloat(checkbox.getAttribute('data-global--datatable-value-max')),
        };
      });
    } else {
      this.filterValues[columnIndex] = checkedCheckboxes.map((checkbox) =>
        checkbox.getAttribute('data-global--datatable-value')
      );
    }

    // Mettre à jour le bouton tout (dé)cocher
    link.textContent = this.filterValues[columnIndex].length == 0 ? 'Tout cocher' : 'Tout décocher';
  }

  filterRedraw() {
    this.filtrableTargets.forEach((element) => {
      const columnIndex = this.getColumnIndex(element);
      const fieldset = element.querySelector('fieldset');
      const link = element.querySelector('a');
      const checkboxes = fieldset.querySelectorAll('input[type]');
      const mode = fieldset.getAttribute('data-global--datatable-filter-mode');

      Array.from(checkboxes).forEach((checkbox) => {
        if (mode == 'range') {
          const valueMin = parseFloat(checkbox.getAttribute('data-global--datatable-value-min'));
          const valueMax = parseFloat(checkbox.getAttribute('data-global--datatable-value-max'));
          checkbox.checked = this.filterValues[columnIndex].some((range) => {
            return range.min == valueMin && range.max == valueMax;
          });
        } else {
          const value = checkbox.getAttribute('data-global--datatable-value');
          checkbox.checked = this.filterValues[columnIndex].includes(value);
        }
      });

      link.textContent = this.filterValues[columnIndex].length == 0 ? 'Tout cocher' : 'Tout décocher';
    });
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Pagination ///////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  paginationSetup() {
    if (!this.paging) {
      return;
    }
    //  Ajout des écouteurs pour les boutons de pagination
    const paginationElements = [
      { element: this.pageFirstTarget, targetPage: 'first' },
      { element: this.pagePrevTarget, targetPage: 'previous' },
      { element: this.pageBeforeTarget, targetPage: 'previous' },
      { element: this.pageAfterTarget, targetPage: 'next' },
      { element: this.pageNextTarget, targetPage: 'next' },
      { element: this.pageLastTarget, targetPage: 'last' },
    ];

    paginationElements.forEach(({ element, targetPage }) => {
      element.addEventListener('click', (event) => {
        event.preventDefault();
        // Si le bouton est activé uniquement, on change de page et on met à jour la pagination
        if (!event.currentTarget.hasAttribute('aria-disabled')) {
          this.paginationUpdate(targetPage);
          this.redrawNormal('page');
        }
      });
    });
  }

  paginationUpdate(targetPage) {
    this.dataApi.page(targetPage);
  }

  paginationRedraw() {
    // Même si la pagination est désactivé, on affiche le nombre de ligne totales
    // et aussi le nombre de lignes affichées si la pagination est activée
    const pageInfo = this.dataApi.page.info();

    let textContent = 'Affichage : ';
    if (this.paging) {
      const start = pageInfo.start + 1;
      const end = pageInfo.end;
      textContent += start.toString() + ' à ' + end.toString() + ' sur ';
    }

    const records = pageInfo.recordsDisplay;
    textContent += records.toString() + ' ligne' + (records > 1 ? 's' : '');

    this.infoRecordsTarget.textContent = textContent;

    // Le reste de la pagination est mis à jour uniquement si elle est activée
    if (!this.paging) {
      return;
    }

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

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Sélection ////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  selectSetup() {
    if (!this.selecting) {
      return;
    }

    // Tableau qui stocke l'id des lignes sélectionnées
    this.selectedRowId = Array();

    // On initialise avec les cases cochées au chargement + ajout des écouteurs quand on coche/décoche
    this.selectCheckboxes.forEach((element) => {
      element.addEventListener('change', (event) => {
        this.selectUpdate(event.target);
        if (event.explicitOriginalTarget == event.target) {
          this.selectAllUpdate();
          this.selectDispatch();
          this.storeSaveTo('current');
        }
      });
    });

    // On initialise la case à cocher toutes les lignes visibles + ajout écouter quand on coche/décooche
    this.selectAllCheckboxTarget.addEventListener('change', () => {
      const numberCheckboxedChecked = this.selectCheckboxTargets.filter((checkbox) => checkbox.checked).length;
      this.selectCheckboxTargets.forEach((checkbox) => {
        checkbox.checked = numberCheckboxedChecked == 0;
        checkbox.dispatchEvent(new Event('change'));
      });
      this.selectAllUpdate();
      this.selectDispatch();
      this.storeSaveTo('current');
    });
  }

  selectUpdate(checkbox) {
    // On récupère l'id de la ligne
    const rowId = checkbox.getAttribute('data-global--datatable-row-id');

    // On l'ajoute (s'il n'est pas déjà stocké) ou l'enlève (s'i lest stocké) de la liste
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

    // On met à jour l'attribut aria de la ligne
    checkbox.closest('tr').setAttribute('aria-selected', checkbox.checked);
  }

  selectAllUpdate() {
    if (!this.selecting) {
      return;
    }

    // Coche la case 'Tout (dé)cocher' si au moins une case à cocher visible est cochée
    this.selectAllCheckboxTarget.checked = this.selectCheckboxTargets.filter((checkbox) => checkbox.checked).length;

    // Récupère les lignes sélectionnés et affiche le nombre
    const selects = this.selectedRowId.length;
    this.infoSelectsTarget.textContent = 'Sélection : ' + selects.toString() + ' ligne' + (selects > 1 ? 's' : '');
  }

  selectRedraw() {
    const validRowId = new Array();
    this.selectCheckboxes.forEach((checkbox) => {
      const rowId = checkbox.getAttribute('data-global--datatable-row-id');
      validRowId.push(rowId);
      checkbox.checked = this.selectedRowId.includes(rowId);
      this.selectUpdate(checkbox);
    });
    this.selectedRowId = this.selectedRowId.filter((rowId) => validRowId.includes(rowId));

    this.selectAllUpdate();
    this.selectDispatch();
  }

  selectDispatch() {
    window.dispatchEvent(
      new CustomEvent(this.tableElement.id + '-select', {
        detail: { selectedRowId: this.selectedRowId },
      })
    );
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Stockage /////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  storeSetup() {
    if (!this.storing) {
      return;
    }

    // Crée et enregistre l'état initial s'il n'existe pas
    this.storeSaveTo('initial');

    // Quand on clique sur le bouton de réinitialisation, on charge l'état initial
    // s'il existe et on l'enregistre comme état courant
    this.resetButtonTarget.addEventListener('click', () => {
      this.storeLoadFrom('initial');
      this.storeSaveTo('current');
      this.redrawStore();
    });
  }

  storeLoadFrom(stateName) {
    const existingStates = this.dataTable.stateRestore.states().map((s) => s.s.identifier);
    if (existingStates.includes(stateName)) {
      this.dataTable.stateRestore.state(stateName).load();
      return true;
    } else {
      return false;
    }
  }

  storeSaveTo(stateName) {
    if (!this.storing) {
      return;
    }

    // On ajoute le nouvel état s'il n'existe pas, où on le met à jour sinon
    const existingStates = this.dataTable.stateRestore.states().map((s) => s.s.identifier);
    if (!existingStates.includes(stateName)) {
      this.dataTable.stateRestore.state.add(stateName);
    } else {
      this.dataTable.stateRestore.state(stateName).save();
    }
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Export PDF/CSV ///////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  exportSetup() {
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

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Redraw ///////////////////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  redrawInit() {
    if (this.storeLoadFrom('current')) {
      this.redrawStore();
    } else {
      this.redrawNormal();
    }
  }

  redrawStore() {
    // Mettre à jour la recherche, les tri, les filtres, la pagination complète et la sélection
    this.searchRedraw();
    this.sortRedraw();
    this.filterRedraw();
    this.paginationRedraw();
    this.selectRedraw();
  }

  redrawNormal(mode = 'full-reset') {
    // Recalculer la page courante uniquement OU tous les filtres/recherche/tri + retour à la première page
    this.dataApi.draw(mode);

    // Stocke le nouvel état du tableau
    this.storeSaveTo('current');

    // Mettre à jour la pagination, la sélection et le nombre de lignes affichées
    this.paginationRedraw();
    this.selectAllUpdate();
  }

  /////////////////////////////////////////////////////////////////////////////
  ////////////////////////////// Fonctions communes ///////////////////////////
  /////////////////////////////////////////////////////////////////////////////

  hideFilterElement(fieldset, button) {
    fieldset.classList.add('fr-hidden');
    button.setAttribute('aria-expanded', false);
  }

  showFilterElement(fieldset, button) {
    fieldset.classList.remove('fr-hidden');
    button.setAttribute('aria-expanded', true);
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
    return parseInt(element.getAttribute('data-global--datatable-column'), 10);
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
