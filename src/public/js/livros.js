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
            container.innerHTML = ''; 
            // Itera sobre cada livro retornado pela API
            data.forEach(livro => {
                const livroElemento = document.createElement('div');
                livroElemento.classList.add('row'); 

                let imagemHtml;

                const imagemTag = `<img src="${livro.link_capa || 'images/placeholder.png'}" alt="Capa do livro ${livro.titulo}">`;

                // Verifica se o link do livro existe
                if (livro.link_livro) {
                    // Se existir, envolve a imagem com a tag <a> para torná-la um link
                    imagemHtml = `<a href="${livro.link_livro}" target="_blank">${imagemTag}</a>`;
                } else {
                    // Se não existir, usa apenas a imagem 
                    imagemHtml = imagemTag;
                }

                // Define o conteúdo HTML usando os dados do livro e a imagem
                livroElemento.innerHTML = `
                    <div class="about-col-4">
                        ${imagemHtml}
                    </div>

                `;
                container.appendChild(livroElemento);
            });
        })
        .catch(error => console.error('Erro ao carregar os livros:', error)); 
}