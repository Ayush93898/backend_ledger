const mongoose = require('mongoose')

// Key Point: Ledger entries are immutable by nature — you never edit a past transaction, you only add new ones.
const ledgerSchema = new mongoose.Schema({
    account:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"account",
        required:[true,"Legder must be associated with an account"],
        index:true,
        immutable:true // once saved, can never be updated
    },
    amount:{
        type:Number,
        required:[true,"Amount is required for creating a ledger entry"],
        immutable:true // once saved, can never be updated
    },
    transaction:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"transaction"
    },
    type:{
        type:String,
        enum:{
            values:["CREDIT","DEBIT"], // CREDIT = Money coming IN to your account,DEBIT = Money going OUT from your account
            message:"Type can be either CREDIT or DEBIT"
        },
        required:[true,"Ledger type is required"],
        immutable:true // once saved, can never be updated
    }
},{timestamps:true})

// as is ledger ko hum first create hone dete hai, but future me usko modified na karpaye, for that we use some hooks
function preventLedgerModification(){
    throw new Error("Ledger entries are immutable and cannot be modified or deleted")
}

ledgerSchema.pre('findOneAndUpdate', preventLedgerModification)
ledgerSchema.pre('updateOne', preventLedgerModification)
ledgerSchema.pre('deleteOne', preventLedgerModification)
ledgerSchema.pre('remove', preventLedgerModification)
ledgerSchema.pre('deleteMany', preventLedgerModification)
ledgerSchema.pre('updateMany', preventLedgerModification)
ledgerSchema.pre('findOneAndDelete', preventLedgerModification)
ledgerSchema.pre('findOneAndReplace', preventLedgerModification)

const ledgerModel = mongoose.model('ledger',ledgerSchema)
module.exports = ledgerModel