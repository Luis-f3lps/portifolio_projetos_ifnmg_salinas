
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
}); document.addEventListener('DOMContentLoaded', function () {
    carregarResumosSimples();
    carregarEventosNoSelect();
    setupFilters();
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
                    // Mantemos isso aqui para o filtro continuar funcionando
                    tr.setAttribute('data-evento', resumo.evento || '');

                    // Lógica para decidir se mostra Imagem ou Texto
                    let conteudoEvento = 'N/A';
                    if (resumo.link_imagem_fundo) {
                        // Cria uma imagem com altura fixa de 50px para não quebrar a tabela
                        // O 'title' mostra o nome do evento quando passa o mouse
                        conteudoEvento = `<img src="${resumo.link_imagem_fundo}" alt="${resumo.evento}" title="${resumo.evento}" style="height: 70px; width: auto; border-radius: 4px; object-fit: cover;">`;
                    } else {
                        conteudoEvento = resumo.evento || 'N/A';
                    }

                    tr.innerHTML = `
                        <td style="text-align: center;">${conteudoEvento}</td>
                        <td>${resumo.titulo || 'N/A'}</td>
                        <td>${resumo.autores || 'N/A'}</td>
                        <td>
                            ${resumo.link_pdf ? `<a href="${resumo.link_pdf}" target="_blank">Acessar PDF</a>` : 'Link indisponível'}
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        })
        .catch(error => console.error('Erro ao carregar os resumos:', error));
}

function carregarEventosNoSelect() {
    fetch('/api/eventos')
        .then(response => response.json())
        .then(data => {
            const select = document.getElementById('filtro-evento');
            if (Array.isArray(data)) {
                data.forEach(evento => {
                    const option = document.createElement('option');
                    option.value = evento.nome;
                    option.textContent = evento.nome;
                    select.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Erro ao carregar eventos:', error));
}

function setupFilters() {
    const inputTitulo = document.getElementById('filtro-titulo');
    const selectEvento = document.getElementById('filtro-evento');
    const tabelaBody = document.getElementById('resumos-tbody');

    function filtrarTabela() {
        const termo = inputTitulo.value.toLowerCase().trim();
        const eventoSelecionado = selectEvento.value;
        const linhas = tabelaBody.getElementsByTagName('tr');

        for (let i = 0; i < linhas.length; i++) {
            const linha = linhas[i];
            const celulaTitulo = linha.getElementsByTagName('td')[0];
            const eventoDaLinha = linha.getAttribute('data-evento');
            if (celulaTitulo) {
                const titulo = celulaTitulo.textContent.toLowerCase();

                const bateTexto = titulo.includes(termo);

                const bateEvento = eventoSelecionado === "" || eventoDaLinha === eventoSelecionado;

                if (bateTexto && bateEvento) {
                    linha.style.display = "";
                } else {
                    linha.style.display = "none";
                }
            }
        }
    }

    inputTitulo.addEventListener('input', filtrarTabela);
    selectEvento.addEventListener('change', filtrarTabela);
}