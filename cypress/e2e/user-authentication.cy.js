describe('User authentication and management', () => {
  const uniqueId = Date.now();

  const adminUser = {
    nome: 'Administrator Test',
    email: `admin.base.${uniqueId}@teste.com`,
    password: 'teste123',
  };
  const standardUser = {
    nome: 'Standard User Test',
    email: `standard.base.${uniqueId}@teste.com`,
    password: 'teste123',
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
  });

  beforeEach(() => {
    cy.visit('/login');

    cy.url().should('include', '/login');
    cy.contains('Login').should('be.visible');
    cy.contains('Entrar').should('be.visible');
  });

  context('Public user registration', () => {
    it('TC01 - Should register an administrator user and log out successfully', () => {
      const newAdminEmail = `admin.${Date.now()}@teste.com`;

      cy.contains('Não é cadastrado?').should('be.visible');
      cy.get('[data-testid="cadastrar"]').click();

      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(newAdminEmail);
      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="checkbox"]').check();
      cy.get('[data-testid="cadastrar"]').click();

      cy.contains('Bem Vindo', { timeout: 15000 }).should('be.visible');

      cy.get('[data-testid="logout"]').should('be.visible').click();
    });

    it('TC02 - Should display validation messages when required registration fields are empty', () => {
      cy.contains('Não é cadastrado?').should('be.visible');
      cy.get('[data-testid="cadastrar"]').click();

      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="checkbox"]').click();
      cy.get('[data-testid="cadastrar"]').click();
      cy.contains('Password é obrigatório').should('be.visible');

      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="email"]').clear();
      cy.get('[data-testid="cadastrar"]').click();
      cy.contains('Email não pode ficar em branco').should('be.visible');

      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="nome"]').clear();
      cy.get('[data-testid="cadastrar"]').click();
      cy.contains('Nome não pode ficar em branco').should('be.visible');
    });

    it('TC03 - Should prevent registration with invalid email formats', () => {
      const invalidEmails = [
        'teste6.com',
        'teste6@',
        'teste6@teste.',
      ];

      cy.contains('Não é cadastrado?').should('be.visible');
      cy.get('[data-testid="cadastrar"]').click();

      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="password"]').type('teste123');

      invalidEmails.forEach((invalidEmail) => {
        cy.get('[data-testid="email"]').clear().type(invalidEmail);

        cy.get('[data-testid="cadastrar"]').click();

        cy.get('[data-testid="email"]').should('have.value', invalidEmail).then(($input) => {
          expect($input[0].checkValidity()).to.be.false;
          expect($input[0].validity.typeMismatch).to.be.true;
        });

        cy.url().should('include', '/cadastrarusuarios');
      });
    });

    it('TC04 - Should prevent registration with an existing email address', () => {
      cy.contains('Não é cadastrado?').should('be.visible');
      cy.get('[data-testid="cadastrar"]').click();

      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="cadastrar"]').click();

      cy.contains('Este email já está sendo usado').should('be.visible');
    });
  });

  context('Authentication', () => {
    it('TC05 - Should log in and log out as an administrator user', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="logout"]').click();
      cy.contains('Login').should('be.visible');
    });

    it('TC06 - Should log in and log out as a standard user', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(standardUser.email);
      cy.get('[data-testid="senha"]').type(standardUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Serverest Store').should('be.visible');

      cy.get('[data-testid="logout"]').click();
      cy.contains('Login').should('be.visible');
    });

    it('TC07 - Should prevent login with invalid credentials', () => {
      cy.contains('Login').should('be.visible');

      cy.get('[data-testid="email"]').type(standardUser.email);
      cy.get('[data-testid="senha"]').type('teste12');
      cy.get('[data-testid="entrar"]').click();
      cy.contains('Email e/ou senha inválidos').should('be.visible');

      cy.get('[data-testid="email"]').clear();
      cy.get('[data-testid="email"]').type('rtes@teste.com');
      cy.get('[data-testid="senha"]').type('3');
      cy.get('[data-testid="entrar"]').click();
      cy.contains('Email e/ou senha inválidos').should('be.visible');

      cy.get('[data-testid="email"]').clear();
      cy.get('[data-testid="email"]').type(standardUser.email);
      cy.get('[data-testid="senha"]').clear();
      cy.get('[data-testid="entrar"]').click();
      cy.contains('Password não pode ficar em branco').should('be.visible');
    });

    it('TC08 - Should prevent a deleted user from logging in', () => {
      const deletedUserEmail = `deleted.${Date.now()}@teste.com`;

      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();
      cy.get('[data-testid="nome"]').type('Deleted User Test');
      cy.get('[data-testid="email"]').type(deletedUserEmail);
      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="cadastrarUsuario"]').click();

      cy.contains('tr', deletedUserEmail).should('be.visible').within(() => {
        cy.contains('button', 'Excluir').click();
      });

      cy.contains('tr', deletedUserEmail).should('not.exist');

      cy.get('[data-testid="logout"]').click();
      cy.get('[data-testid="email"]').type(deletedUserEmail);
      cy.get('[data-testid="senha"]').type('teste123');
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Email e/ou senha inválidos').should('be.visible');
    });
  });

  context('Administrative user management', () => {
    it('TC09 - Should register a new administrator user from the admin area and log in', () => {
      const newAdminEmail = `admin.${Date.now()}@teste.com`;

      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();
      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(newAdminEmail);
      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="checkbox"]').click();
      cy.get('[data-testid="cadastrarUsuario"]').click();

      cy.contains(newAdminEmail).should('be.visible');

      cy.get('[data-testid="logout"]').click();
      cy.get('[data-testid="email"]').type(newAdminEmail);
      cy.get('[data-testid="senha"]').type('teste123');
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="logout"]').click();
      cy.contains('Login').should('be.visible');
    });

    it('TC10 - Should register a new standard user from the admin area and log in', () => {
      const newStandardEmail = `standard.${Date.now()}@teste.com`;

      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();
      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(newStandardEmail);
      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="cadastrarUsuario"]').click();

      cy.contains(newStandardEmail).should('be.visible');

      cy.get('[data-testid="logout"]').click();
      cy.get('[data-testid="email"]').type(newStandardEmail);
      cy.get('[data-testid="senha"]').type('teste123');
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Serverest Store').should('be.visible');

      cy.get('[data-testid="logout"]').click();
      cy.contains('Login').should('be.visible');
    });

    it('TC12 - Should display administrator users with the administrator status set to true', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="listar-usuarios"]').click();
      cy.contains('Lista dos usuários').should('be.visible');

      cy.contains('tr', adminUser.email).should('be.visible').within(() => {
        cy.contains('td', /^true$/).should('be.visible');
      });
    });

    it('TC13 - Should display standard users with the administrator status set to false', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="listar-usuarios"]').click();
      cy.contains('Lista dos usuários').should('be.visible');

      cy.contains('tr', standardUser.email).should('be.visible').within(() => {
        cy.contains('td', /^false$/).should('be.visible');
      });
    });

    it('TC14 - Should display validation messages when required user fields are empty', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();
      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="checkbox"]').click();
      cy.get('[data-testid="cadastrarUsuario"]').click();
      cy.contains('Password é obrigatório').should('be.visible');

      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="email"]').clear();
      cy.get('[data-testid="cadastrarUsuario"]').click();
      cy.contains('Email não pode ficar em branco').should('be.visible');

      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="nome"]').clear();
      cy.get('[data-testid="cadastrarUsuario"]').click();
      cy.contains('Nome não pode ficar em branco').should('be.visible');
    });

    it('TC15 - Should prevent user registration with an invalid email format from the admin area', () => {
      const invalidEmails = [
        'teste6.com',
        'teste6@',
        'teste6@teste.',
      ];

      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();

      invalidEmails.forEach((invalidEmail) => {
        cy.get('[data-testid="email"]').clear().type(invalidEmail);

        cy.get('[data-testid="cadastrarUsuario"]').click();

        cy.get('[data-testid="email"]').should('have.value', invalidEmail).then(($input) => {
          expect($input[0].checkValidity()).to.be.false;
          expect($input[0].validity.typeMismatch).to.be.true;
        });

        cy.url().should('include', '/cadastrarusuarios');
      });
    });

    it('TC16 - Should prevent user registration with an existing email address from the admin area', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();
      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="cadastrarUsuario"]').click();

      cy.contains('Este email já está sendo usado')
        .should('be.visible');
    });

    it('TC17 - Should delete an administrator user successfully', () => {
      const newAdminEmail = `admin.${Date.now()}@teste.com`;

      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();
      cy.get('[data-testid="nome"]').type('Teste Teste');
      cy.get('[data-testid="email"]').type(newAdminEmail);
      cy.get('[data-testid="password"]').type('teste123');
      cy.get('[data-testid="checkbox"]').click();
      cy.get('[data-testid="cadastrarUsuario"]').click();

      cy.contains('tr', newAdminEmail)
        .should('be.visible')
        .within(() => {
          cy.contains('button', 'Excluir').click();
        });

      cy.contains('tr', newAdminEmail).should('not.exist');
    });
  });

  context('Navigation and access control', () => {
    it('TC18 - Should navigate through the administrator menu options', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrar-usuarios"]').click();
      cy.contains('Cadastro de usuários').should('be.visible');

      cy.get('[data-testid="listar-usuarios"]').click();
      cy.contains('Lista dos usuários').should('be.visible');

      cy.get('[data-testid="cadastrar-produtos"]').click();
      cy.contains('Cadastro de Produtos').should('be.visible');

      cy.get('[data-testid="listar-produtos"]').click();
      cy.contains('Lista dos Produtos').should('be.visible');

      cy.get('[data-testid="link-relatorios"]').click();
      cy.contains('Em construção aguarde').should('be.visible');

      cy.get('[data-testid="home"]').click();
      cy.contains('Bem Vindo').should('be.visible');
    });

    it('TC19 - Should navigate through the administrator home page', () => {
      cy.contains('Login').should('be.visible');
      cy.get('[data-testid="email"]').type(adminUser.email);
      cy.get('[data-testid="senha"]').type(adminUser.password);
      cy.get('[data-testid="entrar"]').click();

      cy.contains('Bem Vindo').should('be.visible');

      cy.get('[data-testid="cadastrarUsuarios"]').click();
      cy.contains('Cadastro de usuários').should('be.visible');

      cy.get('[data-testid="home"]').click();
      cy.get('[data-testid="listarUsuarios"]').click();
      cy.contains('Lista dos usuários').should('be.visible');

      cy.get('[data-testid="home"]').click();
      cy.get('[data-testid="cadastrarProdutos"]').click();
      cy.contains('Cadastro de Produtos').should('be.visible');

      cy.get('[data-testid="home"]').click();
      cy.get('[data-testid="listarProdutos"]').click();
      cy.contains('Lista dos Produtos').should('be.visible');

      cy.get('[data-testid="home"]').click();
      cy.get('[data-testid="relatorios"]').click();
      cy.contains('Em construção aguarde').should('be.visible');

      cy.get('[data-testid="home"]').click();
      cy.contains('Bem Vindo').should('be.visible');
    });
  });
});