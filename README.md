# Luís Santiago - Portfólio Pessoal

Este portfólio apresenta as habilidades, experiências e certificações, utilizando HTML, CSS e JavaScript.

## Estrutura do Projeto

1. **Home**
   - Breve introdução sobre mim.

2. **Sobre**
   - Informações sobre formação acadêmica e experiência profissional.

3. **Serviços**
   - Lista de serviços oferecidos:
     - Web Design
     - Manutenção de Computadores
     - Desenvolvimento de Sistemas
     - Suporte Técnico
     - Segurança da Informação
     - Desenvolvimento de Apps

4. **Certificações**
   - Galeria de certificações com links para visualização.

5. **Galeria**
   - Imagens de projetos e atividades.

6. **Contato**
   - Informações de contato e formulário para envio de mensagens.

**Tecnologias usadas**
   - HTML5
   - CSS3
   - JavaScript
   - Font Awesome
   - Google Sheets

## Funcionalidades JavaScript


```javascript
var sidemenu = document.getElementById("sidemenu");
function openmenu(){
    sidemenu.style.right = "0";
}
function closemenu(){
    sidemenu.style.right = "-200px";
}

//Tabs
//Alternar entre as abas na seção "Sobre":

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

//Formulário de Contato
//Enviar dados do formulário para o Google Sheets:
const scriptURL = 'https://script.google.com/macros/s/AKfycbxJ-y9bAog5Qsv0CT94kKJED2uXWb3Uv_B6fPRUeCyDPXXJ7lhNMUvBq3dEoqmJo-Pp/exec';
const form = document.forms['submit-to-google-sheet'];

form.addEventListener('submit', e => {
    e.preventDefault();
    fetch(scriptURL, { method: 'POST', body: new FormData(form)})
        .then(response => console.log('Success!', response))
        .catch(error => console.error('Error!', error.message));
});

