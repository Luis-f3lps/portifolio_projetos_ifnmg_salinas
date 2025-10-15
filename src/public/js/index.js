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

document.addEventListener("DOMContentLoaded", function () {
  // Carrega os filtros e a primeira página do portfólio ao iniciar
  loadTematicas();
  loadCoordenadores();
  loadPortifolio(1);
  criarGraficoTematicas();
  criarGraficoPizzaCoordenadores();
  criarGraficoPizzaTematicas();

  // Adiciona o evento de 'submit' ao formulário de filtro do portfólio
  document
    .getElementById("portifolio-filter-form")
    .addEventListener("submit", function (event) {
      event.preventDefault(); // Previne o recarregamento da página
      const tematica = document.getElementById("tematica-select").value;
      const coordenador = document.getElementById("coordenador-select").value;
      loadPortifolio(1, tematica, coordenador); // Carrega a primeira página com os filtros
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

// Gráfico 2: Temáticas
async function criarGraficoPizzaTematicas() {
  try {
    const response = await fetch("/api/stats/tematicas");
    if (!response.ok) throw new Error("Falha ao buscar dados de temáticas");
    const data = await response.json();

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

async function criarGraficoTematicas() {
  try {
    const response = await fetch("/api/stats/tematicas");
    if (!response.ok) throw new Error("Falha ao buscar dados de temáticas");
    const data = await response.json();

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

            // MUDANÇA 1: Removendo a borda das barras
            borderWidth: 0,
          },
        ],
      },
      options: {
        // MUDANÇA 2: Transformando em gráfico de barras horizontal
        indexAxis: "y", // Isso "deita" o gráfico, colocando os labels no eixo Y

        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              // MUDANÇA 3: Forçando todos os labels a aparecerem
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
            font: { size: 18 },
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
  fetch("/api/portifolio?limit=1000") // Pega uma grande quantidade para obter todas as temáticas
    .then((response) => response.json())
    .then((data) => {
      const select = document.getElementById("tematica-select");
      const tematicas = [...new Set(data.data.map((item) => item.tematica))]; // Cria uma lista de temáticas únicas
      tematicas.sort().forEach((tematica) => {
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

/**
 * Carrega os dados do portfólio com paginação e filtros.
 * @param {number} page - O número da página a ser carregada.
 * @param {string} tematica - O filtro de temática.
 * @param {string} coordenador - O filtro de coordenador.
 */
function loadPortifolio(page = 1, tematica = "", coordenador = "") {
  const url = `/api/portifolio?page=${page}&limit=20&tematica=${tematica}&coordenador=${coordenador}`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (Array.isArray(data.data)) {
        updatePortifolioTable(data.data);
        updatePortifolioPagination(
          data.totalPages,
          data.currentPage,
          tematica,
          coordenador
        );
      } else {
        console.error("Formato de resposta inesperado:", data);
        alert(
          "Erro ao carregar portfólio: Dados recebidos não estão no formato esperado."
        );
      }
    })
    .catch((error) =>
      console.error("Erro ao carregar dados do portfólio:", error)
    );
}

/**
 * Atualiza a tabela do portfólio com os novos dados.
 * @param {Array} entries - Um array de objetos do portfólio.
 */
function updatePortifolioTable(entries) {
  const tbody = document.getElementById("portifolio-tbody");
  tbody.innerHTML = "";

  if (Array.isArray(entries)) {
    entries.forEach((entry) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
                <td>${entry.titulo || "N/A"}</td>
                <td>${entry.tematica || "N/A"}</td>
                <td>${entry.nome_coordenador || "N/A"}</td>
            `;
      tbody.appendChild(tr);
    });
  } else {
    console.error("Esperava um array de entradas, mas recebeu:", entries);
    alert("Erro ao atualizar tabela: Dados não estão no formato esperado.");
  }
}

/**
 * Atualiza os botões de paginação.
 * @param {number} totalPages - O número total de páginas.
 * @param {number} currentPage - A página atual.
 * @param {string} tematica - O filtro de temática atual.
 * @param {string} coordenador - O filtro de coordenador atual.
 */
function updatePortifolioPagination(
  totalPages,
  currentPage,
  tematica = "",
  coordenador = ""
) {
  const paginationDiv = document.getElementById("pagination-portifolio");
  paginationDiv.innerHTML = "";

  for (let i = 1; i <= totalPages; i++) {
    const button = document.createElement("button");
    button.textContent = i;
    button.classList.add("pagination-button");
    if (i === currentPage) {
      button.classList.add("active");
    }
    button.addEventListener("click", () => {
      loadPortifolio(i, tematica, coordenador); // Carrega a página clicada com os filtros atuais
    });
    paginationDiv.appendChild(button);
  }
}
