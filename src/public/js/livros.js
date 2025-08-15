// Executa quando o conteúdo da página for totalmente carregado
document.addEventListener('DOMContentLoaded', function() {
    carregarLivros();
});

// Função para buscar os livros da API e exibi-los
function carregarLivros() {
    fetch('/api/livros')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('livros-container');
            container.innerHTML = ''; // Limpa o container antes de adicionar os novos dados

            // Itera sobre cada livro retornado pela API
            data.forEach(livro => {
                // Cria o elemento HTML para o livro
                const livroElemento = document.createElement('div');
                livroElemento.classList.add('row'); // Adiciona a classe 'row' para o layout

                // Define o conteúdo HTML usando os dados do livro
                livroElemento.innerHTML = `
                    <div class="about-col-1">
                        <img src="${livro.link_capa || 'images/placeholder.png'}" alt="Capa do livro ${livro.titulo}">
                    </div>
                    <div class="sobre">
                        <h1 class="sub-title">${livro.titulo || 'Título não disponível'}</h1>
                        <p><strong>Autor:</strong> ${livro.nome_coordenador || 'Autor não disponível'}</p>
                        <p>${livro.descricao || 'Descrição não disponível.'}</p>
                        ${livro.link_livro ? `<a href="${livro.link_livro}" target="_blank">Leia mais</a>` : ''}
                    </div>
                `;
                
                // Adiciona o elemento do livro ao container na página
                container.appendChild(livroElemento);
            });
        })
        .catch(error => {
            console.error('Erro ao carregar os livros:', error);
            // Exibe uma mensagem de erro na página
            const container = document.getElementById('livros-container');
            container.innerHTML = '<p>Não foi possível carregar os livros. Tente novamente mais tarde.</p>';
        });
}