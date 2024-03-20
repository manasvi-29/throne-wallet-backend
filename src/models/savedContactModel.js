const mongoose = require("mongoose");

const savedContactSchema = new mongoose.Schema({
    walletId:{
        type: mongoose.Schema.Types.ObjectId,
        required:true
    },
    nick_name:{
        type:String,
        required:true
    },
    receiver_address:{
        type:String,
        required:true
    }
},{timestamps:true})


module.exports = mongoose.model('savedcontact',savedContactSchema)