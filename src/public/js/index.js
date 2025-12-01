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

document.querySelectorAll(".submenu > a").forEach((menu) => {
  menu.addEventListener("click", function (e) {
    e.preventDefault();
    const submenuItems = this.nextElementSibling;
    submenuItems.classList.toggle("open");
    this.querySelector(".fas.fa-chevron-down").classList.toggle("rotate");
  });
});

document.addEventListener("DOMContentLoaded", async function () {
  loadTematicas();
  loadCoordenadores();
  loadPortifolio();
  loadAnos();
  carregarDadosEventos();
  carregarDadosTipos();
  carregarStatusProdutos();
  carregarEventosAgrupados();
  try {
    const response = await fetch("/api/stats/tematicas");
    if (!response.ok) throw new Error("Falha ao buscar dados de temáticas");
    const dadosTematicas = await response.json();

    criarGraficoTematicas(dadosTematicas);
    criarGraficoPizzaTematicas(dadosTematicas);
  } catch (error) {
    console.error("Erro ao carregar estatísticas de temáticas:", error);
  }

  criarGraficoPizzaCoordenadores();

  document
    .getElementById("portifolio-filter-form")
    .addEventListener("submit", function (event) {
      event.preventDefault();
      const tematica = document.getElementById("tematica-select").value;
      const coordenador = document.getElementById("coordenador-select").value;
      const ano = document.getElementById("anoProjeto-select").value;
      const titulo = document.getElementById("filtro-titulo").value;
      loadPortifolio(1, tematica, coordenador, ano, titulo);
    });
});
document.addEventListener("DOMContentLoaded", function () {
  const innerContainer = document.getElementById("logoloop-inner");
  const originalList = document.getElementById("original-list");

  if (innerContainer && originalList) {
    setupLogoLoop();
    window.addEventListener("resize", setupLogoLoop);
  }

  function setupLogoLoop() {
    innerContainer
      .querySelectorAll('.logoloop-list[aria-hidden="true"]')
      .forEach((clone) => clone.remove());

    const totalClones = 2;

    for (let i = 0; i < totalClones; i++) {
      const clone = originalList.cloneNode(true);
      clone.removeAttribute("id");
      clone.setAttribute("aria-hidden", "true");
      innerContainer.appendChild(clone);
    }

    const gap =
      parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--logo-gap"
        )
      ) || 0;
    const originalWidth = originalList.offsetWidth + gap;

    innerContainer.style.setProperty("--scroll-distance", `${originalWidth}px`);
  }
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
function criarGraficoPizzaTematicas(data) {
  try {
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

// Gráfico de Barras de Temáticas
function criarGraficoTematicas(data) {
  try {
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

function loadTematicas() {
  fetch("/api/tematicas")
    .then((response) => response.json())
    .then((tematicas) => {
      const select = document.getElementById("tematica-select");

      tematicas.forEach((tematica) => {
        const option = document.createElement("option");
        option.value = tematica;
        option.textContent = tematica;
        select.appendChild(option);
      });
    })
    .catch((error) => console.error("Erro ao carregar temáticas:", error));
}

function loadAnos() {
  fetch("/api/anos")
    .then((response) => response.json())
    .then((anos) => {
      const select = document.getElementById("anoProjeto-select");

      anos.forEach((ano) => {
        const option = document.createElement("option");
        option.value = ano;
        option.textContent = ano;
        select.appendChild(option);
      });
    })
    .catch((error) => console.error("Erro ao carregar anos:", error));
}

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
  coordenador = "",
  ano = "",
  titulo = ""
) {
  const paginationDiv = document.getElementById("pagination-portifolio");
  paginationDiv.innerHTML = "";

  const context = 1;

  const createButton = (page, text, isActive = false, isDisabled = false) => {
    const button = document.createElement("button");
    button.textContent = text || page;
    button.classList.add("pagination-button");

    if (isActive) {
      button.classList.add("active");
    }
    if (isDisabled) {
      button.disabled = true;
      button.classList.add("disabled");
    }

    if (!isDisabled) {
      button.addEventListener("click", () => {
        if (page >= 1 && page <= totalPages) {
          loadPortifolio(page, tematica, coordenador, ano, titulo);
        }
      });
    }
    return button;
  };

  const createEllipsis = () => {
    const span = document.createElement("span");
    span.textContent = "...";
    span.classList.add("pagination-ellipsis");
    return span;
  };

  paginationDiv.appendChild(
    createButton(currentPage - 1, "<", false, currentPage === 1)
  );

  let lastPageShown = 0;

  for (let i = 1; i <= totalPages; i++) {
    const isFirstPage = i === 1;
    const isLastPage = i === totalPages;
    const isInContext =
      i >= currentPage - context && i <= currentPage + context;

    if (isFirstPage || isLastPage || isInContext) {
      if (i > lastPageShown + 1) {
        paginationDiv.appendChild(createEllipsis());
      }

      paginationDiv.appendChild(createButton(i, i, i === currentPage));
      lastPageShown = i;
    }
  }

  paginationDiv.appendChild(
    createButton(currentPage + 1, ">", false, currentPage === totalPages)
  );
}

/**
 * @param {number} page 
 * @param {string} tematica 
 *  * @param {string} titulo 

 * @param {string} coordenador 
 * * @param {string} ano -
 */
async function loadPortifolio(
  page = 1,
  tematica = "",
  coordenador = "",
  ano = "",
  titulo = ""
) {
  const container = document.getElementById("portifolio-tbody");
  const paginationDiv = document.getElementById("pagination-portifolio");

  if (container) {
    container.innerHTML = '<tr><td colspan="4">Carregando...</td></tr>';
  }
  if (paginationDiv) {
    paginationDiv.innerHTML = "";
  }

  try {
    const params = new URLSearchParams({
      page: page,
      limit: 15,
    });
    if (titulo) {
      params.append("titulo", titulo);
    }
    if (tematica) {
      params.append("tematica", tematica);
    }
    if (coordenador) {
      params.append("coordenador", coordenador);
    }
    if (ano) {
      params.append("ano", ano);
    }
    const response = await fetch(`/api/portifolio?${params.toString()}`);
    if (!response.ok) {
      throw new Error("Falha ao carregar dados do portfólio");
    }
    const result = await response.json();

    if (container) {
      container.innerHTML = "";
    } else {
      console.error(
        "Erro: Elemento com ID 'portifolio-tbody' não foi encontrado."
      );
      return;
    }

    if (result.data && result.data.length > 0) {
      result.data.forEach((item) => {
        const row = document.createElement("tr");
        row.innerHTML = `
     <td><strong>${item.titulo}</strong></td>
     <td>${item.tematica}</td>
     <td>${item.nome_coordenador}</td>
      <td>${item.ano || "N/D"}</td>

    `;
        container.appendChild(row);
      });
    } else {
      container.innerHTML =
        '<tr><td colspan="4">Nenhum projeto encontrado.</td></tr>';
    }

    updatePortifolioPagination(
      result.totalPages,
      result.currentPage,
      tematica,
      coordenador,
      ano,
      titulo
    );
  } catch (error) {
    console.error("Erro ao carregar portfólio:", error);
    if (container) {
      container.innerHTML =
        '<tr><td colspan="4">Erro ao carregar dados. Tente novamente.</td></tr>';
    }
  }
}
const PALETA_CORES_EVENTOS = [
  "#007bff", // Azul Primary
  "#6610f2", // Roxo Indigo
  "#6f42c1", // Roxo Uva
  "#e83e8c", // Rosa Pink
  "#dc3545", // Vermelho Danger
  "#fd7e14", // Laranja
  "#ffc107", // Amarelo Warning
  "#28a745", // Verde Success
  "#20c997", // Verde Água
  "#17a2b8", // Ciano Info
  "rgba(235, 235, 235, 1)"
];

async function carregarDadosEventos() {
  try {
    const response = await fetch("/api/graficos/eventos");
    if (!response.ok) {
      throw new Error("Falha na resposta da rede");
    }
    const data = await response.json();
    criarGraficoPizzaEventos(data);
  } catch (error) {
    console.error("Erro ao buscar dados de eventos:", error);
    const container = document.getElementById("graficoPizzaEventos");
    if (container) {
      container.parentElement.innerHTML =
        "<p style='text-align:center; color:red'>Erro ao carregar dados do gráfico.</p>";
    }
  }
}
function criarGraficoPizzaEventos(data) {
  try {
    if (!data || data.length === 0) {
      console.warn("Nenhum dado de evento encontrado para o gráfico.");
      return;
    }

    const labels = data.map((item) => item.evento);
    const values = data.map((item) => parseInt(item.total, 10));
    const totalProdutos = values.reduce((sum, current) => sum + current, 0);

    const canvas = document.getElementById("graficoPizzaEventos");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.meuGraficoEventos instanceof Chart) {
      window.meuGraficoEventos.destroy();
    }

    window.meuGraficoEventos = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Produtos",
            data: values,
            backgroundColor: PALETA_CORES_EVENTOS.slice(0, data.length),
            borderColor: "#fff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: {
            right: 50,
          },
        },
        plugins: {
          legend: {
            position: "right",
            align: "center",
            labels: {
              boxWidth: 15,
              padding: 15,
              font: {
                size: 12,
              },
              generateLabels: function (chart) {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const meta = chart.getDatasetMeta(0);
                    const style = meta.controller.getStyle(i);
                    return {
                      text: label,
                      fillStyle: style.backgroundColor,
                      strokeStyle: style.borderColor,
                      lineWidth: style.borderWidth,
                      hidden:
                        isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                      index: i,
                    };
                  });
                }
                return [];
              },
            },
          },
          title: {
            display: true,
            text: "Produtos por Evento",
            font: { size: 28 },
            position: "top",
            align: "start",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw;
                const percentage = ((value / totalProdutos) * 100).toFixed(1);
                return ` ${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao criar o gráfico de eventos:", error);
  }
}

const PALETA_CORES_TIPOS = [
  "#36A2EB",
  "#4BC0C0",
  "#9966FF",
  "#FF9F40",
  "#FF6384",
  "#FFCD56",
  "#C9CBCF",
];

async function carregarDadosTipos() {
  try {
    const response = await fetch("/api/graficos/tipos");
    if (!response.ok) throw new Error("Erro na rede");
    const data = await response.json();
    criarGraficoPizzaTipos(data);
  } catch (error) {
    console.error("Erro ao buscar dados de tipos:", error);
  }
}

function criarGraficoPizzaTipos(data) {
  try {
    if (!data || data.length === 0) return;

    const labels = data.map((item) => item.tipo_produto);
    const values = data.map((item) => parseInt(item.total, 10));
    const total = values.reduce((sum, current) => sum + current, 0);

    const canvas = document.getElementById("graficoPizzaTipos");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.meuGraficoTipos instanceof Chart) {
      window.meuGraficoTipos.destroy();
    }

    window.meuGraficoTipos = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Quantidade",
            data: values,
            backgroundColor: PALETA_CORES_TIPOS,
            borderColor: "#fff",
            borderWidth: 2,
            radius: 200,  // <--- VALOR FIXO (Sem aspas, sem %)
            cutout: "80%", // O buraco será 60% desse raio fixo
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: 20 },
        },
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 15,
              padding: 15,
              font: { size: 12 },
            },
          },
          title: {
            display: true,
            text: "Produtos por Tipo",
            font: { size: 24 },
            position: "top",
            align: "start",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return ` ${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao criar o gráfico de tipos:", error);
  }
}

async function carregarStatusProdutos() {
  try {
    const response = await fetch("/api/graficos/status-produtos");
    if (!response.ok) throw new Error("Erro na rede");
    const data = await response.json();
    criarGraficoStatusProdutos(data);
  } catch (error) {
    console.error("Erro ao buscar status de produtos:", error);
  }
}
function criarGraficoStatusProdutos(data) {
  try {
    if (!data) return;

    const comProduto = parseInt(data.com_produto, 10);
    const semProduto = parseInt(data.sem_produto, 10);
    const total = comProduto + semProduto;

    const canvas = document.getElementById("graficoStatusProdutos");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (window.meuGraficoStatus instanceof Chart) {
      window.meuGraficoStatus.destroy();
    }

    window.meuGraficoStatus = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: ["Com Produto", "Sem Produto"],
        datasets: [
          {
            data: [comProduto, semProduto],
            backgroundColor: ["#2ecc71", "#e74c3c"],
            borderColor: "#fff",
            borderWidth: 2,
            radius: 200, // <--- O MESMO VALOR FIXO AQUI
            cutout: "80%",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { right: 20 },
        },
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 15,
              padding: 15,
              font: { size: 12 },
            },
          },
          title: {
            display: true,
            text: "Portfólios com vs. Sem Produtos",
            font: { size: 24 },
            position: "top",
            align: "start",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return ` ${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao criar o gráfico de status:", error);
  }
}
async function carregarEventosAgrupados() {
  try {
    const response = await fetch("/api/graficos/eventos-agrupados");
    if (!response.ok) throw new Error("Erro na rede");
    const data = await response.json();
    criarGraficoAgrupado(data);
  } catch (error) {
    console.error("Erro ao buscar eventos agrupados:", error);
  }
}

function criarGraficoAgrupado(data) {
  try {
    if (!data || data.length === 0) return;

    const labels = data.map((item) => item.evento);
    const values = data.map((item) => parseInt(item.total, 10));
    const total = values.reduce((sum, current) => sum + current, 0);

    const ctx = document
      .getElementById("graficoPizzaEventosAgrupado")
      .getContext("2d");

    if (window.meuGraficoAgrupado instanceof Chart) {
      window.meuGraficoAgrupado.destroy();
    }

    window.meuGraficoAgrupado = new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Produtos",
            data: values,
            backgroundColor: PALETA_CORES_EVENTOS,
            borderColor: "#fff",
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { right: 50 } },
        plugins: {
          legend: {
            position: "right",
            labels: {
              boxWidth: 15,
              padding: 15,
              font: { size: 12 },
              generateLabels: (chart) => {
                const data = chart.data;
                if (data.labels.length && data.datasets.length) {
                  return data.labels.map((label, i) => {
                    const meta = chart.getDatasetMeta(0);
                    const style = meta.controller.getStyle(i);
                    return {
                      text: label,
                      fillStyle: style.backgroundColor,
                      strokeStyle: style.borderColor,
                      lineWidth: style.borderWidth,
                      hidden:
                        isNaN(data.datasets[0].data[i]) || meta.data[i].hidden,
                      index: i,
                    };
                  });
                }
                return [];
              },
            },
          },
          title: {
            display: true,
            text: "Produtos por Eventos Agrupados",
            font: { size: 28 },
            position: "top",
            align: "start",
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return ` ${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("Erro ao criar gráfico agrupado:", error);
  }
}
