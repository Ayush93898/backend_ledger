// for transactions we have to create multiple accounts...
// as single user have diffferent accounts

const mongoose = require("mongoose");
const ledgerModel = require("./ledger.model");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      required: [true, "Account must be associated with a user"],
      index: true, // for making searching more optimal (BTS me B+ tree use hota hai)
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be ACTIVE, FROZEN or CLOSED",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      required: [true, "Currency is required for creation of account"],
      default: "INR",
    },
    // hum yaha pe balance nhi rakhte hai(db me direct balance kabhi use nhi hota... we use ledger )
  },
  { timestamps: true },
);

// Final Balance = Total CREDIT - Total DEBIT
// goal : -> "Find the balance of THIS account by looking at its ledger entries"
accountSchema.methods.getBalance = async function () {
  const balanceData = await ledgerModel.aggregate([
    { $match: { account: this._id } }, // stage 1 -> From ALL ledger entries, only give me entries that belong to **this account

    { // Stage 2 — $group (Calculate)
      $group: {
        _id: null, // group everything into ONE result (defines how you want to group your documents.)
        //  eg -> Result: [{ _id: null, totalDebit: 100, totalCredit: 800 }]
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$type", "DEBIT"] }, "$amount", 0], // $cond is basically a ternary operator:
             //  if type === "DEBIT"  →  add amount, else add 0
          },
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$type", "CREDIT"] }, "$amount", 0],
          },
        },
      },
    },

    {// Stage 3 — $project (Shape the output)
      $project: {
        _id: 0, // hide _id
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ]); // agg pipeline -> custom query run kar sakte hai

  // but if user ka acc naya hia toh ledger me entry nhi hoti , then balanceData returns a empty array
  if (balanceData.length === 0) {
    return 0;
  }

  return balanceData[0].balance; // eg->[{ balance: 700 }] // extract value inside the object
};

// another index --  compound index (as ek se zyda feild par index hai na)
accountSchema.index({ user: 1, status: 1 }); // to find according to user as well as status also

const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel;
