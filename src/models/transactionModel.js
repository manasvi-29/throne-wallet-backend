const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
    sender_address:{
        type:String,
        required:true
    },
    receiver_address:{
        type:String,
        required:true
    },
    token:{
        type:String,
        required:true
    },
    amount:{
        type:String,
        required:true
    },
    transaction_hash:{
        type:String,
        required:true
    }
},{timestamps:true})


module.exports = mongoose.model('transaction',transactionSchema)