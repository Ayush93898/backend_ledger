const accountModel = require("../models/account.model");
const ledgerModel = require("../models/ledger.model");
const transactionModel = require("../models/transaction.model");
const emailService = require("../services/email.service");
const mongoose = require("mongoose");

/**
 ** - creates a new transaction
 * The 10 step TRANSFER FLOW
 * 1. Validate request -- we have to check as req user ke hi from acc se hi aari hai ya nahi
 * 2. Validate idempotency key
 * 3. check account status
 * 4. Derive sender balance from ledger
 * 5. creates transaction (Pending)
 * 6. creates DEBIT ledger entry
 * 7. creates CREDIT ledger entry
 * 8. mark transaction completed
 * 9. Commit mongoDb session
 * 10. send email notification
 */

// we also have to create a api in such way that add fundings to diff accounts
// to hum system ka ek account create karege , as aisa hi hawa me fund ko leke nahi aa sakte, we have to tell the origin (As fund kaha se aaye hai) .. ledger  entry create hoti hai jisme batana hai system ke acc se aaya
// so first we have to create system user and then and usse fir ek system account karna hoga

const createTransaction = async (req, res) => {
  // 1. Validate request
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "fromAccount, toAccount, amount and idempotencyKey are required",
    });
  }

  // now check fromAcc or toAcc exist karte bhi hai ya nahi
  const fromUserAccount = await accountModel.findOne({ _id: fromAccount });
  const toUserAccount = await accountModel.findOne({ _id: toAccount });

  if (!fromUserAccount || !toUserAccount) {
    return res.status(400).json({
      message: "Invalid fromAccount or toAccount",
    });
  }

  //  2. Validate idempotency key
  const isTransactionAlreadyExists = await transactionModel.findOne({
    idempotencyKey: idempotencyKey,
  });
  
};

// basically kiske acc me kitna paisa jana hai or kitna jana with idempotency key
const createInitialFundsTransaction = async (req, res) => {
  const { toAccount, amount, idempotencyKey } = req.body;
  if (!toAccount || !amount || !idempotencyKey) {
    return res.status(400).json({
      message: "toAccount, amount and idempotencyKey are required",
    });
  }

  // now check toAcoount id ke sath koi user exist karta hai ya nahi
  const toUserAccount = await accountModel.findOne({
    _id: toAccount,
  });

  if (!toUserAccount) {
    return res.status(400).json({
      message: "Invalid toAccount",
    });
  }

  // so toAcc me paisa bhjna hai systemAcc me se i.e simply fromAcc
  const fromUserAccount = await accountModel.findOne({
    user: req.user._id,
  });

  if (!fromUserAccount) {
    return res.status(400).json({
      message: "System user account not found",
    });
  }

  // now we have toAcc and fromAcc --- so now we can initiate an transcation

  // for that we have to create a session
  const session = await mongoose.startSession();
  session.startTransaction();

  // create a instance of transaction
  const transaction = new transactionModel({
    fromAccount: fromUserAccount._id,
    toAccount,
    amount,
    idempotencyKey,
    status: "PENDING",
  });

  // create ledger entry
  const debitLedgerEntry = await ledgerModel.create(
    [
      {
        account: fromUserAccount._id,
        amount,
        transaction: transaction._id,
        type: "DEBIT",
      },
    ],
    { session },
  );

  const creditLedgerEntry = await ledgerModel.create(
    [
      {
        account: toAccount,
        amount,
        transaction: transaction._id,
        type: "CREDIT",
      },
    ],
    { session },
  );

  transaction.status = "COMPLETED";
  await transaction.save({ session });
  await session.commitTransaction();
  session.endSession();
  return res.status(201).json({
    message: "Initial funds transaction completed successfully",
    transaction: transaction,
  });
};

module.exports = { createTransaction, createInitialFundsTransaction };
