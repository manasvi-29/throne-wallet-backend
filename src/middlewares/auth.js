const jwt = require('jsonwebtoken');
const walletModel = require('../models/walletModel');
const { encodeApiKey } = require('../utils/util');
require('dotenv').config()


const verifyAPIKey = async function (req,res,next){
    try{
        const x_api_key = req.headers["x-api-key"]
        if(!x_api_key){
            return res.status(401).send({status:false, message:"Access Denied without API key"})
        }
        console.log(process.env.ACCESS_USERNAME)
        const expectedApiKey = await encodeApiKey(process.env.ACCESS_USERNAME);
        console.log(x_api_key,"--------", expectedApiKey)
        if(x_api_key !== expectedApiKey){
            return res.status(401).send({status:false, message:"You're not an authorized user"})
        }else{
            next()
        }
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: false, message: error.message });
      }
}


const authentication = async function(req,res,next){
    try{
        let token = req.headers.authorization || req.headers.Authorization
        // console.log(token)
        if (!token)
        return res
          .status(401)
          .send({ status: false, message: "token must be present" });
        token = token.split(" ")[1]

        let decoded = jwt.verify(token, process.env.ACCESS_JWT_KEY, (err,decoded)=>{
            if(err)return res.status(401).send({status:false, error:err.message})
            else{
                req.token = decoded
                next()
            }
        })
    } catch (error) {
    console.log(error)
    return res.status(500).send({ status: false, message: error.message });
  }
}


const authorization = async function(req,res,next){
    try{
        const {walletId} = req.params
        const walletLoggedIn = req.token.wallet_id
        
        const wallet = await walletModel.findOne({_id:walletId})
        if(!wallet){
            return res.status(404).send({status:false, message:"Wallet not Found"})
        }

        if(walletId !== walletLoggedIn){
            return res.status(403).send({status:false, message:"You're not authorized to perform this task"});
        }else{
            next()
        }
    }catch(error){
        console.log(error)
        return res.status(500).send({status:false,Error:error.message})
    }
}




module.exports = {verifyAPIKey, authentication, authorization, refreshauth}