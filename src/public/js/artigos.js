
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
// Adiciona um evento que será executado quando a página terminar de carregar
document.addEventListener('DOMContentLoaded', function() {
    carregarArtigos();
});

/**
 * Busca os dados dos artigos na API e atualiza a tabela no HTML.
 */
function carregarArtigos() {
    fetch('/api/artigos')
        .then(response => response.json())
        .then(data => {
            const tbody = document.getElementById('artigos-tbody');
            tbody.innerHTML = ''; // Limpa a tabela antes de adicionar os novos dados

            if (Array.isArray(data)) {
                data.forEach(artigo => {
                    const tr = document.createElement('tr');

                    // Cria o HTML para a linha da tabela
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