
var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");

function opentab(tabname) {
    for (var i = 0; i < tablinks.length; i++) {
        tablinks[i].classList.remove("active-link");
    }
    for (var i = 0; i < tabcontents.length; i++) {
        tabcontents[i].classList.remove("active-tab");
        if (tabcontents[i].id === tabname) {
            tabcontents[i].classList.add("active-tab");
        }
    }
    event.currentTarget.classList.add("active-link");
}

document.querySelectorAll('.submenu > a').forEach(menu => {
    menu.addEventListener('click', function(e) {
        e.preventDefault();
        const submenuItems = this.nextElementSibling;
        submenuItems.classList.toggle('open');
        this.querySelector('.fas.fa-chevron-down').classList.toggle('rotate');
    });
});

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname !== '/index.html') {
        redirecionarSeNaoAutenticado();
    }
});

document.addEventListener('DOMContentLoaded', function() {

    // Carrega os filtros e a primeira página do portfólio ao iniciar
    loadTematicas();
    loadCoordenadores();
    loadPortifolio(1); 

    // Adiciona o evento de 'submit' ao formulário de filtro do portfólio
    document.getElementById('portifolio-filter-form').addEventListener('submit', function(event) {
        event.preventDefault(); // Previne o recarregamento da página
        const tematica = document.getElementById('tematica-select').value;
        const coordenador = document.getElementById('coordenador-select').value;
        loadPortifolio(1, tematica, coordenador); // Carrega a primeira página com os filtros
    });
});

/**
 * Carrega a lista de temáticas para o filtro.
 */
function loadTematicas() {
    fetch('/api/portifolio?limit=1000') // Pega uma grande quantidade para obter todas as temáticas
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('tematica-select');
            const tematicas = [...new Set(data.data.map(item => item.tematica))]; // Cria uma lista de temáticas únicas
            tematicas.sort().forEach(tematica => {
                const option = document.createElement('option');
                option.value = tematica;
                option.textContent = tematica;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar temáticas:', error));
}


/**
 * Carrega a lista de coordenadores para o filtro.
 */
function loadCoordenadores() {
    fetch('/api/coordenadores')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('coordenador-select');
            data.forEach(coordenador => {
                const option = document.createElement('option');
                option.value = coordenador.nome_coordenador;
                option.textContent = coordenador.nome_coordenador;
                select.appendChild(option);
            });
        })
        .catch(error => console.error('Erro ao carregar coordenadores:', error));
}


/**
 * Carrega os dados do portfólio com paginação e filtros.
 * @param {number} page - O número da página a ser carregada.
 * @param {string} tematica - O filtro de temática.
 * @param {string} coordenador - O filtro de coordenador.
 */
function loadPortifolio(page = 1, tematica = '', coordenador = '') {
    const url = `/api/portifolio?page=${page}&limit=20&tematica=${tematica}&coordenador=${coordenador}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (Array.isArray(data.data)) {
                updatePortifolioTable(data.data);
                updatePortifolioPagination(data.totalPages, data.currentPage, tematica, coordenador);
            } else {
                console.error('Formato de resposta inesperado:', data);
                alert('Erro ao carregar portfólio: Dados recebidos não estão no formato esperado.');
            }
        })
        .catch(error => console.error('Erro ao carregar dados do portfólio:', error));
}

/**
 * Atualiza a tabela do portfólio com os novos dados.
 * @param {Array} entries - Um array de objetos do portfólio.
 */
function updatePortifolioTable(entries) {
    const tbody = document.getElementById('portifolio-tbody');
    tbody.innerHTML = ''; 

    if (Array.isArray(entries)) {
        entries.forEach(entry => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${entry.id || 'N/A'}</td>
                <td>${entry.processo || 'N/A'}</td>
                <td>${entry.titulo || 'N/A'}</td>
                <td>${entry.tematica || 'N/A'}</td>
                <td>${entry.nome_coordenador || 'N/A'}</td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        console.error('Esperava um array de entradas, mas recebeu:', entries);
        alert('Erro ao atualizar tabela: Dados não estão no formato esperado.');
    }
}

/**
 * Atualiza os botões de paginação.
 * @param {number} totalPages - O número total de páginas.
 * @param {number} currentPage - A página atual.
 * @param {string} tematica - O filtro de temática atual.
 * @param {string} coordenador - O filtro de coordenador atual.
 */
function updatePortifolioPagination(totalPages, currentPage, tematica = '', coordenador = '') {
    const paginationDiv = document.getElementById('pagination-portifolio');
    paginationDiv.innerHTML = ''; 

    for (let i = 1; i <= totalPages; i++) {
        const button = document.createElement('button');
        button.textContent = i;
        button.classList.add('pagination-button');
        if (i === currentPage) {
            button.classList.add('active');
        }
        button.addEventListener('click', () => {
            loadPortifolio(i, tematica, coordenador); // Carrega a página clicada com os filtros atuais
        });
        paginationDiv.appendChild(button);
    }
}