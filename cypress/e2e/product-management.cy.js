describe('User authentication and management', () => {
  const uniqueId = Date.now();

  const adminUser = {
    nome: 'Administrator Test',
    email: `admin.product.${uniqueId}@teste.com`,
    password: 'teste123',
  };

  const standardUser = {
    nome: 'Standard User Test',
    email: `standard.product.${uniqueId}@teste.com`,
    password: 'teste123',
  };

  const existingProduct = {
    nome: `Existing Product ${uniqueId}`,
    preco: '10',
    descricao: 'Teste',
    quantidade: '10',
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
    cy.contains('Serverest Store', { timeout: 15000 })
      .should('be.visible');
    cy.get('[data-testid="logout"]').click();

    cy.get('[data-testid="email"]').type(adminUser.email);
    cy.get('[data-testid="senha"]').type(adminUser.password);
    cy.get('[data-testid="entrar"]').click();
    cy.contains('Bem Vindo').should('be.visible');

    cy.get('[data-testid="cadastrar-produtos"]').click();
    cy.get('[data-testid="nome"]').type(existingProduct.nome);
    cy.get('[data-testid="preco"]').type(existingProduct.preco);
    cy.get('[data-testid="descricao"]').type(existingProduct.descricao);
    cy.get('[data-testid="quantity"]').type(existingProduct.quantidade);
    cy.get('[data-testid="cadastarProdutos"]').click();
    cy.contains(existingProduct.nome).should('be.visible');

    cy.get('[data-testid="logout"]').click();
  });

  beforeEach(() => {
    cy.visit('/login');

    cy.url().should('include', '/login');
    cy.contains('Login').should('be.visible');
    cy.contains('Entrar').should('be.visible');
    cy.contains('Login').should('be.visible');
    cy.get('[data-testid="email"]').type(adminUser.email);
    cy.get('[data-testid="senha"]').type(adminUser.password);
    cy.get('[data-testid="entrar"]').click();
    cy.contains('Bem Vindo').should('be.visible');
  });

  describe('Product management', () => {
    context('Product registration validation', () => {
      it('TC21 - Should display validation messages when required product fields are empty', () => {
        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="preco"]').type('100');
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="quantity"]').type('10');
        cy.get('[data-testid="imagem"]').selectFile('cypress/fixtures/product-image.png');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Nome é obrigatório').should('be.visible');

        cy.get('[data-testid="preco"]').clear();
        cy.get('[data-testid="nome"]').type('Teste');
        cy.get('[data-testid="descricao"]').clear().type('Teste');
        cy.get('[data-testid="quantity"]').clear().type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Preco deve ser um número').should('be.visible');

        cy.get('[data-testid="descricao"]').clear();
        cy.get('[data-testid="preco"]').type('100');
        cy.get('[data-testid="nome"]').clear().type('Teste');
        cy.get('[data-testid="quantity"]').clear().type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Descricao não pode ficar em branco')
          .should('be.visible');

        cy.get('[data-testid="quantity"]').clear();
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="preco"]').clear().type('100');
        cy.get('[data-testid="nome"]').clear().type('Teste');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Quantidade deve ser um número').should('be.visible');
      });

      it('TC23 - Should prevent product registration with an invalid price', () => {
        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="nome"]').type('Teste');
        cy.get('[data-testid="preco"]').type('-10');
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="quantity"]').type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Preco deve ser um número positivo').should('be.visible');

        cy.get('[data-testid="nome"]').clear().type('Teste');
        cy.get('[data-testid="preco"]').clear().type('100000000000000000000000000000');
        cy.get('[data-testid="descricao"]').clear().type('Teste');
        cy.get('[data-testid="quantity"]').clear().type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Preco não pode ser maior que 9007199254740991').should('be.visible');
      });

      it('TC25 - Should prevent product registration with an invalid quantity', () => {
        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="nome"]').type('Teste');
        cy.get('[data-testid="preco"]').type('10');
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="quantity"]').type('-10');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Quantidade deve ser maior ou igual a 0').should('be.visible');

        cy.get('[data-testid="nome"]').clear().type('Teste');
        cy.get('[data-testid="preco"]').clear().type('10');
        cy.get('[data-testid="descricao"]').clear().type('Teste');
        cy.get('[data-testid="quantity"]').clear().type('100000000000000000000000000000');
        cy.get('[data-testid="cadastarProdutos"]').click();
        cy.contains('Quantidade não pode ser maior que 9007199254740991').should('be.visible');
      });

      it('TC26 - Should prevent registration of a product with an existing name', () => {
        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="nome"]').type(existingProduct.nome);
        cy.get('[data-testid="preco"]').type(existingProduct.preco);
        cy.get('[data-testid="descricao"]').type(existingProduct.descricao);
        cy.get('[data-testid="quantity"]').type(existingProduct.quantidade);
        cy.get('[data-testid="cadastarProdutos"]').click();

        cy.contains('Já existe produto com esse nome').should('be.visible');
      });
    });

    context('Product lifecycle', () => {
      it('TC28 - Should display the registered product with the correct data in the admin product list', () => {
        const newProduct = `Product.${Date.now()}`;

        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="nome"]').type(newProduct);
        cy.get('[data-testid="preco"]').type('10');
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="quantity"]').type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();

        cy.contains('Lista dos Produtos').should('be.visible');
        cy.contains(newProduct).should('be.visible');
      });

      it('TC29 - Should display the registered product correctly in the store for a standard user', () => {
        const newProduct = `Product.${Date.now()}`;

        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="nome"]').type(newProduct);
        cy.get('[data-testid="preco"]').type('10');
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="quantity"]').type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();

        cy.contains('Lista dos Produtos').should('be.visible');
        cy.contains(newProduct).should('be.visible');

        cy.get('[data-testid="logout"]').click();
        cy.get('[data-testid="email"]').type(standardUser.email);
        cy.get('[data-testid="senha"]').type(standardUser.password);
        cy.get('[data-testid="entrar"]').click();

        cy.contains(newProduct).should('be.visible');
        cy.get('[data-testid="pesquisar"]').type(newProduct);
        cy.get('[data-testid="botaoPesquisar"]').click();
        cy.contains(newProduct).should('be.visible');
      });

      it('TC30 - Should delete a registered product', () => {
        const newProduct = `Product.${Date.now()}`;

        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="nome"]').type(newProduct);
        cy.get('[data-testid="preco"]').type('10');
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="quantity"]').type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();

        cy.contains('Lista dos Produtos').should('be.visible');
        cy.contains(newProduct).should('be.visible');

        cy.contains('tr', newProduct).should('be.visible').within(() => {
          cy.contains('button', 'Excluir').click();
        });

        cy.contains('tr', newProduct).should('not.exist');

        cy.get('[data-testid="logout"]').click();
        cy.get('[data-testid="email"]').type(standardUser.email);
        cy.get('[data-testid="senha"]').type(standardUser.password);
        cy.get('[data-testid="entrar"]').click();

        cy.get('[data-testid="pesquisar"]').type(newProduct);
        cy.get('[data-testid="botaoPesquisar"]').click();
        cy.contains('Nenhum produto foi encontrado').should('be.visible');
      });

      it('TC33 - Should keep the registered product data after refreshing the product list', () => {
        const newProduct = `Product.${Date.now()}`;

        cy.get('[data-testid="cadastrar-produtos"]').click();
        cy.contains('Cadastro de Produtos').should('be.visible');

        cy.get('[data-testid="nome"]').type(newProduct);
        cy.get('[data-testid="preco"]').type('10');
        cy.get('[data-testid="descricao"]').type('Teste');
        cy.get('[data-testid="quantity"]').type('10');
        cy.get('[data-testid="cadastarProdutos"]').click();

        cy.contains('Lista dos Produtos').should('be.visible');
        cy.contains(newProduct).should('be.visible');

        cy.reload(true);

        cy.contains('Lista dos Produtos').should('be.visible');
        cy.contains(newProduct).should('be.visible');
      });
    });
  });
});