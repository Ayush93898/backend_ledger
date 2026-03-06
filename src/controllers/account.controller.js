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

module.exports = {createAcconutController}