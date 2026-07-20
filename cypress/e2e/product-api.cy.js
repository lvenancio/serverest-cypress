describe('Product API', () => {
  let apiUrl;

  beforeEach(() => {
    apiUrl = Cypress.env('apiUrl');
  });

  function generateId() {
    return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  function generateUser(isAdministrator = 'false') {
    return {
      nome: 'API Product User',
      email: `product.user.${generateId()}@teste.com`,
      password: 'teste123',
      administrador: isAdministrator,
    };
  }

  function generateProduct(customData = {}) {
    return {
      nome: `API Product ${generateId()}`,
      preco: 100,
      descricao: 'Product created through the API',
      quantidade: 10,
      ...customData,
    };
  }

  function createUser(user) {
    return cy.request({
      method: 'POST',
      url: `${apiUrl}/usuarios`,
      body: user,
    });
  }

  function loginUser(user) {
    return cy.request({
      method: 'POST',
      url: `${apiUrl}/login`,
      body: {
        email: user.email,
        password: user.password,
      },
    });
  }

  function createUserAndGetToken(isAdministrator) {
    const user = generateUser(isAdministrator);

    return createUser(user)
      .then((createResponse) => {
        expect(createResponse.status).to.eq(201);

        return loginUser(user);
      })
      .then((loginResponse) => {
        expect(loginResponse.status).to.eq(200);

        return loginResponse.body.authorization;
      });
  }

  function createProduct(product, token) {
    return cy.request({
      method: 'POST',
      url: `${apiUrl}/produtos`,
      headers: {
        authorization: token,
      },
      body: product,
    });
  }

  context('Product retrieval', () => {
    it('TC69 - Should return the list of registered products', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/produtos`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.quantidade).to.be.a('number');
        expect(response.body.produtos).to.be.an('array');
      });
    });

    it('TC70 - Should return a product by ID', () => {
      const product = generateProduct();

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then(
          (createResponse) => {
            expect(createResponse.status).to.eq(201);

            const productId = createResponse.body._id;

            cy.request({
              method: 'GET',
              url: `${apiUrl}/produtos/${productId}`,
            }).then((getResponse) => {
              expect(getResponse.status).to.eq(200);

              expect(getResponse.body).to.include({
                nome: product.nome,
                preco: product.preco,
                descricao: product.descricao,
                quantidade: product.quantidade,
                _id: productId,
              });
            });
          },
        );
      });
    });

    it('TC71 - Should return an error when searching for a non-existent product ID', () => {
      const nonExistentProductId = '0000000000000000';

      cy.request({
        method: 'GET',
        url: `${apiUrl}/produtos/${nonExistentProductId}`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq(
          'Produto não encontrado',
        );
      });
    });

    it('TC72 - Should validate the product response schema', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/produtos`,
      }).then((response) => {
        expect(response.status).to.eq(200);

        expect(response.body).to.have.all.keys(
          'quantidade',
          'produtos',
        );

        expect(response.body.quantidade).to.be.a('number');
        expect(response.body.produtos).to.be.an('array');

        response.body.produtos.forEach((product) => {
          expect(product).to.include.keys(
            'nome',
            'preco',
            'descricao',
            'quantidade',
            '_id',
          );

          expect(product.nome).to.be.a('string');
          expect(product.preco).to.be.a('number');
          expect(product.descricao).to.be.a('string');
          expect(product.quantidade).to.be.a('number');
          expect(product._id).to.be.a('string');
        });
      });
    });
  });

  context('Product registration validation', () => {
    it('TC73 - Should create a product with valid data using an administrator token', () => {
      const product = generateProduct();

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then((response) => {
          expect(response.status).to.eq(201);
          expect(response.body.message).to.eq(
            'Cadastro realizado com sucesso',
          );
          expect(response.body._id).to.be.a('string');
        });
      });
    });

    it('TC74 - Should reject product creation when required fields are missing', () => {
      const requiredFields = [
        'nome',
        'preco',
        'descricao',
        'quantidade',
      ];

      createUserAndGetToken('true').then((adminToken) => {
        requiredFields.forEach((missingField) => {
          const product = generateProduct();

          delete product[missingField];

          cy.request({
            method: 'POST',
            url: `${apiUrl}/produtos`,
            headers: {
              authorization: adminToken,
            },
            body: product,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property(
              missingField,
            );
          });
        });
      });
    });

    it('TC75 - Should reject product creation with an existing product name', () => {
      const product = generateProduct();

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then(
          (firstResponse) => {
            expect(firstResponse.status).to.eq(201);

            cy.request({
              method: 'POST',
              url: `${apiUrl}/produtos`,
              headers: {
                authorization: adminToken,
              },
              body: product,
              failOnStatusCode: false,
            }).then((secondResponse) => {
              expect(secondResponse.status).to.eq(400);
              expect(secondResponse.body.message).to.eq(
                'Já existe produto com esse nome',
              );
            });
          },
        );
      });
    });

    it('TC76 - Should reject product creation with a negative price', () => {
      const product = generateProduct({
        preco: -100,
      });

      createUserAndGetToken('true').then((adminToken) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/produtos`,
          headers: {
            authorization: adminToken,
          },
          body: product,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body).to.have.property('preco');
        });
      });
    });

    it('TC77 - Should reject product creation with a negative quantity', () => {
      const product = generateProduct({
        quantidade: -10,
      });

      createUserAndGetToken('true').then((adminToken) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/produtos`,
          headers: {
            authorization: adminToken,
          },
          body: product,
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body).to.have.property(
            'quantidade',
          );
        });
      });
    });

    it('TC78 - Should reject product creation without an authorization token', () => {
      const product = generateProduct();

      cy.request({
        method: 'POST',
        url: `${apiUrl}/produtos`,
        body: product,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('message');
      });
    });

    it('TC79 - Should prevent a standard user from creating a product', () => {
      const product = generateProduct();

      createUserAndGetToken('false').then(
        (standardUserToken) => {
          cy.request({
            method: 'POST',
            url: `${apiUrl}/produtos`,
            headers: {
              authorization: standardUserToken,
            },
            body: product,
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(403);
            expect(response.body.message).to.eq(
              'Rota exclusiva para administradores',
            );
          });
        },
      );
    });
  });

  context('Product lifecycle', () => {
    it('TC80 - Should update an existing product using an administrator token', () => {
      const product = generateProduct();

      const updatedProduct = {
        nome: `Updated Product ${generateId()}`,
        preco: 250,
        descricao: 'Updated product description',
        quantidade: 25,
      };

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then(
          (createResponse) => {
            const productId = createResponse.body._id;

            cy.request({
              method: 'PUT',
              url: `${apiUrl}/produtos/${productId}`,
              headers: {
                authorization: adminToken,
              },
              body: updatedProduct,
            }).then((updateResponse) => {
              expect(updateResponse.status).to.eq(200);
              expect(updateResponse.body.message).to.eq(
                'Registro alterado com sucesso',
              );
            });
          },
        );
      });
    });

    it('TC81 - Should return the updated product data', () => {
      const product = generateProduct();

      const updatedProduct = {
        nome: `Updated Product ${generateId()}`,
        preco: 300,
        descricao: 'Updated product returned by the API',
        quantidade: 30,
      };

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then(
          (createResponse) => {
            const productId = createResponse.body._id;

            cy.request({
              method: 'PUT',
              url: `${apiUrl}/produtos/${productId}`,
              headers: {
                authorization: adminToken,
              },
              body: updatedProduct,
            }).then((updateResponse) => {
              expect(updateResponse.status).to.eq(200);

              cy.request({
                method: 'GET',
                url: `${apiUrl}/produtos/${productId}`,
              }).then((getResponse) => {
                expect(getResponse.status).to.eq(200);

                expect(getResponse.body).to.include({
                  ...updatedProduct,
                  _id: productId,
                });
              });
            });
          },
        );
      });
    });

    it('TC82 - Should delete an existing product using an administrator token', () => {
      const product = generateProduct();

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then(
          (createResponse) => {
            const productId = createResponse.body._id;

            cy.request({
              method: 'DELETE',
              url: `${apiUrl}/produtos/${productId}`,
              headers: {
                authorization: adminToken,
              },
            }).then((deleteResponse) => {
              expect(deleteResponse.status).to.eq(200);
              expect(deleteResponse.body.message).to.eq(
                'Registro excluído com sucesso',
              );
            });
          },
        );
      });
    });

    it('TC83 - Should no longer return a product after it has been deleted', () => {
      const product = generateProduct();

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then(
          (createResponse) => {
            const productId = createResponse.body._id;

            cy.request({
              method: 'DELETE',
              url: `${apiUrl}/produtos/${productId}`,
              headers: {
                authorization: adminToken,
              },
            }).then((deleteResponse) => {
              expect(deleteResponse.status).to.eq(200);

              cy.request({
                method: 'GET',
                url: `${apiUrl}/produtos/${productId}`,
                failOnStatusCode: false,
              }).then((getResponse) => {
                expect(getResponse.status).to.eq(400);
                expect(getResponse.body.message).to.eq(
                  'Produto não encontrado',
                );
              });
            });
          },
        );
      });
    });

    it('TC84 - Should prevent deletion of a product associated with an active cart', () => {
      const product = generateProduct({
        quantidade: 10,
      });

      createUserAndGetToken('true').then((adminToken) => {
        createProduct(product, adminToken).then(
          (createResponse) => {
            const productId = createResponse.body._id;

            createUserAndGetToken('false').then(
              (standardUserToken) => {
                cy.request({
                  method: 'POST',
                  url: `${apiUrl}/carrinhos`,
                  headers: {
                    authorization: standardUserToken,
                  },
                  body: {
                    produtos: [
                      {
                        idProduto: productId,
                        quantidade: 1,
                      },
                    ],
                  },
                }).then((cartResponse) => {
                  expect(cartResponse.status).to.eq(201);

                  cy.request({
                    method: 'DELETE',
                    url: `${apiUrl}/produtos/${productId}`,
                    headers: {
                      authorization: adminToken,
                    },
                    failOnStatusCode: false,
                  }).then((deleteResponse) => {
                    expect(deleteResponse.status).to.eq(400);
                    expect(deleteResponse.body.message).to.eq(
                      'Não é permitido excluir produto que faz parte de carrinho',
                    );
                  });
                });
              },
            );
          },
        );
      });
    });
  });
});