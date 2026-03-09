const mongoose = require('mongoose')

const tokenBlackListSchema = new mongoose.Schema({
    token:{
        type:String,
        required:[true,"Token is required to blacklist"],
        unqiue:[true,"Token is already blacklisted"]
    }
},{timestamps:true})

tokenBlackListSchema.index({createdAt:1},{
    expireAfterSeconds:60*60*24*3 // whenever we blacklist a token , toh db me sirf 3 din tak rahega
})

const tokenBlackListModel = mongoose.model("tokenBlackList",tokenBlackListSchema)
module.exports = tokenBlackListModel