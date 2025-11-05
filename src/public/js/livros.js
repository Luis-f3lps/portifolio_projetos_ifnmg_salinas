document.addEventListener('DOMContentLoaded', function() {
    carregarLivros();
});

function carregarLivros() {
    fetch('/api/livros')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('livros-container');
            container.innerHTML = ''; 
            data.forEach(livro => {
                const livroElemento = document.createElement('div');
                livroElemento.classList.add('row'); 

                let imagemHtml;

                const imagemTag = `<img src="${livro.link_capa || 'images/placeholder.png'}" alt="Capa do livro ${livro.titulo}">`;

                if (livro.link_livro) {
                    imagemHtml = `<a href="${livro.link_livro}" target="_blank">${imagemTag}</a>`;
                } else {
                    imagemHtml = imagemTag;
                }

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