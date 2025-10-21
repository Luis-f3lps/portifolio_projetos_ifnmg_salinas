var tablinks = document.getElementsByClassName("tab-links");
var tabcontents = document.getElementsByClassName("tab-contents");

// Paleta de cores para o gráfico de Coordenadores
const PALETA_CORES_COORDENADORES = [
  "rgba(21, 67, 96, 0.9)", // 1. Azul Petróleo Escuro
  "rgba(27, 79, 114, 0.9)",
  "rgba(33, 97, 140, 0.9)",
  "rgba(21, 101, 192, 0.85)", // 4. Azul Escuro
  "rgba(25, 118, 210, 0.85)",
  "rgba(30, 136, 229, 0.85)",
  "rgba(33, 150, 243, 0.85)", // 7. Azul Padrão
  "rgba(66, 165, 245, 0.8)",
  "rgba(100, 181, 246, 0.8)",
  "rgba(144, 202, 249, 0.8)", // 10. Azul Claro
  "rgba(174, 214, 241, 0.8)",
  "rgba(187, 222, 251, 0.8)",
  "rgba(212, 230, 241, 0.8)",
  "rgba(229, 239, 247, 0.8)",
  "rgba(235, 245, 251, 0.8)",
  "rgba(240, 248, 255, 0.8)", // 16. Alice Blue
  "rgba(245, 249, 253, 0.8)", // 17. Azul Gelo (para "Outros")
];

// Paleta de cores diferente para o gráfico de Temáticas
const PALETA_CORES_TEMATICAS = [
  "rgba(211, 47, 47, 0.9)", // 1. Vermelho Escuro
  "rgba(231, 94, 24, 0.9)", // 2. Vermelho Claro
  "rgba(251, 140, 0, 0.9)", // 3. Laranja
  "rgba(255, 167, 38, 0.9)", // 4. Âmbar
  "rgba(255, 193, 7, 0.9)", // 5. Amarelo Laranja
  "rgba(253, 216, 53, 0.9)", // 6. Amarelo
  "rgba(205, 220, 57, 0.9)", // 7. Lima
  "rgba(139, 195, 74, 0.9)", // 8. Verde Limão
  "rgba(76, 175, 80, 0.9)", // 9. Verde
  "rgba(0, 150, 136, 0.9)", // 10. Verde-azulado (Teal)
];

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

document.querySelectorAll(".submenu > a").forEach((menu) => {
  menu.addEventListener("click", function (e) {
    e.preventDefault();
    const submenuItems = this.nextElementSibling;
    submenuItems.classList.toggle("open");
    this.querySelector(".fas.fa-chevron-down").classList.toggle("rotate");
  });
});

document.addEventListener("DOMContentLoaded", async function () { // <-- Adicionado 'async'
 // Carrega os filtros e a primeira página do portfólio
 loadTematicas();
 loadCoordenadores();
 loadPortifolio();
 
 // --- OTIMIZAÇÃO AQUI ---
 try {
  // 1. Busca os dados de temáticas UMA VEZ
  const response = await fetch("/api/stats/tematicas");
  if (!response.ok) throw new Error("Falha ao buscar dados de temáticas");
  const dadosTematicas = await response.json();
 
  // 2. Passa os mesmos dados para as duas funções
  criarGraficoTematicas(dadosTematicas);
  criarGraficoPizzaTematicas(dadosTematicas);
 
 } catch (error) {
  console.error("Erro ao carregar estatísticas de temáticas:", error);
  // Você pode exibir um erro genérico para os gráficos aqui
 }
 // --- FIM DA OTIMIZAÇÃO ---

 // Gráfico de coordenadores (este está separado, o que está correto)
 criarGraficoPizzaCoordenadores();

 // Adiciona o evento de 'submit' ao formulário de filtro do portfólio
 document
  .getElementById("portifolio-filter-form")
  .addEventListener("submit", function (event) {
   event.preventDefault();
   const tematica = document.getElementById("tematica-select").value;
   const coordenador = document.getElementById("coordenador-select").value;
   loadPortifolio(1, tematica, coordenador);
  });
});
// Gráfico 1: Coordenadores
async function criarGraficoPizzaCoordenadores() {
  try {
    const response = await fetch("/api/stats/coordenadores");
    if (!response.ok)
      throw new Error("Falha ao buscar dados dos coordenadores");
    const data = await response.json();

    const LIMITE_PRINCIPAIS = 16;
    let labelsProcessados = [];
    let valuesProcessados = [];

    const dataNumerica = data.map((item) => ({
      ...item,
      total_projetos: parseInt(item.total_projetos, 10),
    }));

    if (dataNumerica.length > LIMITE_PRINCIPAIS) {
      const principais = dataNumerica.slice(0, LIMITE_PRINCIPAIS);
      labelsProcessados = principais.map((item) => item.nome_coordenador);
      valuesProcessados = principais.map((item) => item.total_projetos);

      const outros = dataNumerica.slice(LIMITE_PRINCIPAIS);
      const somaOutros = outros.reduce(
        (soma, item) => soma + item.total_projetos,
        0
      );

      if (somaOutros > 0) {
        labelsProcessados.push("Outros");
        valuesProcessados.push(somaOutros);
      }
    } else {
      labelsProcessados = dataNumerica.map((item) => item.nome_coordenador);
      valuesProcessados = dataNumerica.map((item) => item.total_projetos);
    }

    const totalProjetos = valuesProcessados.reduce(
      (soma, valor) => soma + valor,
      0
    );
    const ctx = document
      .getElementById("graficoPizzaCoordenadores")
      .getContext("2d");

    new Chart(ctx, {
      type: "pie",
      data: {
        labels: labelsProcessados,
        datasets: [
          {
            label: "Projetos",
            data: valuesProcessados,
            backgroundColor: PALETA_CORES_COORDENADORES,
            borderColor: "#fff",
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: "right" },
          title: {
            display: true,
            text: "Projetos por Coordenador",
            font: { size: 36 },
            position: "top",
            align: "start",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw;
                const percentage = ((value / totalProjetos) * 100).toFixed(1);
                return `${label}: ${value} projetos (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao criar o gráfico de coordenadores:", error);
    const container = document.getElementById(
      "graficoPizzaCoordenadores"
    ).parentElement;
    if (container) container.innerHTML = "Não foi possível carregar o gráfico.";
  }
}
// Gráfico 2: Temáticas (Pizza) - Modificado
function criarGraficoPizzaTematicas(data) { // <-- Recebe 'data'
 try {
  // O 'fetch' foi removido daqui

  const labels = data.map((item) => item.tematica);
  const values = data.map((item) => parseInt(item.total_projetos, 10));
  const totalProjetos = values.reduce((sum, current) => sum + current, 0);

  const ctx = document
   .getElementById("graficoPizzaTematicas")
   .getContext("2d");

  new Chart(ctx, {
   type: "pie",
   data: {
    labels: labels,
    datasets: [
     {
      label: "Projetos",
      data: values,
      backgroundColor: PALETA_CORES_TEMATICAS,
      borderColor: "#fff",
      borderWidth: 2,
     },
    ],
   },
   options: {
    responsive: true,
    plugins: {
     legend: { position: "right" },
     title: {
      display: true,
      text: "Projetos por Área Temática",
      font: { size: 36 },
      position: "top",
      align: "start",
     },
     tooltip: {
      callbacks: {
       label: function (context) {
        const label = context.label || "";
        const value = context.raw;
        const percentage = ((value / totalProjetos) * 100).toFixed(1);
        return `${label}: ${value} projetos (${percentage}%)`;
       },
      },
     },
    },
   },
  });
 } catch (error) {
  console.error("Erro ao criar o gráfico de temáticas:", error);
  const container = document.getElementById(
   "graficoPizzaTematicas"
  ).parentElement;
  if (container) container.innerHTML = "Não foi possível carregar o gráfico.";
 }
}

// Gráfico de Barras de Temáticas - Modificado
function criarGraficoTematicas(data) { // <-- Recebe 'data'
 try {
  // O 'fetch' foi removido daqui

  const labels = data.map((item) => item.tematica);
  const values = data.map((item) => parseInt(item.total_projetos, 10));

  const ctx = document.getElementById("graficoTematicas").getContext("2d");

  new Chart(ctx, {
   type: "bar",
   data: {
    labels: labels,
    datasets: [
     {
      label: "Quantidade de Projetos",
      data: values,
      backgroundColor: PALETA_CORES_TEMATICAS,
      borderWidth: 0,
     },
    ],
   },
   options: {
    indexAxis: "y", 
    responsive: true,
    maintainAspectRatio: false,
    scales: {
     y: {
      beginAtZero: true,
      ticks: {
       autoSkip: false,
      },
     },
     x: {
      ticks: {
       stepSize: 1,
      },
     },
    },
    plugins: {
     legend: {
      display: false,
     },
     title: {
      display: true,
      text: "Projetos por Área Temática",
      font: { size: 36 },
     },
    },
   },
  });
 } catch (error) {
  console.error("Erro ao criar o gráfico de barras:", error);
  const container = document.getElementById("graficoTematicas").parentElement;
  if (container) container.innerHTML = "Não foi possível carregar o gráfico.";
 }
}
/**
 * Carrega a lista de temáticas para o filtro.
 */
function loadTematicas() {
 fetch("/api/tematicas") // Apenas busca a lista de temáticas
  .then((response) => response.json())
  .then((tematicas) => { // 'tematicas' agora é um array simples, ex: ['IA', 'Saúde']
   const select = document.getElementById("tematica-select");
   
   // Não precisa mais de new Set() ou .map()
   tematicas.forEach((tematica) => {
    const option = document.createElement("option");
    option.value = tematica;
    option.textContent = tematica;
    select.appendChild(option);
   });
  })
  .catch((error) => console.error("Erro ao carregar temáticas:", error));
}

/**
 * Carrega a lista de coordenadores para o filtro.
 */
function loadCoordenadores() {
  fetch("/api/coordenadores")
    .then((response) => response.json())
    .then((data) => {
      const select = document.getElementById("coordenador-select");
      data.forEach((coordenador) => {
        const option = document.createElement("option");
        option.value = coordenador.nome_coordenador;
        option.textContent = coordenador.nome_coordenador;
        select.appendChild(option);
      });
    })
    .catch((error) => console.error("Erro ao carregar coordenadores:", error));
}


function updatePortifolioPagination(
  totalPages,
  currentPage,
  tematica = "",
  coordenador = ""
) {
  const paginationDiv = document.getElementById("pagination-portifolio");
  paginationDiv.innerHTML = "";

  // Quantas páginas mostrar ao lado da página atual
  const context = 1; 

  /**
   * Helper para criar um botão de paginação
   */
  const createButton = (page, text, isActive = false, isDisabled = false) => {
    const button = document.createElement("button");
    button.textContent = text || page;
    button.classList.add("pagination-button");

    if (isActive) {
      button.classList.add("active");
    }
    if (isDisabled) {
      button.disabled = true;
      button.classList.add("disabled"); // Adiciona classe para estilização
    }

    // Adiciona o evento de clique apenas se não for desabilitado
    if (!isDisabled) {
      button.addEventListener("click", () => {
        // O 'page' aqui será o número da página (ex: 5) ou (currentPage - 1)
        if (page >= 1 && page <= totalPages) {
          loadPortifolio(page, tematica, coordenador);
        }
      });
    }
    return button;
  };

  /**
   * Helper para criar o "..." (ellipsis)
   */
  const createEllipsis = () => {
    const span = document.createElement("span");
    span.textContent = "...";
    span.classList.add("pagination-ellipsis");
    return span;
  };

  // --- 1. Botão "Anterior" (<) ---
  paginationDiv.appendChild(
    createButton(currentPage - 1, "<", false, currentPage === 1)
  );

  let lastPageShown = 0;

  // --- 2. Números das Páginas ---
  for (let i = 1; i <= totalPages; i++) {
    const isFirstPage = i === 1;
    const isLastPage = i === totalPages;
    // Verifica se a página 'i' está no "contexto" da página atual
    const isInContext = i >= currentPage - context && i <= currentPage + context;

    // Se for a primeira, a última ou estiver no contexto, mostre o botão
    if (isFirstPage || isLastPage || isInContext) {
      // Se houver um pulo desde a última página mostrada, adicione "..."
      if (i > lastPageShown + 1) {
        paginationDiv.appendChild(createEllipsis());
      }
      
      // Adiciona o botão da página
      paginationDiv.appendChild(createButton(i, i, i === currentPage));
      lastPageShown = i;
    }
  }

  // --- 3. Botão "Próximo" (>) ---
  paginationDiv.appendChild(
    createButton(currentPage + 1, ">", false, currentPage === totalPages)
  );
}

/**
 * Carrega e exibe os dados do portfólio com paginação e filtros.
 * @param {number} page - O número da página a ser buscada (padrão: 1)
 * @param {string} tematica - O filtro de temática (padrão: "")
 * @param {string} coordenador - O filtro de coordenador (padrão: "")
 */
async function loadPortifolio(page = 1, tematica = "", coordenador = "") {
 
 // 1. Seleciona o container correto da tabela (portifolio-tbody)
 const container = document.getElementById("portifolio-tbody");
 const paginationDiv = document.getElementById("pagination-portifolio");
 
 if (container) {
    // Colspan="3" para bater com as 3 colunas da tabela
  container.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';
 }
 if (paginationDiv) {
  paginationDiv.innerHTML = ""; // Limpa a paginação antiga
 }

 try {
  // 2. Monta a URL com os parâmetros de consulta
  const params = new URLSearchParams({
   page: page,
   limit: 15, // O limite que você definiu no backend
  });
  if (tematica) {
   params.append("tematica", tematica);
  }
  if (coordenador) {
   params.append("coordenador", coordenador);
  }

  // 3. Busca os dados da API
  const response = await fetch(`/api/portifolio?${params.toString()}`);
  if (!response.ok) {
   throw new Error("Falha ao carregar dados do portfólio");
  }
  const result = await response.json();

  // 4. Limpa o container
  if (container) {
   container.innerHTML = "";
  } else {
   // Este erro não deve acontecer, já que o HTML existe
   console.error("Erro: Elemento com ID 'portifolio-tbody' não foi encontrado.");
   return;
  }

  // 5. Renderiza os dados na tabela
  if (result.data && result.data.length > 0) {
   result.data.forEach((item) => {
    const row = document.createElement("tr");
        
        // CORREÇÃO: Renderiza apenas as 3 colunas que existem no <thead>
    row.innerHTML = `
     <td>${item.titulo}</td>
     <td>${item.tematica}</td>
     <td>${item.nome_coordenador}</td>
    `;
    container.appendChild(row);
   });
  } else {
   // Caso não venha nenhum resultado (colspan="3")
   container.innerHTML =
    '<tr><td colspan="3">Nenhum projeto encontrado.</td></tr>';
  }

  // 6. Atualiza os controles de paginação
  updatePortifolioPagination(
   result.totalPages,
   result.currentPage,
   tematica,
   coordenador
  );
  
 } catch (error) {
  console.error("Erro ao carregar portfólio:", error);
  if (container) {
   container.innerHTML =
    '<tr><td colspan="3">Erro ao carregar dados. Tente novamente.</td></tr>';
  }
 }
}