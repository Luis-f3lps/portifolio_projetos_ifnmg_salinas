
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
            const grid = document.getElementById('artigos-grid');
            if (!grid) return;

            grid.innerHTML = '';

            if (Array.isArray(data) && data.length > 0) {
                data.forEach(artigo => {
                    const card = document.createElement('div');
                    card.className = 'projeto-card';

                    card.innerHTML = `
                        <div class="projeto-card-badge" style="background: rgba(40, 167, 69, 0.15); color: #28a745;">
                            <i class="fa-solid fa-file-lines"></i> Artigo
                        </div>
                        
                        <div class="projeto-card-titulo">${artigo.titulo || 'N/A'}</div>
                        
                        <div class="projeto-card-info" style="margin-bottom: 20px;">
                            <i class="fa-solid fa-users"></i> 
                            <span><strong>Autores:</strong> ${artigo.autores || 'N/A'}</span>
                        </div>
                        
                        <div style="margin-top: auto; display: flex; justify-content: flex-end;">
                            ${artigo.link_artigo ?
                            `<a href="${artigo.link_artigo}" target="_blank" class="btn-artigo">Acessar Artigo <i class="fa-solid fa-arrow-up-right-from-square"></i></a>`
                            : '<span style="color: #888; font-size: 0.9em;">Link indisponível</span>'}
                        </div>
                    `;

                    grid.appendChild(card);
                });
            } else {
                grid.innerHTML = "<p style='color: white; grid-column: 1 / -1; text-align: center; padding: 20px;'>Nenhum artigo encontrado.</p>";
            }
        })
        .catch(error => {
            console.error('Erro ao carregar os artigos:', error);
            const grid = document.getElementById('artigos-grid');
            if (grid) grid.innerHTML = "<p style='color: red; grid-column: 1 / -1; text-align: center;'>Erro ao carregar dados.</p>";
        });
}

function setupSearchFilter() {
    const filtro = document.getElementById('filtro-titulo');
    const grid = document.getElementById('artigos-grid');

    if (!filtro || !grid) {
        console.error("Elemento de filtro ou grid não encontrado.");
        return;
    }

    filtro.addEventListener('input', function () {
        const termoBusca = this.value.toLowerCase().trim();
        const cards = grid.getElementsByClassName('projeto-card');

        for (let i = 0; i < cards.length; i++) {
            const card = cards[i];
            const tituloElement = card.querySelector('.projeto-card-titulo');

            if (tituloElement) {
                const titulo = tituloElement.textContent.toLowerCase();

                if (titulo.includes(termoBusca)) {
                    card.style.display = "";
                } else {
                    card.style.display = "none";
                }
            }
        }
    });
}