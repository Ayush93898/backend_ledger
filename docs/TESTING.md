# Testing

## Current automated-test setup

There is no external test framework dependency. A focused controller test file uses Node.js's built-in `node:test` runner and mocks the Mongoose model operations and email service; it does not connect to MongoDB. Run it with:

```sh
node --test
```

The existing `npm test` script remains a placeholder that prints an error and exits with status 1; it is not the test command.

Jest with Supertest could be considered later for broader route-level coverage, but neither is installed. No dependency was added for the focused tests.

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

## Current coverage and limitations

The focused tests cover source-account ownership rejection, verify that a simulated concurrent sender-account write conflict does not commit a second transfer, and confirm the ledger balance aggregation uses the supplied session. The concurrency test mocks the write conflict; it does not prove behavior against a live MongoDB deployment.

- The test suite does not cover every API, validation branch, or email behavior.
- No live database integration test has been configured or run.
- The repository does not include an isolated database setup or fixture/seeding process.
- The public API cannot create a system user or provision its account.
- MongoDB transactions require a transaction-capable deployment.
- Email delivery depends on Gmail OAuth2 settings and may fail independently of database/API behavior.
- There is no health endpoint or transaction-history read API.
