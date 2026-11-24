const assert = require("node:assert/strict");
const Module = require("node:module");
const { test } = require("node:test");

const emailServicePath = require.resolve("../src/services/email.service");
const previousEmailModule = require.cache[emailServicePath];
const mockedEmailModule = new Module(emailServicePath);
mockedEmailModule.filename = emailServicePath;
mockedEmailModule.loaded = true;
mockedEmailModule.exports = {
  sendTransactionEmail: async () => {},
  sendTransactionFailureEmail: async () => {},
};
require.cache[emailServicePath] = mockedEmailModule;

const { createTransaction } = require("../src/controllers/transaction.controller");
const accountModel = require("../src/models/account.model");
const ledgerModel = require("../src/models/ledger.model");
const transactionModel = require("../src/models/transaction.model");
const mongoose = require("mongoose");

if (previousEmailModule) {
  require.cache[emailServicePath] = previousEmailModule;
} else {
  delete require.cache[emailServicePath];
}

const ownerId = "owner-id";
const senderId = "sender-id";
const recipientId = "recipient-id";
let requestNumber = 0;

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function createRequest() {
  return {
    body: {
      fromAccount: senderId,
      toAccount: recipientId,
      amount: 60,
      idempotencyKey: `key-${++requestNumber}`,
    },
    user: {
      _id: ownerId,
      email: "test@example.com",
      name: "Test User",
    },
  };
}

function restore(object, key, original, t) {
  t.after(() => {
    object[key] = original;
  });
}

function mockMethod(object, key, replacement, t) {
  const original = object[key];
  object[key] = replacement;
  restore(object, key, original, t);
}

function mockTransferModels(t, options) {
  let sessionNumber = 0;
  const sender = {
    _id: senderId,
    status: "ACTIVE",
    async getBalance(session) {
      return options.getBalance(session);
    },
  };
  const recipient = { _id: recipientId, status: "ACTIVE" };

  mockMethod(
    accountModel,
    "findOne",
    async (filter) => {
      if (filter.user) {
        return filter.user === ownerId && filter._id === senderId
          ? sender
          : null;
      }
      return filter._id === senderId ? sender : recipient;
    },
    t,
  );
  mockMethod(
    accountModel,
    "findOneAndUpdate",
    options.findOneAndUpdate || (async () => sender),
    t,
  );
  mockMethod(transactionModel, "findOne", async () => null, t);
  mockMethod(
    transactionModel,
    "create",
    async ([document]) => [{ ...document, _id: `transaction-${++sessionNumber}` }],
    t,
  );
  mockMethod(transactionModel, "findOneAndUpdate", async () => ({}), t);
  mockMethod(
    ledgerModel,
    "create",
    async ([document]) => {
      options.onLedgerWrite?.();
      return [document];
    },
    t,
  );

  mockMethod(
    mongoose,
    "startSession",
    async () => ({
      startTransaction() {},
      async commitTransaction() {
        options.onCommit?.();
      },
      async abortTransaction() {
        options.onAbort?.();
      },
      endSession() {},
    }),
    t,
  );
}

test("rejects a transfer when the sender account is not owned by the caller", async (t) => {
  let lockAttempts = 0;
  mockTransferModels(t, {
    getBalance: async () => 100,
    findOneAndUpdate: async () => {
      lockAttempts += 1;
    },
  });

  const response = createResponse();
  const request = createRequest();
  request.user._id = "another-user";
  await createTransaction(request, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.message, "Invalid fromAccount or toAccount");
  assert.equal(lockAttempts, 0);
});

test("a conflicting concurrent sender update cannot commit a second transfer", async (t) => {
  let releaseBalanceRead;
  let signalBalanceRead;
  let signalConflict;
  const balanceGate = new Promise((resolve) => {
    releaseBalanceRead = resolve;
  });
  const balanceReadStarted = new Promise((resolve) => {
    signalBalanceRead = resolve;
  });
  const conflictSeen = new Promise((resolve) => {
    signalConflict = resolve;
  });
  let lockAttempts = 0;
  let commits = 0;
  let ledgerWrites = 0;
  const getBalance = async () => {
    signalBalanceRead();
    await balanceGate;
    return 100;
  };

  mockTransferModels(t, {
    getBalance,
    onLedgerWrite() {
      ledgerWrites += 1;
    },
    findOneAndUpdate: async (filter, update, queryOptions) => {
      lockAttempts += 1;
      assert.deepEqual(filter, {
        _id: senderId,
        user: ownerId,
        status: "ACTIVE",
      });
      assert.deepEqual(update, { $inc: { __v: 1 } });
      assert.ok(queryOptions.session);
      if (lockAttempts > 1) {
        signalConflict();
        throw new Error("Simulated MongoDB write conflict");
      }
      return {
        _id: senderId,
        status: "ACTIVE",
        getBalance,
      };
    },
    onCommit() {
      commits += 1;
    },
  });

  const firstResponse = createResponse();
  const firstTransfer = createTransaction(createRequest(), firstResponse);
  await balanceReadStarted;

  const secondResponse = createResponse();
  const secondTransfer = createTransaction(createRequest(), secondResponse);
  await conflictSeen;
  releaseBalanceRead();
  await Promise.all([firstTransfer, secondTransfer]);

  assert.equal(firstResponse.statusCode, 201);
  assert.equal(secondResponse.statusCode, 500);
  assert.equal(commits, 1);
  assert.equal(ledgerWrites, 2);
});

test("getBalance runs its ledger aggregation in the supplied session", async (t) => {
  const session = {};
  let aggregationSession;
  mockMethod(
    ledgerModel,
    "aggregate",
    () => ({
      session(value) {
        aggregationSession = value;
        return this;
      },
      then(resolve, reject) {
        return Promise.resolve([{ balance: 40 }]).then(resolve, reject);
      },
    }),
    t,
  );

  const balance = await accountModel.schema.methods.getBalance.call(
    { _id: senderId },
    session,
  );

  assert.equal(aggregationSession, session);
  assert.equal(balance, 40);
});
