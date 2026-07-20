describe('Shopping journey', () => {
  const uniqueId = Date.now();

  const adminUser = {
    nome: 'Administrator Test',
    email: `admin.shopping.${uniqueId}@teste.com`,
    password: 'teste123',
  };

  const standardUser = {
    nome: 'Standard User Test',
    email: `standard.shopping.${uniqueId}@teste.com`,
    password: 'teste123',
  };

  const firstProduct = {
    nome: `Shopping Product One ${uniqueId}`,
    preco: 10,
    descricao: 'Teste',
    quantidade: 10,
  };

  const secondProduct = {
    nome: `Shopping Product Two ${uniqueId}`,
    preco: 20,
    descricao: 'Teste',
    quantidade: 10,
  };

  before(() => {
    cy.visit('/login');

    cy.contains('Não é cadastrado?').should('be.visible');
    cy.get('[data-testid="cadastrar"]').click();
    cy.get('[data-testid="nome"]').type(adminUser.nome);
    cy.get('[data-testid="email"]').type(adminUser.email);
    cy.get('[data-testid="password"]').type(adminUser.password);
    cy.get('[data-testid="checkbox"]').check();
    cy.get('[data-testid="cadastrar"]').click();
    cy.contains('Bem Vindo', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="logout"]').click();

    cy.contains('Não é cadastrado?').should('be.visible');
    cy.get('[data-testid="cadastrar"]').click();
    cy.get('[data-testid="nome"]').type(standardUser.nome);
    cy.get('[data-testid="email"]').type(standardUser.email);
    cy.get('[data-testid="password"]').type(standardUser.password);
    cy.get('[data-testid="cadastrar"]').click();
    cy.contains('Serverest Store', { timeout: 15000 }).should('be.visible');
    cy.get('[data-testid="logout"]').click();

    cy.get('[data-testid="email"]').type(adminUser.email);
    cy.get('[data-testid="senha"]').type(adminUser.password);
    cy.get('[data-testid="entrar"]').click();
    cy.contains('Bem Vindo').should('be.visible');

    cy.get('[data-testid="cadastrar-produtos"]').click();
    cy.get('[data-testid="nome"]').type(firstProduct.nome);
    cy.get('[data-testid="preco"]').type(firstProduct.preco);
    cy.get('[data-testid="descricao"]').type(firstProduct.descricao);
    cy.get('[data-testid="quantity"]').type(firstProduct.quantidade);
    cy.get('[data-testid="cadastarProdutos"]').click();
    cy.contains(firstProduct.nome).should('be.visible');

    cy.get('[data-testid="cadastrar-produtos"]').click();
    cy.get('[data-testid="nome"]').type(secondProduct.nome);
    cy.get('[data-testid="preco"]').type(secondProduct.preco);
    cy.get('[data-testid="descricao"]').type(secondProduct.descricao);
    cy.get('[data-testid="quantity"]').type(secondProduct.quantidade);
    cy.get('[data-testid="cadastarProdutos"]').click();
    cy.contains(secondProduct.nome).should('be.visible');

    cy.get('[data-testid="logout"]').click();
  });

  beforeEach(() => {
    cy.visit('/login');

    cy.url().should('include', '/login');
    cy.contains('Login').should('be.visible');
    cy.contains('Entrar').should('be.visible');
    cy.contains('Login').should('be.visible');
    cy.get('[data-testid="email"]').type(standardUser.email);
    cy.get('[data-testid="senha"]').type(standardUser.password);
    cy.get('[data-testid="entrar"]').click();
    cy.contains('Serverest Store').should('be.visible');
  });

  context('Product discovery', () => {
    it('TC34 - Should search for an existing product', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().find('.card-title').invoke('text').then((productName) => {
        const existingProduct = productName.trim();

        cy.contains(existingProduct).should('be.visible');
        cy.contains(existingProduct).should('contain', firstProduct.nome);
      });
    });

    it('TC35 - Should display no results when searching for a non-existent product', () => {
      cy.get('[data-testid="pesquisar"]').type(`Brazil.${uniqueId}`);
      cy.get('[data-testid="botaoPesquisar"]').click();
      cy.contains('Nenhum produto foi encontrado').should('be.visible');
    });

    it('TC36 - Should display the selected product details correctly', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().find('.card-title').invoke('text').then((productName) => {
        const existingProduct = productName.trim();

        cy.get('.card').first().contains('Detalhes').click();
        cy.contains('Detalhes').should('be.visible');
        cy.contains(existingProduct).should('be.visible');
      });
    });

    it('TC37 - Should return to the store from the product details page', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();
      cy.get('.card').first().contains('Detalhes').click();
      cy.get('[data-testid="voltarHome"]').click();
      cy.contains('Serverest Store').should('be.visible');
    });
  });

  context('Shopping list', () => {
    it('TC38 - Should add a product to the shopping list from the store', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().find('.card-title').invoke('text').then((productName) => {
        const existingProduct = productName.trim();

        cy.get('.card').first().contains('Adicionar a lista').click();
        cy.contains('Lista de Compras').should('be.visible');
        cy.contains(existingProduct).should('be.visible');
      });
    });

    it('TC39 - Should add a product to the shopping list from the product details page', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().find('.card-title').invoke('text').then((productName) => {
        const existingProduct = productName.trim();

        cy.get('.card').first().contains('Detalhes').click();
        cy.contains('Detalhes').should('be.visible');
        cy.contains(existingProduct).should('be.visible');
        cy.get('[data-testid="adicionarNaLista"]').click();
        cy.contains('Lista de Compras').should('be.visible');
        cy.contains(existingProduct).should('be.visible');
      });
    });

    it('TC41 - Should increase and decrease the quantity of a product in the shopping list', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().find('.card-title').invoke('text').then((productName) => {
        const existingProduct = productName.trim();
        const price = firstProduct.preco;

        cy.get('.card').first().contains('Adicionar a lista').click();
        cy.contains('Lista de Compras').should('be.visible');
        cy.contains(existingProduct).should('be.visible');

        cy.get('[data-testid="product-increase-quantity"]').click();
        cy.contains('Total: 2').should('be.visible');
        cy.contains(`Preço R$${price * 2}`).should('be.visible');

        cy.get('[data-testid="product-decrease-quantity"]').click();
        cy.contains('Total: 1').should('be.visible');
        cy.contains(`Preço R$${price}`).should('be.visible');
      });
    });

    it('TC44 - Should prevent the product quantity from being lower than one', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().find('.card-title').invoke('text').then((productName) => {
        const existingProduct = productName.trim();
        const price = firstProduct.preco;

        cy.get('.card').first().contains('Adicionar a lista').click();
        cy.contains('Lista de Compras').should('be.visible');
        cy.contains(existingProduct).should('be.visible');

        cy.get('[data-testid="product-decrease-quantity"]').click();

        cy.contains('Total: 1').should('be.visible');
        cy.contains(`Preço R$${price}`).should('be.visible');
      });
    });

    it('TC45 - Should handle adding the same product to the shopping list more than once', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().find('.card-title').invoke('text').then((productName) => {
        const existingProduct = productName.trim();
        const price = firstProduct.preco;

        cy.get('.card').first().contains('Adicionar a lista').click();
        cy.contains('Lista de Compras').should('be.visible');
        cy.contains(existingProduct).should('be.visible');

        cy.contains('Total: 1').should('be.visible');
        cy.contains(`Preço R$${price}`).should('be.visible');

        cy.get('[data-testid="paginaInicial"]').click();
        cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
        cy.get('[data-testid="botaoPesquisar"]').click();

        cy.get('.card').first().contains('Adicionar a lista').click();
        cy.contains('Lista de Compras').should('be.visible');
        cy.contains(existingProduct).should('be.visible');

        cy.contains('Total: 2').should('be.visible');
        cy.contains(`Preço R$${price * 2}`).should('be.visible');
      });
    });

    it('TC46 - Should clear all products from the shopping list', () => {
      cy.get('[data-testid="pesquisar"]').type(firstProduct.nome);
      cy.get('[data-testid="botaoPesquisar"]').click();

      cy.get('.card').first().then(($firstCard) => {
        const firstProductName = $firstCard.find('.card-title').text().trim();

        cy.wrap($firstCard).contains('Adicionar a lista').click();

        cy.contains('Lista de Compras').should('be.visible');
        cy.contains(firstProductName).should('be.visible');

        cy.get('[data-testid="paginaInicial"]').click();
        cy.get('[data-testid="pesquisar"]').type(secondProduct.nome);
        cy.get('[data-testid="botaoPesquisar"]').click();

        cy.get('.card').first().then(($secondCard) => {
          const secondProductName = $secondCard.find('.card-title').text().trim();

          cy.wrap($secondCard).contains('Adicionar a lista').click();

          cy.contains('Lista de Compras').should('be.visible');
          cy.contains(firstProductName).should('be.visible');
          cy.contains(secondProductName).should('be.visible');

          cy.contains('button', 'Limpar Lista').click();

          cy.contains(firstProductName).should('not.exist');
          cy.contains(secondProductName).should('not.exist');
          cy.contains('Seu carrinho está vazio').should('be.visible');
        });
      });
    });
  });

  context('Navigation and cart availability', () => {
    it('TC48 - Should navigate through the standard user menu options', () => {
      cy.get('[data-testid="lista-de-compras"]').click();
      cy.contains('Lista de Compras').should('be.visible');

      cy.get('[data-testid="paginaInicial"]').click();
      cy.contains('Serverest Store').should('be.visible');

      cy.get('[data-testid="carrinho"]').click();
      cy.contains('Em construção aguarde').should('be.visible');

      cy.get('[data-testid="home"]').click();
      cy.contains('Serverest Store').should('be.visible');
    });

    it('TC49 - Should access the shopping list through the store cart icon', () => {
      cy.get('[data-testid="shopping-cart-button"]').click();
      cy.contains('Lista de Compras').should('be.visible');
    });

    it('TC51 - Should display the under-construction page when proceeding to the cart', () => {
      cy.get('[data-testid="carrinho"]').click();
      cy.contains('Em construção aguarde').should('be.visible');
    });
  });
});