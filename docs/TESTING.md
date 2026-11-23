# Testing

## Current automated-test setup

No test files or testing framework are present in the project. `package.json` defines:

```sh
npm test
```

as a placeholder that prints an error and exits with status 1. This is not a test suite and must not be reported as a test result.

Jest with Supertest is a suitable future choice: Jest provides test discovery/assertions/mocking, and Supertest can exercise Express routes without requiring a separately launched HTTP client. Neither is installed or configured. Obtain approval before adding dependencies or test files. Run any future tests only with an isolated test database or mocked models.

## Prerequisites for manual Postman tests

1. Use a disposable MongoDB database; never use production or personal data.
2. Set local environment values without committing them.
3. Ensure MongoDB transaction/session support is available for transfers.
4. Start from this project directory with `node server.js`. The `npm run dev` script invokes `npx nodemon server.js`, but `nodemon` is not declared in `package.json` or the lockfile and `npx` may try to retrieve it.
5. Import `postman/ledger-backend.postman_collection.json` and `postman/ledger-backend.postman_environment.json`.
6. Replace the environment placeholders locally. Do not share tokens, passwords, or connection strings.

The app has no health route. Startup logs report the database connection and listening URL. A database-backed check can use a login attempt against a test email; a missing/invalid user normally returns `401`, while a connection failure may reach default error handling.

## Suggested Postman sequence

1. **Auth:** Register a disposable test user, then log in. Registration writes a user and attempts an email send.
2. **Auth checks:** Try invalid credentials. For missing/invalid token tests, clear Postman's cookie jar so a retained cookie does not authenticate the request.
3. **Accounts:** Create an account, list accounts, and get its balance. Account creation writes a document; a new account should have balance zero.
4. **System funding (conditional):** This requires a system user and account already provisioned in the test database. No public API provisions them. Log in as that system user and call `/api/transactions/system/initial-fund` with the test account ID.
5. **Regular transfer:** Ensure the sender has adequate test balance, then call `/api/transactions/` with sender/recipient IDs, amount, and a fresh idempotency key.
6. **Verify and retry:** Fetch both account balances and repeat the same transfer using the same key. The regular transfer handler is intended to return the prior completed transaction without creating another transfer.
7. **Logout:** Log out and verify that the blacklisted token is rejected.

Do not run write requests against a shared or valuable database. Registration, account creation, logout, and transaction endpoints persist records. The initial-funding route requires pre-existing system setup and currently does not check its source balance.

## Collection contents

The collection includes all eight implemented API routes plus representative invalid-login, missing-token, invalid-token, balance-not-found, and idempotency-retry requests. Response scripts check status and basic response shape. Environment variables contain placeholders only.

## Known testing limitations

- No automated suite has been run or configured.
- The repository does not include an isolated database setup or fixture/seeding process.
- The public API cannot create a system user or provision its account.
- MongoDB transactions require a transaction-capable deployment.
- Email delivery depends on Gmail OAuth2 settings and may fail independently of database/API behavior.
- There is no health endpoint or transaction-history read API.
