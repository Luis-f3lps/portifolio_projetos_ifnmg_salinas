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

                // --- INÍCIO DA MODIFICAÇÃO ---

                // Variável para armazenar o HTML da imagem
                let imagemHtml;

                // Cria a tag da imagem
                const imagemTag = `<img src="${livro.link_capa || 'images/placeholder.png'}" alt="Capa do livro ${livro.titulo}">`;

                // Verifica se o link do livro existe
                if (livro.link_livro) {
                    // Se existir, envolve a imagem com a tag <a> para torná-la um link
                    imagemHtml = `<a href="${livro.link_livro}" target="_blank">${imagemTag}</a>`;
                } else {
                    // Se não existir, usa apenas a imagem (sem link)
                    imagemHtml = imagemTag;
                }

                // Define o conteúdo HTML usando os dados do livro e a imagem (com ou sem link)
                livroElemento.innerHTML = `
                    <div class="about-col-4">
                        ${imagemHtml}
                    </div>

                `;
                                    // <div class="sobre">
                        //<h1 class="sub-title">${livro.titulo || 'Título não disponível'}</h1>
                        //<p><strong>Autor:</strong> ${livro.nome_coordenador || 'Autor não disponível'}</p>
                        //<p>${livro.descricao || 'Descrição não disponível.'}</p>
                       // ${livro.link_livro ? `<a href="${livro.link_livro}" target="_blank">Ler livro</a>` : ''}
                    //</div>
                // --- FIM DA MODIFICAÇÃO ---
                
                // Adiciona o elemento do livro ao container na página
                container.appendChild(livroElemento);
            });
        })
        .catch(error => console.error('Erro ao carregar os livros:', error)); // Adicionado para tratar possíveis erros
}