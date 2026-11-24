# Technical Overview

This document explains the technologies and backend concepts visible in the current source. It describes the implementation, not claims about production readiness.

## Runtime and module system

The application uses JavaScript on Node.js and CommonJS modules (`require()` and `module.exports`). Node executes `server.js`, which loads environment settings, imports the Express app and database connector, and starts the HTTP listener.

Database, email, and many controller operations are asynchronous. Functions using `async` return Promises; `await` pauses the current async function while an I/O operation settles. Node.js can continue servicing other work while network or database I/O is pending.

## Express and HTTP

Express creates the HTTP application and provides routers, middleware, request objects, and response helpers.

- `express.json()` parses JSON request payloads into `req.body`.
- `cookie-parser` parses the Cookie header into `req.cookies`.
- Routers map HTTP methods and paths to controller functions.
- Controllers read request data and send responses using `res.status(...).json(...)`.

The app uses GET for account reads and POST for registration, login, logout, account creation, and transaction actions. There are no update/delete HTTP routes in the inspected source.

## Middleware and request context

Express runs middleware in registration order. At app level, JSON parsing and cookie parsing are registered before the route mounts. On protected routes, authentication middleware runs before the controller.

The auth middleware extracts a token, checks the blacklist, verifies the JWT, loads the corresponding user, stores it at `req.user`, and calls `next()`. `systemUserMiddleware` performs an additional system-user authorization check. This separates identity verification (authentication) from permission checking (authorization).

## Controllers, models, and persistence

Controllers coordinate HTTP handling, business flow, and calls to models/services. Mongoose schemas describe document fields and validation; models expose queries and persistence operations.

The account model defines `getBalance()`, which runs an aggregation over ledger entries. It sums credits and debits, then subtracts debits from credits. The balance is derived rather than stored on the account.

The regular transaction controller uses a Mongoose session to increment the sender account's version key, calculate its ledger balance in that session, and write the transaction plus two ledger entries together. The sender write creates a shared conflict point so concurrent transfers from the same account cannot both commit against the same balance snapshot; the controller does not automatically retry a conflict. These guarantees depend on MongoDB deployment support for transactions. The initial-funding controller also uses a session but has a distinct, less extensive validation flow.

## Authentication and password handling

- `bcryptjs` hashes passwords in a user schema pre-save hook and compares supplied passwords through `comparePassword()`.
- `jsonwebtoken` signs a JWT with the user's ID and a three-day expiry. The token is set in a cookie; middleware also accepts a Bearer token.
- The blacklist model stores revoked token strings and defines a three-day TTL index.
- `cookie-parser` makes request cookies available to middleware/controllers.

JWT signing depends on `JWT_SECRET`. The application code does not show a dedicated configuration-validation step or cookie security options.

## Configuration and integrations

`dotenv` loads `.env` values into `process.env`. The app reads `PORT`, `MONGO_URI`, and `JWT_SECRET`; the email service reads `EMAIL_USER`, `CLIENT_ID`, `CLIENT_SECRET`, and `REFRESH_TOKEN`.

Nodemailer configures Gmail OAuth2 transport. The email service verifies the transport when imported and exposes registration, transaction-success, and transaction-failure email operations. Controllers call these operations at the points described in the API and architecture documents.

## Error behavior

Controllers explicitly return JSON for several expected cases such as invalid credentials, missing transfer fields, and missing accounts. The regular transfer handler catches errors from its main transaction-write block, aborts the session, and sends a generic `500` response. Authentication middleware catches JWT/user lookup errors and responds with `401`.

The Express app does not register a custom centralized JSON error middleware or custom not-found handler. Other rejected async operations therefore do not share a project-defined response shape.

## Design concepts and current boundaries

- **REST-style routing:** resource paths are grouped under `/api/auth`, `/api/accounts`, and `/api/transactions`; the routes are not a complete CRUD API.
- **Idempotency:** regular transfers look up a unique idempotency key to handle repeated requests. The initial-funding handler does not use the same lookup.
- **Ledger accounting:** one transfer is represented by a transaction document plus debit and credit ledger entries.
- **Authorization boundary:** account balance reads scope the account to the authenticated user; the regular transfer source-account lookup does not apply the same ownership filter.
- **Not present in the inspected application:** a health endpoint, transaction-history endpoint, cache, job queue, background worker, API versioning, or external automated-test framework. Focused tests use the Node.js built-in test runner.
