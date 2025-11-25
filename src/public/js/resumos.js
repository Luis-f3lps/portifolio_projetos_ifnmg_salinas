
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


let todosResumos = [];

document.addEventListener('DOMContentLoaded', function () {
    carregarDadosIniciais();
    setupFiltroInterno();
});

function carregarDadosIniciais() {
    Promise.all([
        fetch('/api/eventos').then(r => r.json()),
        fetch('/api/resumos-simples').then(r => r.json())
    ]).then(([eventos, resumos]) => {
        todosResumos = resumos;
        renderizarCards(eventos, resumos);
    }).catch(err => console.error(err));
}

function renderizarCards(eventos, resumos) {
    const container = document.getElementById('galeria-eventos');
    container.innerHTML = '';

    if (Array.isArray(eventos)) {
        eventos.forEach(evento => {
            const qtdResumos = resumos.filter(r => r.evento === evento.nome).length;
            
            const div = document.createElement('div');
            div.className = 'card-evento';
            
            if (evento.link_imagem_fundo) {
                div.style.backgroundImage = `url('${evento.link_imagem_fundo}')`;
            } else {
                div.style.backgroundColor = '#007bff'; 
            }

            div.innerHTML = `
                <div class="card-content">
                    <h3>${evento.sigla || evento.nome}</h3>
                    <p>${qtdResumos} resumos</p>
                </div>
            `;

            div.onclick = () => abrirEvento(evento.nome);
            container.appendChild(div);
        });
    }
}

function abrirEvento(nomeEvento) {
    document.getElementById('galeria-eventos').style.display = 'none';
    document.getElementById('painel-resumos').style.display = 'block';
    
    document.getElementById('titulo-evento-ativo').textContent = nomeEvento;
    
    const resumosDoEvento = todosResumos.filter(r => r.evento === nomeEvento);
    preencherTabela(resumosDoEvento);
}

function voltarParaEventos() {
    document.getElementById('painel-resumos').style.display = 'none';
    document.getElementById('galeria-eventos').style.display = 'grid';
    document.getElementById('filtro-interno').value = ''; 
}

function preencherTabela(dados) {
    const tbody = document.getElementById('corpo-tabela-resumos');
    tbody.innerHTML = '';

    dados.forEach(resumo => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${resumo.titulo || 'N/A'}</td>
            <td>${resumo.autores || 'N/A'}</td>
            <td style="text-align: center;">
                ${resumo.link_pdf ? `<a href="${resumo.link_pdf}" target="_blank" class="btn-link">Abrir PDF</a>` : '-'}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setupFiltroInterno() {
    const input = document.getElementById('filtro-interno');
    if (!input) return;

    input.addEventListener('input', function() {
        const termo = this.value.toLowerCase();
        const eventoAtual = document.getElementById('titulo-evento-ativo').textContent;
        
        const filtrados = todosResumos.filter(r => 
            r.evento === eventoAtual && 
            r.titulo.toLowerCase().includes(termo)
        );
        
        preencherTabela(filtrados);
    });
}