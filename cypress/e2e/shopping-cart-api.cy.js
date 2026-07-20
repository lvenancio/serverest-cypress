describe('Shopping cart API', () => {
  let apiUrl;

  beforeEach(() => {
    apiUrl = Cypress.env('apiUrl');
  });

  function generateId() {
    return `${Date.now()}${Math.floor(Math.random() * 10000)}`;
  }

  function generateUser(isAdministrator = 'false') {
    return {
      nome: 'API Cart User',
      email: `cart.user.${generateId()}@teste.com`,
      password: 'teste123',
      administrador: isAdministrator,
    };
  }

  function generateProduct(customData = {}) {
    return {
      nome: `Cart Product ${generateId()}`,
      preco: 100,
      descricao: 'Product created for cart API tests',
      quantidade: 10,
      ...customData,
    };
  }

  function createUserAndGetToken(isAdministrator) {
    const user = generateUser(isAdministrator);

    return cy
      .request({
        method: 'POST',
        url: `${apiUrl}/usuarios`,
        body: user,
      })
      .then((createResponse) => {
        expect(createResponse.status).to.eq(201);

        return cy.request({
          method: 'POST',
          url: `${apiUrl}/login`,
          body: {
            email: user.email,
            password: user.password,
          },
        });
      })
      .then((loginResponse) => {
        expect(loginResponse.status).to.eq(200);

        return loginResponse.body.authorization;
      });
  }

  function createProductForTest(customData = {}) {
    const product = generateProduct(customData);

    return createUserAndGetToken('true')
      .then((adminToken) => {
        return cy.request({
          method: 'POST',
          url: `${apiUrl}/produtos`,
          headers: {
            authorization: adminToken,
          },
          body: product,
        });
      })
      .then((productResponse) => {
        expect(productResponse.status).to.eq(201);

        return {
          product,
          productId: productResponse.body._id,
        };
      });
  }

  function createCart(userToken, products) {
    return cy.request({
      method: 'POST',
      url: `${apiUrl}/carrinhos`,
      headers: {
        authorization: userToken,
      },
      body: {
        produtos: products,
      },
    });
  }

  function prepareCart(productData = {}, requestedQuantity = 2) {
    let createdProduct;
    let standardUserToken;

    return createProductForTest(productData)
      .then((productResult) => {
        createdProduct = productResult;

        return createUserAndGetToken('false');
      })
      .then((userToken) => {
        standardUserToken = userToken;

        return createCart(standardUserToken, [
          {
            idProduto: createdProduct.productId,
            quantidade: requestedQuantity,
          },
        ]);
      })
      .then((cartResponse) => {
        expect(cartResponse.status).to.eq(201);

        return {
          product: createdProduct.product,
          productId: createdProduct.productId,
          userToken: standardUserToken,
          cartId: cartResponse.body._id,
          requestedQuantity,
        };
      });
  }

  context('Cart creation validation', () => {
    it('TC85 - Should create a cart with valid products and quantities', () => {
      prepareCart({}, 2).then((cartData) => {
        expect(cartData.cartId)
          .to.be.a('string')
          .and.not.be.empty;
      });
    });

    it('TC86 - Should reject cart creation with a non-existent product ID', () => {
      const nonExistentProductId = '0000000000000000';

      createUserAndGetToken('false').then((userToken) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/carrinhos`,
          headers: {
            authorization: userToken,
          },
          body: {
            produtos: [
              {
                idProduto: nonExistentProductId,
                quantidade: 1,
              },
            ],
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body).to.have.property('message');
        });
      });
    });

    it('TC87 - Should reject cart creation when the requested quantity exceeds the available stock', () => {
      createProductForTest({
        quantidade: 5,
      }).then((productData) => {
        createUserAndGetToken('false').then((userToken) => {
          cy.request({
            method: 'POST',
            url: `${apiUrl}/carrinhos`,
            headers: {
              authorization: userToken,
            },
            body: {
              produtos: [
                {
                  idProduto: productData.productId,
                  quantidade: 6,
                },
              ],
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('message');
          });
        });
      });
    });

    it('TC88 - Should reject duplicate products in the same cart', () => {
      createProductForTest().then((productData) => {
        createUserAndGetToken('false').then((userToken) => {
          cy.request({
            method: 'POST',
            url: `${apiUrl}/carrinhos`,
            headers: {
              authorization: userToken,
            },
            body: {
              produtos: [
                {
                  idProduto: productData.productId,
                  quantidade: 1,
                },
                {
                  idProduto: productData.productId,
                  quantidade: 1,
                },
              ],
            },
            failOnStatusCode: false,
          }).then((response) => {
            expect(response.status).to.eq(400);
            expect(response.body).to.have.property('message');
          });
        });
      });
    });

    it('TC89 - Should prevent a user from creating more than one active cart', () => {
      prepareCart({}, 1).then((cartData) => {
        cy.request({
          method: 'POST',
          url: `${apiUrl}/carrinhos`,
          headers: {
            authorization: cartData.userToken,
          },
          body: {
            produtos: [
              {
                idProduto: cartData.productId,
                quantidade: 1,
              },
            ],
          },
          failOnStatusCode: false,
        }).then((response) => {
          expect(response.status).to.eq(400);
          expect(response.body.message).to.eq(
            'Não é permitido ter mais de 1 carrinho',
          );
        });
      });
    });

    it('TC90 - Should reject cart creation without an authorization token', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/carrinhos`,
        body: {
          produtos: [
            {
              idProduto: '0000000000000000',
              quantidade: 1,
            },
          ],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('message');
      });
    });

    it('TC91 - Should reject cart creation with an invalid authorization token', () => {
      cy.request({
        method: 'POST',
        url: `${apiUrl}/carrinhos`,
        headers: {
          authorization: 'Bearer invalid-token',
        },
        body: {
          produtos: [
            {
              idProduto: '0000000000000000',
              quantidade: 1,
            },
          ],
        },
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(401);
        expect(response.body).to.have.property('message');
      });
    });
  });

  context('Cart retrieval', () => {
    it('TC92 - Should return the list of registered carts', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/carrinhos`,
      }).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body.quantidade).to.be.a('number');
        expect(response.body.carrinhos).to.be.an('array');
      });
    });

    it('TC93 - Should return a cart by ID', () => {
      prepareCart({}, 2).then((cartData) => {
        cy.request({
          method: 'GET',
          url: `${apiUrl}/carrinhos/${cartData.cartId}`,
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body._id).to.eq(cartData.cartId);
          expect(response.body.produtos).to.be.an('array');
        });
      });
    });

    it('TC94 - Should return an error when searching for a non-existent cart ID', () => {
      const nonExistentCartId = '0000000000000000';

      cy.request({
        method: 'GET',
        url: `${apiUrl}/carrinhos/${nonExistentCartId}`,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(400);
        expect(response.body.message).to.eq(
          'Carrinho não encontrado',
        );
      });
    });

    it('TC95 - Should display the correct product ID, quantity and total price in the cart', () => {
      const productPrice = 125;
      const requestedQuantity = 2;

      prepareCart(
        {
          preco: productPrice,
          quantidade: 10,
        },
        requestedQuantity,
      ).then((cartData) => {
        cy.request({
          method: 'GET',
          url: `${apiUrl}/carrinhos/${cartData.cartId}`,
        }).then((response) => {
          const cartProduct = response.body.produtos[0];

          expect(response.status).to.eq(200);
          expect(cartProduct.idProduto).to.eq(
            cartData.productId,
          );
          expect(cartProduct.quantidade).to.eq(
            requestedQuantity,
          );
          expect(cartProduct.precoUnitario).to.eq(
            productPrice,
          );

          expect(response.body.quantidadeTotal).to.eq(
            requestedQuantity,
          );
          expect(response.body.precoTotal).to.eq(
            productPrice * requestedQuantity,
          );
        });
      });
    });

    it('TC96 - Should decrease product stock after cart creation', () => {
      const initialStock = 10;
      const requestedQuantity = 3;

      prepareCart(
        {
          quantidade: initialStock,
        },
        requestedQuantity,
      ).then((cartData) => {
        cy.request({
          method: 'GET',
          url: `${apiUrl}/produtos/${cartData.productId}`,
        }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.body.quantidade).to.eq(
            initialStock - requestedQuantity,
          );
        });
      });
    });

    it('TC97 - Should validate the cart response schema', () => {
      cy.request({
        method: 'GET',
        url: `${apiUrl}/carrinhos`,
      }).then((response) => {
        expect(response.status).to.eq(200);

        expect(response.body).to.have.all.keys(
          'quantidade',
          'carrinhos',
        );

        expect(response.body.quantidade).to.be.a('number');
        expect(response.body.carrinhos).to.be.an('array');

        response.body.carrinhos.forEach((cart) => {
          expect(cart).to.include.keys(
            'produtos',
            'precoTotal',
            'quantidadeTotal',
            'idUsuario',
            '_id',
          );

          expect(cart.produtos).to.be.an('array');
          expect(cart.precoTotal).to.be.a('number');
          expect(cart.quantidadeTotal).to.be.a('number');
          expect(cart.idUsuario).to.be.a('string');
          expect(cart._id).to.be.a('string');

          cart.produtos.forEach((product) => {
            expect(product).to.include.keys(
              'idProduto',
              'quantidade',
              'precoUnitario',
            );

            expect(product.idProduto).to.be.a('string');
            expect(product.quantidade).to.be.a('number');
            expect(product.precoUnitario).to.be.a('number');
          });
        });
      });
    });
  });

  context('Checkout and cancellation', () => {
    it('TC98 - Should complete a purchase and remove the active cart', () => {
      prepareCart({}, 2).then((cartData) => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/carrinhos/concluir-compra`,
          headers: {
            authorization: cartData.userToken,
          },
        }).then((completeResponse) => {
          expect(completeResponse.status).to.eq(200);
          expect(completeResponse.body.message).to.eq(
            'Registro excluído com sucesso',
          );

          cy.request({
            method: 'GET',
            url: `${apiUrl}/carrinhos/${cartData.cartId}`,
            failOnStatusCode: false,
          }).then((getResponse) => {
            expect(getResponse.status).to.eq(400);
            expect(getResponse.body.message).to.eq(
              'Carrinho não encontrado',
            );
          });
        });
      });
    });

    it('TC99 - Should keep the reduced product stock after completing a purchase', () => {
      const initialStock = 10;
      const requestedQuantity = 3;

      prepareCart(
        {
          quantidade: initialStock,
        },
        requestedQuantity,
      ).then((cartData) => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/carrinhos/concluir-compra`,
          headers: {
            authorization: cartData.userToken,
          },
        }).then((completeResponse) => {
          expect(completeResponse.status).to.eq(200);

          cy.request({
            method: 'GET',
            url: `${apiUrl}/produtos/${cartData.productId}`,
          }).then((productResponse) => {
            expect(productResponse.status).to.eq(200);
            expect(productResponse.body.quantidade).to.eq(
              initialStock - requestedQuantity,
            );
          });
        });
      });
    });

    it('TC100 - Should cancel a purchase and remove the active cart', () => {
      prepareCart({}, 2).then((cartData) => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/carrinhos/cancelar-compra`,
          headers: {
            authorization: cartData.userToken,
          },
        }).then((cancelResponse) => {
          expect(cancelResponse.status).to.eq(200);
          expect(cancelResponse.body.message).to.eq(
            'Registro excluído com sucesso. Estoque dos produtos reabastecido',
          );

          cy.request({
            method: 'GET',
            url: `${apiUrl}/carrinhos/${cartData.cartId}`,
            failOnStatusCode: false,
          }).then((getResponse) => {
            expect(getResponse.status).to.eq(400);
            expect(getResponse.body.message).to.eq(
              'Carrinho não encontrado',
            );
          });
        });
      });
    });

    it('TC101 - Should restore product stock after cancelling a purchase', () => {
      const initialStock = 10;
      const requestedQuantity = 3;

      prepareCart(
        {
          quantidade: initialStock,
        },
        requestedQuantity,
      ).then((cartData) => {
        cy.request({
          method: 'DELETE',
          url: `${apiUrl}/carrinhos/cancelar-compra`,
          headers: {
            authorization: cartData.userToken,
          },
        }).then((cancelResponse) => {
          expect(cancelResponse.status).to.eq(200);

          cy.request({
            method: 'GET',
            url: `${apiUrl}/produtos/${cartData.productId}`,
          }).then((productResponse) => {
            expect(productResponse.status).to.eq(200);
            expect(productResponse.body.quantidade).to.eq(
              initialStock,
            );
          });
        });
      });
    });
  });
});