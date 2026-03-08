const express = require("express");
const authMiddleware = require("../middlewares/auth.middleware");
const accountController = require("../controllers/account.controller");
const router = express.Router();

// POST /api/accounts/ -> create new account , protected route
router.post(
  "/",
  authMiddleware.authMiddleware,
  accountController.createAcconutController,
);

// get all accounts
// get --> /api/accounts/ -- all accounts for the logged-in user
router.get("/",authMiddleware.authMiddleware, accountController.getUserAccountsController)

module.exports = router;
