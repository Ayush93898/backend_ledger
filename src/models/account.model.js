// for transactions we have to create multiple accounts...
// as single user have diffferent accounts

const mongoose = require("mongoose");

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

// another index --  compound index (as ek se zyda feild par index hai na)
accountSchema.index({ user: 1, status: 1 }); // to find according to user as well as status also

const accountModel = mongoose.model("account", accountSchema);
module.exports = accountModel;
