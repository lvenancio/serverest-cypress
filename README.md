# ServeRest Cypress Test Automation

Test automation project developed with Cypress and JavaScript to validate the main frontend and API flows of ServeRest.

## Applications Under Test

- Frontend: [front.serverest.dev](https://front.serverest.dev/)
- API and Swagger documentation: [serverest.dev](https://serverest.dev/)

## Test Coverage

### Frontend

- Registration and authentication of administrator and standard users.
- Validation of required fields and invalid formats.
- User management and retrieval.
- Product registration, retrieval, and deletion.
- Product search and product details validation.
- Adding products to the shopping list.
- Updating product quantities and validating the total price.
- Navigation through the available options for each user profile.

### API

- User registration, authentication, retrieval, update, and deletion.
- Product registration, retrieval, update, and deletion.
- Authentication and authorization validation.
- Shopping cart creation and retrieval.
- Stock, quantity, and total price validation.
- Purchase completion and cancellation.
- Response schema validation.

## Test Strategy

The tests are separated by functionality and organized using `describe`, `context`, and `it`.

For the frontend tests, the required users and products are created through the user interface before the test scenarios are executed. This reduces dependency on data previously registered in the environment.

For the API tests, specific users, products, and shopping carts are generated for each flow. Dynamic identifiers are used to avoid conflicts between executions.

The project includes positive, negative, boundary, authentication and authorization scenarios.


## Prerequisites

- [Node.js](https://nodejs.org/) installed.
- npm, which is included with Node.js.


## Test Evidence

When a test fails, Cypress can generate screenshots and videos according to the execution configuration.

These files are ignored by Git and should not be committed to the repository:

```text
cypress/screenshots/
cypress/videos/
cypress/downloads/
```

## Technologies

- JavaScript
- Cypress
- Node.js
- npm
- ServeRest
- Git and GitHub

## Continuous Integration

The project uses GitHub Actions to execute the Cypress test suites automatically.

The workflow is triggered on:

- Pushes to the `main` branch.
- Pull requests targeting the `main` branch.
- Manual execution through `workflow_dispatch`.

The API and frontend test suites are executed separately using a matrix strategy. This makes it easier to identify which test group has failed.

The workflow uses `npm ci` to install the exact dependency versions registered in `package-lock.json`.

When a test fails, Cypress screenshots and videos are uploaded as workflow artifacts when available.