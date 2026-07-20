describe('Authentication and user API', () => {
  let apiUrl;

  beforeEach(() => {
    apiUrl = Cypress.env('apiUrl');

    expect(apiUrl).to.be.a('string').and.not.be.empty;
  });

  const buildUser = (overrides = {}) => ({
    nome: 'API User Test',
    email: `api.user.${Date.now()}@teste.com`,
    password: 'teste123',
    administrador: 'false',
    ...overrides,
  });

  const createUser = (user) => {
    return cy.request({
      method: 'POST',
      url: `${apiUrl}/usuarios`,
      body: user,
    });
  };

  context('User registration validation', () => {
    it('TC52 - Should create an administrator user with valid data', () => {
      const administrator = buildUser({
        nome: 'API Administrator Test',
        email: `api.admin.${Date.now()}@teste.com`,
        administrador: 'true',
      });

      createUser(administrator).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.message).to.eq(
          'Cadastro realizado com sucesso',
        );
        expect(response.body._id)
          .to.be.a('string')
          .and.not.be.empty;
      });
    });

    it('TC53 - Should create a standard user with valid data', () => {
      const standardUser = buildUser();

      createUser(standardUser).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body.message).to.eq(
          'Cadastro realizado com sucesso',
        );
        expect(response.body._id)
          .to.be.a('string')
          .and.not.be.empty;
      });
    });

    it('TC54 - Should reject user creation when required fields are missing', () => {
      const requiredFields = [
        'nome',
        'email',
        'password',
        'administrador',
      ];

      requiredFields.forEach((missingField, index) => {
        const user = buildUser({
          email: `required.${index}.${Date.now()}@teste.com`,
        });

        delete user[missingField];

        cy.request({
          method: 'POST',
          url: `${apiUrl}/usuarios`,
          body: user,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body).to.have.property(missingField);
        });
      });
    });

    it('TC55 - Should reject user creation with an invalid email format', () => {
      const invalidEmails = [
        'invalid-email',
        'invalid@',
        'invalid@teste.',
      ];

      invalidEmails.forEach((invalidEmail) => {
        const user = buildUser({
          email: invalidEmail,
        });

        cy.request({
          method: 'POST',
          url: `${apiUrl}/usuarios`,
          body: user,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body).to.have.property('email');
        });
      });
    });

    it('TC56 - Should reject user creation with an existing email address', () => {
      const user = buildUser();

      createUser(user).then((creationResponse) => {
        expect(creationResponse.status).to.eq(201);
      });

      cy.request({
        method: 'POST',
        url: `${apiUrl}/usuarios`,
        body: user,
        failOnStatusCode: false,
      }).then((duplicateResponse) => {
        expect(duplicateResponse.status).to.eq(400);
        expect(duplicateResponse.body.message).to.eq(
          'Este email já está sendo usado',
        );
      });
    });
  });

  context('Authentication', () => {
    it('TC57 - Should authenticate an administrator with valid credentials', () => {
      const administrator = buildUser({
        email: `api.admin.${Date.now()}@teste.com`,
        administrador: 'true',
      });

      createUser(administrator);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: {
          email: administrator.email,
          password: administrator.password,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.message).to.eq(
          'Login realizado com sucesso',
        );
        expect(response.body.authorization)
          .to.be.a('string')
          .and.not.be.empty;
      });
    });

    it('TC58 - Should authenticate a standard user with valid credentials', () => {
      const standardUser = buildUser();

      createUser(standardUser);

      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: {
          email: standardUser.email,
          password: standardUser.password,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.message).to.eq(
          'Login realizado com sucesso',
        );
        expect(response.body.authorization)
          .to.be.a('string')
          .and.not.be.empty;
      });
    });

    it('TC59 - Should reject authentication with invalid credentials', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/login`,
        body: {
          email: `nonexistent.${Date.now()}@teste.com`,
          password: 'invalidPassword',
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body.message).to.eq(
          'Email e/ou senha inválidos',
        );
        expect(response.body).not.to.have.property(
          'authorization',
        );
      });
    });
  });

  context('User retrieval and management', () => {
    it('TC60 - Should return the list of registered users', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/usuarios`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.quantidade).to.be.a('number');
        expect(response.body.usuarios).to.be.an('array');
      });
    });

    it('TC61 - Should return a user by ID', () => {
      const user = buildUser();

      createUser(user).then((creationResponse) => {
        const userId = creationResponse.body._id;

        cy.request({
          method: 'GET',
          url: `${apiUrl}/usuarios/${userId}`,
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body).to.include({
            nome: user.nome,
            email: user.email,
            password: user.password,
            administrador: user.administrador,
            _id: userId,
          });
        });
      });
    });

    it('TC62 - Should return an error when searching for a non-existent user ID', () => {
      const nonExistentUserId = '0000000000000000';

      cy.request({
        method: 'GET',
        url: `${apiUrl}/usuarios/${nonExistentUserId}`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq(
          'Usuário não encontrado',
        );
      });
    });

    it('TC63 - Should update an existing user', () => {
      const user = buildUser();

      const updatedUser = {
        nome: 'Updated API User',
        email: `updated.${Date.now()}@teste.com`,
        password: 'updated123',
        administrador: 'true',
      };

      createUser(user).then((creationResponse) => {
        const userId = creationResponse.body._id;

        cy.request({
          method: 'PUT',
          url: `${apiUrl}/usuarios/${userId}`,
          body: updatedUser,
        }).then((updateResponse) => {
          expect(updateResponse.status).to.eq(200);
          expect(updateResponse.body.message).to.eq(
            'Registro alterado com sucesso',
          );
        });

        cy.request({
          method: 'GET',
          url: `${apiUrl}/usuarios/${userId}`,
        }).then((getResponse) => {
          expect(getResponse.status).to.eq(200);
          expect(getResponse.body).to.include({
            ...updatedUser,
            _id: userId,
          });
        });
      });
    });

    it('TC64 - Should delete an existing user', () => {
      const user = buildUser();

      createUser(user).then((creationResponse) => {
        const userId = creationResponse.body._id;

        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/usuarios/${userId}`,
        }).then((deleteResponse) => {
          expect(deleteResponse.status).to.eq(200);
          expect(deleteResponse.body.message).to.eq(
            'Registro excluído com sucesso',
          );
        });
      });
    });

    it('TC65 - Should reject authentication after the user has been deleted', () => {
      const user = buildUser();

      createUser(user).then((creationResponse) => {
        const userId = creationResponse.body._id;

        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/usuarios/${userId}`,
        })
          .its('status')
          .should('eq', 200);

        cy.request({
          method: 'POST',
          url: `${apiUrl}/login`,
          body: {
            email: user.email,
            password: user.password,
          },
          failOnStatusCode: false,
        }).then((loginResponse) => {
          expect(loginResponse.status).to.eq(401);
          expect(loginResponse.body.message).to.eq(
            'Email e/ou senha inválidos',
          );
        });
      });
    });

    it('TC66 - Should return users filtered by administrator status', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/usuarios`,
        qs: {
          administrador: 'true',
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.usuarios).to.be.an('array');

        response.body.usuarios.forEach((user) => {
          expect(user.administrador).to.eq('true');
        });
      });
    });

    it('TC67 - Should return a user filtered by email', () => {
      const user = buildUser();

      createUser(user);

      cy.request({
        method: 'GET',
        url: `${apiUrl}/usuarios`,
        qs: {
          email: user.email,
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.quantidade).to.eq(1);
        expect(response.body.usuarios).to.have.length(1);
        expect(response.body.usuarios[0].email).to.eq(
          user.email,
        );
      });
    });

    it('TC68 - Should validate the user response schema', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/usuarios`,
      }).then((response) => {
        expect(response.status).to.eq(200);

        expect(response.body).to.have.all.keys(
          'quantidade',
          'usuarios',
        );

        expect(response.body.quantidade).to.be.a('number');
        expect(response.body.usuarios).to.be.an('array');

        response.body.usuarios.forEach((user) => {
          expect(user).to.include.keys(
            'nome',
            'email',
            'password',
            'administrador',
            '_id',
          );

          expect(user.nome).to.be.a('string');
          expect(user.email).to.be.a('string');
          expect(user.password).to.be.a('string');
          expect(user.administrador).to.be.oneOf([
            'true',
            'false',
          ]);
          expect(user._id)
            .to.be.a('string')
            .and.not.be.empty;
        });
      });
    });
  });
});