//
// FASE 1: modelagem dos dados (Classe com encapsulamento e validação)
//
class Produto {
    // Atributos privados: só podem ser lidos pelos getters
    #preco;
    #quantidade;

    constructor(nome, preco, quantidade) {
        const nomeLimpo = String(nome).trim();
        const precoNumero = Number(preco);
        const quantidadeNumero = Number(quantidade);

        // Validações: qualquer falha lança um erro
        if (nomeLimpo === "") {
            throw new Error("O nome do produto não pode ficar em branco.");
        }
        if (!Number.isFinite(precoNumero) || precoNumero <= 0) {
            throw new Error("O preço deve ser um número maior que zero.");
        }
        if (!Number.isInteger(quantidadeNumero) || quantidadeNumero <= 0) {
            throw new Error("A quantidade deve ser um número inteiro maior que zero.");
        }

        this.nome = nomeLimpo;
        this.#preco = precoNumero;
        this.#quantidade = quantidadeNumero;
    }

    // Getters: a tabela continua lendo produto.preco e produto.quantidade
    get preco() {
        return this.#preco;
    }

    get quantidade() {
        return this.#quantidade;
    }

    calcularSubtotal() {
        return this.#preco * this.#quantidade;
    }
}

//
// FASE 2: Gerenciamento de Estado (memória)
//
const CHAVE_STORAGE = "estoqueProdutos";
const TEXTO_BOTAO_ADICIONAR = "Adicionar Produtos";
const TEXTO_BOTAO_SALVAR = "Salvar Alterações";

const listaDeProdutos = [];
let indiceEdicao = null; // null = modo inclusão | número = modo edição

const formProduto = document.getElementById("produto-form");
const campoNome = document.getElementById("nome");
const campoPreco = document.getElementById("preco");
const campoQuantidade = document.getElementById("quantidade");
const botaoSalvar = document.getElementById("botao-salvar");
const botaoCancelarEdicao = document.getElementById("cancelar-edicao");
const botaoLimpar = document.getElementById("limpar-tabela");
const tituloTotal = document.getElementById("total-estoque");

const formatoMoeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

//
// Persistência (localStorage)
//
function salvarNoLocalStorage() {
    // Campos privados não aparecem no JSON.stringify, então montamos objetos simples
    const dados = listaDeProdutos.map((p) => ({
        nome: p.nome,
        preco: p.preco,
        quantidade: p.quantidade
    }));
    localStorage.setItem(CHAVE_STORAGE, JSON.stringify(dados));
}

function carregarDoLocalStorage() {
    const texto = localStorage.getItem(CHAVE_STORAGE);
    if (texto === null) return;

    let dados;
    try {
        dados = JSON.parse(texto);
    } catch (erro) {
        localStorage.removeItem(CHAVE_STORAGE); // dado corrompido
        return;
    }
    if (!Array.isArray(dados)) return;

    // Recria cada item como instância da classe (recupera os métodos e as validações)
    dados.forEach((item) => {
        try {
            listaDeProdutos.push(new Produto(item.nome, item.preco, item.quantidade));
        } catch (erro) {
            console.warn("Item inválido ignorado:", item);
        }
    });
}

//
// FASE 3: Eventos do DOM
//
formProduto.addEventListener("submit", function (event) {
    event.preventDefault();

    // Sanitização
    const nome = campoNome.value.trim();
    const preco = parseFloat(campoPreco.value);
    const quantidade = Number(campoQuantidade.value);

    // Guard Clauses
    if (nome === "") {
        alert("Informe o nome do produto!");
        return;
    }
    if (isNaN(preco) || preco <= 0) {
        alert("O preço deve ser um número maior que zero!");
        return;
    }
    if (isNaN(quantidade) || quantidade <= 0) {
        alert("A quantidade deve ser um número maior que zero!");
        return;
    }

    // try/catch: a classe também valida e lança erro sem travar a aplicação
    let novoProduto;
    try {
        novoProduto = new Produto(nome, preco, quantidade);
    } catch (erro) {
        alert(erro.message);
        return;
    }

    if (indiceEdicao === null) {
        listaDeProdutos.push(novoProduto);                 // Create
    } else {
        listaDeProdutos[indiceEdicao] = novoProduto;       // Update
    }

    resetarModoEdicao();
    salvarNoLocalStorage();
    atualizarInterface();
});

botaoCancelarEdicao.addEventListener("click", () => {
    resetarModoEdicao();
    atualizarInterface();
});

botaoLimpar.addEventListener("click", () => {
    if (listaDeProdutos.length === 0) return;
    if (!confirm("Deseja remover todos os produtos do estoque?")) return;

    listaDeProdutos.length = 0;
    localStorage.removeItem(CHAVE_STORAGE);
    resetarModoEdicao();
    atualizarInterface();
});

//
// Modo edição
//
function prepararEdicao(index) {
    const produto = listaDeProdutos[index];

    campoNome.value = produto.nome;
    campoPreco.value = produto.preco;
    campoQuantidade.value = produto.quantidade;

    indiceEdicao = index;
    botaoSalvar.textContent = TEXTO_BOTAO_SALVAR;
    botaoCancelarEdicao.hidden = false;
    campoNome.focus();
    atualizarInterface();
}

function resetarModoEdicao() {
    indiceEdicao = null;
    botaoSalvar.textContent = TEXTO_BOTAO_ADICIONAR;
    botaoCancelarEdicao.hidden = true;
    formProduto.reset();
}

//
// Remoção individual
//
function removerProduto(index) {
    listaDeProdutos.splice(index, 1);

    if (indiceEdicao !== null) {
        if (index === indiceEdicao) {
            resetarModoEdicao();       // removeu o item que estava sendo editado
        } else if (index < indiceEdicao) {
            indiceEdicao--;            // os itens seguintes subiram uma posição
        }
    }

    salvarNoLocalStorage();
    atualizarInterface();
}

//
// FASE 4: Renderização
//
function renderizarTabela() {
    const tabelaBody = document.querySelector("#tabela-produtos tbody");
    tabelaBody.innerHTML = "";

    listaDeProdutos.forEach((produto, index) => {
        const linha = document.createElement("tr");
        if (index === indiceEdicao) linha.classList.add("em-edicao");

        const colNome = document.createElement("td");
        colNome.textContent = produto.nome; // textContent evita injeção de HTML

        const colPreco = document.createElement("td");
        colPreco.textContent = formatoMoeda.format(produto.preco);

        const colQuantidade = document.createElement("td");
        colQuantidade.textContent = produto.quantidade;

        const colSubtotal = document.createElement("td");
        colSubtotal.textContent = formatoMoeda.format(produto.calcularSubtotal());

        const colAcoes = document.createElement("td");

        const botaoEditar = document.createElement("button");
        botaoEditar.type = "button";
        botaoEditar.className = "btn-editar";
        botaoEditar.textContent = "Editar";
        botaoEditar.addEventListener("click", () => prepararEdicao(index));

        const botaoRemover = document.createElement("button");
        botaoRemover.type = "button";
        botaoRemover.className = "btn-remover";
        botaoRemover.textContent = "Remover";
        botaoRemover.addEventListener("click", () => removerProduto(index));

        colAcoes.append(botaoEditar, botaoRemover);
        linha.append(colNome, colPreco, colQuantidade, colSubtotal, colAcoes);
        tabelaBody.appendChild(linha);
    });
}

// Indicador financeiro: soma dos subtotais com reduce
function atualizarTotalEstoque() {
    const total = listaDeProdutos.reduce((soma, produto) => soma + produto.calcularSubtotal(), 0);
    tituloTotal.textContent = `Total em Estoque: ${formatoMoeda.format(total)}`;
}

function atualizarInterface() {
    renderizarTabela();
    atualizarTotalEstoque();
}

//
// Inicialização
//
carregarDoLocalStorage();
atualizarInterface();