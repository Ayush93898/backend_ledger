const accountModel = require("../models/account.model");

// get data from the user and creates the account  but before that it checked whether user is loggedIN or not
// that is basically req ek valid logged in user se aani chai (so MIDDLEWARE..   by the help of token we can verify)

// acc create controller
const createAcconutController = async (req, res) => {
  const user = req.user; // from middleware bruh
  const account = await accountModel.create({
    user: user._id,
  });

  res.status(201).json({
    account,
  });
};

const getUserAccountsController = async (req, res) => {
  const accounts = await accountModel.find({ user: req.user._id });
  res.status(200).json({
    accounts,
  });
};

// get-account balance controller
const getAccountBalanceController = async (req, res) => {
  const { accountId } = req.params;
  // also check jo account id aari hai kya wo usi user ka account hai ya nahi

  const account = await accountModel.findOne({
    _id: accountId,
    user: req.user._id,
  });

  if (!account) {
    return res.status(404).json({
      message: "Account not found",
    });
  }

  const balance = await account.getBalance();
  res.status(200).json({
    message: "balance fetched successfully",
    accountId: accountId,
    balance: balance,
  });
};
module.exports = {
  createAcconutController,
  getUserAccountsController,
  getAccountBalanceController,
};
