
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
    menu.addEventListener('click', function (e) {
        e.preventDefault();
        const submenuItems = this.nextElementSibling;
        submenuItems.classList.toggle('open');
        this.querySelector('.fas.fa-chevron-down').classList.toggle('rotate');
    });
});

document.addEventListener('DOMContentLoaded', function () {
    if (window.location.pathname !== '/index.html') {
        redirecionarSeNaoAutenticado();
    }
});
document.addEventListener('DOMContentLoaded', function () {
    carregarArtigos();
    setupSearchFilter();
});


function carregarArtigos() {
    fetch('/api/artigos')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('artigos-tbody');
            tbody.innerHTML = ''; // Limpa a tabela antes de adicionar os novos dados

            if (Array.isArray(data)) {
                data.forEach(artigo => {
                    const tr = document.createElement('tr');

                    tr.innerHTML = `
                        <td>${artigo.titulo || 'N/A'}</td>
                        <td>${artigo.autores || 'N/A'}</td>
                        <td>
                            ${artigo.link_artigo ? `<a href="${artigo.link_artigo}" target="_blank">Acessar Artigo</a>` : 'Link indisponível'}
                        </td>
                    `;

                    tbody.appendChild(tr);
                });
            } else {
                console.error('Formato de resposta inesperado:', data);
            }
        })
        .catch(error => console.error('Erro ao carregar os artigos:', error));
}
function setupSearchFilter() {
    const filtro = document.getElementById('filtro-titulo');
    const tabelaBody = document.getElementById('artigos-tbody');

    if (!filtro || !tabelaBody) {
        console.error("Elemento de filtro ou tabela não encontrado.");
        return;
    }

    // O evento 'input' dispara a cada letra digitada
    filtro.addEventListener('input', function () {
        const termoBusca = this.value.toLowerCase().trim();
        const linhas = tabelaBody.getElementsByTagName('tr');

        // Itera por todas as linhas (<tr>) da tabela
        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i];
            const celulaTitulo = linha.getElementsByTagName('td')[0]; // Pega a primeira célula (Título)

            if (celulaTitulo) {
                const titulo = celulaTitulo.textContent.toLowerCase();

                // A mágica: se o título incluir o termo da busca, mostra. Senão, esconde.
                if (titulo.includes(termoBusca)) {
                    linha.style.display = ""; // Mostra a linha
                } else {
                    linha.style.display = "none"; // Esconde a linha
                }
            }
        }
    });
}