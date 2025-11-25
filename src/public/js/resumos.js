
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
    carregarResumosSimples();
    setupSearchFilter();
});

function carregarResumosSimples() {
    fetch('/api/resumos-simples')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('resumos-tbody');
            tbody.innerHTML = ''; 

            if (Array.isArray(data)) {
                data.forEach(resumo => {
                    const tr = document.createElement('tr');

                    tr.innerHTML = `
                        <td>${resumo.titulo || 'N/A'}</td>
                        <td>${resumo.autores || 'N/A'}</td>
                        <td>${resumo.evento || 'N/A'}</td>
                        <td>
                            ${resumo.link_pdf ? `<a href="${resumo.link_pdf}" target="_blank">Acessar Resumo Simples</a>` : 'Link indisponível'}
                        </td>
                    `;

                    tbody.appendChild(tr);
                });
            } else {
                console.error('Formato de resposta inesperado:', data);
            }
        })
        .catch(error => console.error('Erro ao carregar os resumos:', error));
}

function setupSearchFilter() {
    const filtro = document.getElementById('filtro-titulo');
    const tabelaBody = document.getElementById('resumos-tbody');

    if (!filtro || !tabelaBody) {
        console.error("Elemento de filtro ou tabela não encontrado.");
        return;
    }

    filtro.addEventListener('input', function () {
        const termoBusca = this.value.toLowerCase().trim();
        const linhas = tabelaBody.getElementsByTagName('tr');

        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i];
            const celulaTitulo = linha.getElementsByTagName('td')[0]; 

            if (celulaTitulo) {
                const titulo = celulaTitulo.textContent.toLowerCase();

                if (titulo.includes(termoBusca)) {
                    linha.style.display = ""; 
                } else {
                    linha.style.display = "none"; 
                }
            }
        }
    });
}
