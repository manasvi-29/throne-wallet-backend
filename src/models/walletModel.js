const mongoose = require('mongoose')

const walletSchema = new mongoose.Schema({
    password:{
        type: Number,
        // required:true
    },
    codedPassword:{
        type: String,
        // required: true
    },
    encrypted_phrase: {
        type:String
    },
    wallet_address:{
        type:String,
        required:true
    },
    encrypted_private_key:{
        type:String,
        required:true
    },
    iv:{
        type:String,
        required:true
    },
    salt:{
        type:String,
        required:true
    },
    isReferred:{
        type:Boolean,
        default:false
    },
    referred_from_code:{
        type:String
    },
    referral_code:{
        type:String
    }
},{timestamps: true})

module.exports = mongoose.model('wallets', walletSchema)