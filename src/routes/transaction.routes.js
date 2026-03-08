const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction.controller");
const authMiddleware = require("../middlewares/auth.middleware");

// POST -> /api/transactions/ --> create a new transcation

router.post(
  "/",
  authMiddleware.authMiddleware,
  transactionController.createTransaction,
);

// POST-> /api/transactions/system/initial-funds
// creates initial funds transaction from system user
router.post(
  "/system/initial-fund",
  authMiddleware.systemUserMiddleware,
  transactionController.createInitialFundsTransaction,
);

module.exports = router;
