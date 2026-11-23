# API Documentation

Base URL: `http://localhost:<PORT>` using the locally configured `PORT`. The API has no version prefix or query parameters.

For JSON request bodies use `Content-Type: application/json`. Protected routes accept a `token` cookie or `Authorization: Bearer <JWT>`. Registration and login set the cookie. No response examples below include real tokens or credentials.

## Authentication

### Register

- **Method/path:** `POST /api/auth/register`
- **Authentication:** None
- **Body:**

  ```json
  { "email": "user@example.com", "password": "example-password", "name": "Example User" }
  ```

- **Success:** `201`; response includes `message`, `user` (`_id`, `email`, `name`), and `token`. Also sets the `token` cookie.
- **Errors:** `422` when the controller finds an existing email. Missing/invalid values can result in Mongoose validation errors; there is no dedicated controller response for those.
- **Controller/model:** `userRegisterController`; `userModel`. The model's save hook is intended to hash a modified password.
- **Other operation:** Attempts to send a registration email after writing the response.

### Login

- **Method/path:** `POST /api/auth/login`
- **Authentication:** None
- **Body:**

  ```json
  { "email": "user@example.com", "password": "example-password" }
  ```

- **Success:** `200`; response includes `message` and a user object (`id`, `email`, `name`). Sets the `token` cookie; the JSON body does not include the token.
- **Errors:** `401` if the user is not found or the password is invalid. The response key is spelled `mesage` in the current controller.
- **Controller/model:** `userLoginController`; `userModel.findOne(...).select("+password")` and `comparePassword()`.

### Logout

- **Method/path:** `POST /api/auth/logout`
- **Authentication:** No route middleware. The controller optionally reads a cookie or Bearer token.
- **Body:** None.
- **Success:** `200`, `{"message":"User logged out successfully"}`. This is also returned when no token is supplied.
- **Database operation:** Creates a token-blacklist document when a token is supplied.
- **Controller/model:** `userLogoutController`; `tokenBlackListModel`.

## Accounts

All account routes require `authMiddleware`.

### Create account

- **Method/path:** `POST /api/accounts/`
- **Body:** None.
- **Success:** `201`, `{"account": <created account document>}`.
- **Database operation:** Creates an account associated with `req.user._id`.
- **Controller/model:** `createAcconutController`; `accountModel`.

### List current user's accounts

- **Method/path:** `GET /api/accounts/`
- **Body/query:** None.
- **Success:** `200`, `{"accounts": [<account documents>]}`.
- **Database operation:** Finds accounts whose `user` matches the authenticated user.
- **Controller/model:** `getUserAccountsController`; `accountModel`.

### Get account balance

- **Method/path:** `GET /api/accounts/balance/:accountId`
- **URL parameter:** `accountId` is the MongoDB account ID.
- **Body/query:** None.
- **Success:** `200`, `{"message":"balance fetched successfully","accountId":"...","balance":0}` (balance is calculated from ledger entries).
- **Errors:** `404`, `{"message":"Account not found"}`, if no account matches both the ID and authenticated user. Invalid ObjectId casting has no explicit controller response.
- **Database operation:** Finds the account scoped to the current user, then aggregates ledger entries.
- **Controller/model:** `getAccountBalanceController`; `accountModel` and its `getBalance()` method, which uses `ledgerModel.aggregate()`.

## Transactions

### Create regular transfer

- **Method/path:** `POST /api/transactions/`
- **Authentication:** `authMiddleware`
- **Body:**

  ```json
  {
    "fromAccount": "<sender-account-id>",
    "toAccount": "<recipient-account-id>",
    "amount": 10,
    "idempotencyKey": "<unique-key>"
  }
  ```

- **Success:** `201`, with `message` and `transaction`. The controller returns the in-memory transaction created as `PENDING`; it updates the database record to `COMPLETED` but does not replace that in-memory object before responding.
- **Errors:** `400` for missing fields, missing accounts, non-active accounts, or insufficient balance; `401` from authentication. A previously seen key returns `200` for `COMPLETED` (`Transaction already processed`) or `PENDING` (`Transaction is still processing`), and `500` for `FAILED` or `REVERSED`. Failures in the write block return a generic `500` response.
- **Database operations:** Looks up accounts and idempotency key, aggregates sender ledger balance, then in a session creates a transaction, debit ledger entry, credit ledger entry, updates status, and commits.
- **Controller/models:** `createTransaction`; `accountModel`, `transactionModel`, `ledgerModel`.
- **Other operation:** Attempts success/failure email notifications.

### Create initial funds transfer

- **Method/path:** `POST /api/transactions/system/initial-fund`
- **Authentication:** `systemUserMiddleware`
- **Body:**

  ```json
  {
    "toAccount": "<recipient-account-id>",
    "amount": 100,
    "idempotencyKey": "<unique-key>"
  }
  ```

- **Success:** `201`, with `message` and the saved transaction document, set to `COMPLETED`.
- **Errors:** `400` for missing fields, invalid target account, or missing system-user account; `401` for missing/invalid token or missing user; `403` for a non-system user. There is no route-specific handler for database/session errors.
- **Database operations:** Finds target account and system user's account, then in a session creates debit/credit ledger entries, saves the transaction, and commits.
- **Controller/models:** `createInitialFundsTransaction`; `accountModel`, `transactionModel`, `ledgerModel`.
- **Limitations of current handler:** It does not perform an idempotency lookup or check source account balance/status. The public API has no system-user provisioning endpoint.

## Authentication/error notes

- Authentication middleware checks the blacklist and verifies the JWT. A regular authenticated route attaches the loaded user to `req.user`; the system-user middleware also checks the `systemUser` flag.
- The application has no custom centralized error-response middleware. Database errors and model validation failures outside explicit controller branches may therefore use Express's default error handling.
- There are no implemented `PUT`, `PATCH`, or `DELETE` routes, transaction-history route, health route, or query parameters in the inspected routers.
