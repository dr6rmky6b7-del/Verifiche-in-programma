/* script.js gestisce la visualizzazione e la persistenza delle verifiche */

var STORAGE_KEY = 'verifiche_app_data';
var verifiche = [];
var modificaId = null;
var currentSort = {
    field: 'data',
    direction: 'asc'
};

function getFormValues() {
    return {
        id: modificaId || Date.now().toString(),
        materia: document.getElementById('materia').value.trim(),
        data: document.getElementById('data').value,
        argomento: document.getElementById('argomento').value.trim(),
        difficolta: document.getElementById('difficolta').value,
        importanza: document.getElementById('importanza').value
    };
}

function validateVerifica(verifica) {
    if (!verifica.materia) {
        alert('Inserisci la materia.');
        return false;
    }
    if (!verifica.data) {
        alert('Inserisci la data della verifica.');
        return false;
    }
    if (!verifica.argomento) {
        alert('Inserisci l\'argomento.');
        return false;
    }
    return true;
}

function saveVerificheToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(verifiche));
}

function loadVerificheFromStorage() {
    var stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
        try {
            var parsed = JSON.parse(stored);
            verifiche = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            verifiche = [];
        }
    } else {
        verifiche = [];
    }
}

function cleanupPastVerifiche() {
    var today = new Date();
    var formattedToday = today.toISOString().split('T')[0];
    var originalCount = verifiche.length;
    verifiche = verifiche.filter(function(item) {
        return item.data >= formattedToday;
    });
    if (verifiche.length !== originalCount) {
        saveVerificheToStorage();
    }
}

function ensureStorageKey() {
    if (!localStorage.getItem(STORAGE_KEY)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    }
}

function compareVerifiche(a, b, field) {
    if (field === 'data') {
        return a.data.localeCompare(b.data);
    }
    if (field === 'difficolta' || field === 'importanza') {
        return Number(a[field]) - Number(b[field]);
    }
    return String(a[field]).localeCompare(String(b[field]), 'it', { sensitivity: 'base' });
}

function sortCurrentVerifiche() {
    if (!currentSort.field) {
        return;
    }
    verifiche.sort(function(a, b) {
        var result = compareVerifiche(a, b, currentSort.field);
        return currentSort.direction === 'asc' ? result : -result;
    });
}

function sortVerifiche(field) {
    if (currentSort.field === field) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
    } else {
        currentSort.field = field;
        currentSort.direction = 'asc';
    }
    renderVerifiche();
    updateSortIndicators();
}

function updateSortIndicators() {
    var headers = document.querySelectorAll('#verifiche-table th.sortable');
    headers.forEach(function(header) {
        var indicator = header.querySelector('.sort-indicator');
        if (!indicator) {
            return;
        }
        if (header.dataset.sortField === currentSort.field) {
            indicator.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';
        } else {
            indicator.textContent = '';
        }
    });
}

function renderVerifiche() {
    sortCurrentVerifiche();
    var tbody = document.getElementById('verifiche-body');
    tbody.innerHTML = '';

    if (verifiche.length === 0) {
        var emptyRow = document.createElement('tr');
        var emptyCell = document.createElement('td');
        emptyCell.setAttribute('colspan', '7');
        emptyCell.textContent = 'Nessuna verifica registrata.';
        emptyCell.style.textAlign = 'center';
        emptyRow.appendChild(emptyCell);
        tbody.appendChild(emptyRow);
        return;
    }

    verifiche.forEach(function(verifica) {
        var row = document.createElement('tr');

        var materiaCell = document.createElement('td');
        materiaCell.textContent = verifica.materia;
        row.appendChild(materiaCell);

        var dataCell = document.createElement('td');
        dataCell.textContent = verifica.data;
        row.appendChild(dataCell);

        var argomentoCell = document.createElement('td');
        argomentoCell.textContent = verifica.argomento;
        row.appendChild(argomentoCell);

        var difficoltaCell = document.createElement('td');
        difficoltaCell.textContent = verifica.difficolta;
        row.appendChild(difficoltaCell);

        var importanzaCell = document.createElement('td');
        importanzaCell.textContent = verifica.importanza;
        row.appendChild(importanzaCell);

        var actionsCell = document.createElement('td');
        actionsCell.classList.add('actions-cell');

        var editButton = document.createElement('button');
        editButton.type = 'button';
        editButton.textContent = 'Modifica';
        editButton.classList.add('button', 'action-button');
        editButton.addEventListener('click', function() {
            editVerifica(verifica.id);
        });

        var deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.textContent = 'Elimina';
        deleteButton.classList.add('button', 'action-button', 'secondary');
        deleteButton.addEventListener('click', function() {
            deleteVerifica(verifica.id);
        });

        actionsCell.appendChild(editButton);
        actionsCell.appendChild(deleteButton);
        row.appendChild(actionsCell);

        var selectCell = document.createElement('td');
        var checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.name = 'seleziona-verifica';
        checkbox.setAttribute('data-id', verifica.id);
        selectCell.appendChild(checkbox);
        row.appendChild(selectCell);

        tbody.appendChild(row);
    });
}

function resetForm() {
    document.getElementById('materia').value = '';
    document.getElementById('data').value = '';
    document.getElementById('argomento').value = '';
    document.getElementById('difficolta').value = 50;
    document.getElementById('importanza').value = 50;
    document.getElementById('difficolta-value').textContent = 50;
    document.getElementById('importanza-value').textContent = 50;
    modificaId = null;
    document.getElementById('aggiungi').textContent = 'Aggiungi';
    var annullaButton = document.getElementById('annulla');
    if (annullaButton) {
        annullaButton.style.display = 'none';
    }
}

function updateFormForEdit(verifica) {
    modificaId = verifica.id;
    document.getElementById('materia').value = verifica.materia;
    document.getElementById('data').value = verifica.data;
    document.getElementById('argomento').value = verifica.argomento;
    document.getElementById('difficolta').value = verifica.difficolta;
    document.getElementById('importanza').value = verifica.importanza;
    document.getElementById('difficolta-value').textContent = verifica.difficolta;
    document.getElementById('importanza-value').textContent = verifica.importanza;
    document.getElementById('aggiungi').textContent = 'Salva Modifica';
    var annullaButton = document.getElementById('annulla');
    if (annullaButton) {
        annullaButton.style.display = 'inline-block';
    }
}

function aggiungiVerifica() {
    var verifica = getFormValues();

    if (!validateVerifica(verifica)) {
        return;
    }

    if (modificaId) {
        var index = verifiche.findIndex(function(item) {
            return item.id === modificaId;
        });
        if (index !== -1) {
            verifiche[index] = verifica;
        }
    } else {
        verifiche.push(verifica);
    }

    saveVerificheToStorage();
    renderVerifiche();
    resetForm();
}

function editVerifica(id) {
    var verific = verifiche.find(function(item) {
        return item.id === id;
    });
    if (verific) {
        updateFormForEdit(verific);
    }
}

function deleteVerifica(id) {
    if (!confirm('Sei sicuro di eliminare questa verifica?')) {
        return;
    }
    verifiche = verifiche.filter(function(item) {
        return item.id !== id;
    });
    saveVerificheToStorage();
    renderVerifiche();
    if (modificaId === id) {
        resetForm();
    }
}

function deleteSelectedVerifiche() {
    var selected = document.querySelectorAll('input[name="seleziona-verifica"]:checked');
    if (!selected.length) {
        alert('Seleziona almeno una verifica da rimuovere.');
        return;
    }
    if (!confirm('Eliminare le verifiche selezionate?')) {
        return;
    }
    var idsToRemove = [];
    selected.forEach(function(item) {
        idsToRemove.push(item.getAttribute('data-id'));
    });
    verifiche = verifiche.filter(function(item) {
        return idsToRemove.indexOf(item.id) === -1;
    });
    saveVerificheToStorage();
    renderVerifiche();
    if (modificaId && idsToRemove.indexOf(modificaId) !== -1) {
        resetForm();
    }
}

function initializePage() {
    var aggiungiButton = document.getElementById('aggiungi');
    var annullaButton = document.getElementById('annulla');
    var removeSelectedButton = document.getElementById('rimuovi-selezionati');

    if (aggiungiButton) {
        aggiungiButton.addEventListener('click', aggiungiVerifica);
    }
    if (annullaButton) {
        annullaButton.addEventListener('click', resetForm);
        annullaButton.style.display = 'none';
    }
    if (removeSelectedButton) {
        removeSelectedButton.addEventListener('click', deleteSelectedVerifiche);
    }

    var sortableHeaders = document.querySelectorAll('#verifiche-table th.sortable');
    sortableHeaders.forEach(function(header) {
        header.addEventListener('click', function() {
            sortVerifiche(header.dataset.sortField);
        });
    });
    updateSortIndicators();

    ensureStorageKey();
    loadVerificheFromStorage();
    cleanupPastVerifiche();
    renderVerifiche();
}

function updateSliderValues() {
    var difficoltaSlider = document.getElementById('difficolta');
    var difficoltaValue = document.getElementById('difficolta-value');
    var importanzaSlider = document.getElementById('importanza');
    var importanzaValue = document.getElementById('importanza-value');

    if (difficoltaSlider && difficoltaValue) {
        difficoltaSlider.addEventListener('input', function() {
            difficoltaValue.textContent = this.value;
        });
    }
    if (importanzaSlider && importanzaValue) {
        importanzaSlider.addEventListener('input', function() {
            importanzaValue.textContent = this.value;
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateSliderValues();
    initializePage();
});
