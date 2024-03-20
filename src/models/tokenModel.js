const mongoose = require('mongoose')

const tokenSchema = new mongoose.Schema({
    walletId:{
        type: mongoose.Schema.Types.ObjectId,
        // required:true
    },
    token_name:{
        type: String,
        required:true
    },
    token_contract_address: {
        type: String,
        // required:true
    },
    token_symbol: {
        type:String,
        required: true
    },
    token_decimal: {
        type:Number,
        required: true
    },
    balance: {
        type: Number,
        requried:true,
        default: 0
    },
    token_logo: {
        type:String,
        // required: true
    },
    network:{
        type:String,
        enum:["ETH_MAINNET", "ETH_GOERLI", "MATIC_MAINNET", "MATIC_MUMBAI"]
    },
    erc_20:{
        type:Boolean,
        required:true
    },
    type:{
        type:String,
        enum:["NATIVE COIN","TOKEN"]
    },
    chainID:{
        type:String
    }
},{timestamps:true})

module.exports = mongoose.model('token', tokenSchema)