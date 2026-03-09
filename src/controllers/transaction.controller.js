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

  if (isTransactionAlreadyExists) {
    if (isTransactionAlreadyExists.status === "COMPLETED") {
      return res.status(200).json({
        message: "Transaction already processed",
        transaction: isTransactionAlreadyExists,
      });
    } else if (isTransactionAlreadyExists.status === "PENDING") {
      return res.status(200).json({
        message: "Transaction is still processing",
      });
    } else if (isTransactionAlreadyExists.status === "FAILED") {
      return res.status(500).json({
        message: "Transaction processing failed, please retry",
      });
    } else if (isTransactionAlreadyExists.status === "REVERSED") {
      return res.status(500).json({
        message: "Transaction was reversed, please retry",
      });
    }
  }

  // now idempot.. key exist nahi karti (i.e req pehli bar aari hai for transfer amount)
  //3. check account status
  // basically ye check karna hai toAcc or fromAcc "CLOSED" or "FROZEN" to nahi hai
  // amount will be transfers when both acc are "ACTIVE"

  if (
    fromUserAccount.status !== "ACTIVE" ||
    toUserAccount.status !== "ACTIVE"
  ) {
    return res.status(400).json({
      message:
        "Both 'To' and 'From' account must be ACTIVE to process transaction ",
    });
  }

  // 4. Derive sender balance from ledger
  // i.e sender ka balance toh dekhna does it have sufficient balance, then we deduct and transfer to another account
  // for that we see basic of agg pipeline
  const balance = await fromUserAccount.getBalance();
  if (balance < amount) {
    return res.status(400).json({
      message: `Insufficient balance. Current balance: ${balance}, Requested: ${amount}`,
    });
  }

  // 5. creates transaction (Pending)
  let transaction;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    transaction = (
      await transactionModel.create(
        [
          {
            fromAccount,
            toAccount,
            amount,
            idempotencyKey,
            status: "PENDING",
          },
        ],
        { session },
      )
    )[0]; // i.e Immediate Destructuring by Index as .create me array pass kia hai

    // 6. creates DEBIT ledger entry
    const debitLedgerEntry = await ledgerModel.create(
      [
        {
          account: fromAccount,
          amount: amount,
          transaction: transaction._id,
          type: "DEBIT",
        },
      ],
      { session },
    );

    // 7. creates CREDIT ledger entry
    const creditLedgerEntry = await ledgerModel.create(
      [
        {
          account: toAccount,
          amount: amount,
          transaction: transaction._id,
          type: "CREDIT",
        },
      ],
      { session },
    );

    // 8. mark transaction completed
    await transactionModel.findOneAndUpdate(
      { _id: transaction._id },
      { status: "COMPLETED" },
      { session, new: true },
    );

    // 9. Commit mongoDb session
    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    try {
      await emailService.sendTransactionFailureEmail(
        req.user.email,
        req.user.name,
        amount,
        toAccount,
      );
    } catch (emailError) {
      console.error("Failure email notification failed:", emailError);
    }
    return res.status(500).json({
      message: "Transaction failed, please retry after sometime",
    });
  } finally {
    session.endSession();
  }

  // 10. Send email notification
  try {
    await emailService.sendTransactionEmail(
      req.user.email,
      req.user.name,
      amount,
      toAccount,
    );
  } catch (emailError) {
    console.error("Email notification failed:", emailError);
  }

  return res.status(201).json({
    message: "Transaction completed successfully",
    transaction: transaction,
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

// what 2nd step of creating new transaction done
/*
Client sends request with idempotencyKey (e.g. "uuid-abc-123")
         ↓
Check DB — does a transaction with this key already exist?
         ↓
    YES → What is its status?
         ↓
    COMPLETED → "Already done, here's the result"
    PENDING   → "Still processing, wait"
    FAILED    → "It failed, you can retry"
    REVERSED  → "It was reversed, you can retry"
         ↓
    NO → (proceed to create new transaction)
*/
