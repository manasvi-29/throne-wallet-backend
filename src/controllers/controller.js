const bcrypt = require("bcrypt");
const bip39 = require("bip39");
const walletModel = require("../models/walletModel");
const tokenModel = require("../models/tokenModel");
const transactionModel = require("../models/transactionModel");
const { ethers } = require("ethers");
const jwt = require("jsonwebtoken");
const { Alchemy, Network } = require("alchemy-sdk");
const axios = require("axios");
const seedTokens = require("../seedData/seedToken.json");
const sdk = require("api")("@coingate/v2#e0ju2clqgbcg7e");
require("dotenv").config();

const { utils, Wallet } = require("ethers");

const {
  encryptPrivateKey,
  decryptPrivateKey,
  encryptPhrase,
  decryptPhrase,
  generateRandomUsername,
  generateRandomPassword,
  encodeApiKey,
  shuffleArray,
  generateReferralCode,
} = require("../utils/util");
const notificationModel = require("../models/notificationModel");
const savedContactModel = require("../models/savedContactModel");
const referralModel = require("../models/referralModel");
const { logger } = require("../logger");
const passwordRegex = /^\d{6}$/;

//Alchemy configuration
const config_alchemy = {
  apiKey: process.env.ALCHEMY_API_KEY, // Replace with your API key
  network: Network.MATIC_MUMBAI, // Replace with your network
};
const alchemy = new Alchemy(config_alchemy);

const encodeAPIKey = async function (req, res) {
  try {
    const { username } = req.body;
    console.log(req.body);
    console.log(username, process.env.ACCESS_USERNAME);
    if (username === process.env.ACCESS_USERNAME) {
      let encodedKey = await encodeApiKey(username);

      //Add successfull log
      logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
        requestTime: Date.now() - req.startTime,
      });
      return res.status(200).send({
        status: true,
        message: "API key encoded successfully",
        key: encodedKey,
      });
    } else {
      logger.error(`API ${req.params.endpoint} error: You're not an authorized user`);
      return res
        .status(401)
        .send({ status: true, message: "You're not an authorized user" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};


const getAllTransactions = async function (req, res) {
  try {
    const { walletId } = req.params;

    const wallet = await walletModel.findOne({ _id: walletId });
    // const transactionList = await transactionModel
    //   .find({
    //     $or: [
    //       { sender_address: wallet.wallet_address },
    //       { receiver_address: wallet.wallet_address },
    //     ],
    //   })
    //   .sort({ createdAt: -1 });

    // if (transactionList.length === 0) {
    //   return res
    //     .status(404)
    //     .send({ status: false, message: "No Transaction Found" });
    // }

    let erc_20_url = `https://api-testnet.polygonscan.com/api?module=account&action=tokentx&address=${wallet.wallet_address}&startblock=45047520&page=1&offset=5&sort=desc&apikey=${process.env.POLYGON_API_KEY}`;
    const erc20_list = await axios.get(erc_20_url);

    let non_erc_20_url = `https://api-testnet.polygonscan.com/api?module=account&action=txlist&address=${wallet.wallet_address}&startblock=45047361&page=1&offset=10&sort=desc&apikey=${process.env.POLYGON_API_KEY}`;
    const non_erc20_list = await axios.get(non_erc_20_url);

    let transactionDataArr = [];
    if (erc20_list.data.message === "OK") {
      transactionDataArr.push(...erc20_list.data.result);
    }
    if (non_erc20_list.data.message === "OK") {
      transactionDataArr.push(...non_erc20_list.data.result);
    }

    if (transactionDataArr.length === 0) {
      return res
        .status(404)
        .send({ status: false, message: "No Transaction Found" });
    }
    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });
    return res.status(200).send({
      status: true,
      message: "Transaction fetched successfully",
      data: transactionDataArr,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};



const getAllAssetsOfWallet = async function (req, res) {
  try {
    const { walletId } = req.params;
    const wallet = await walletModel.findOne({ _id: walletId });

    if (!wallet) {
      return res
        .status(404)
        .send({ status: false, message: "Wallet not found" });
    }
    const assets = await tokenModel.find({
      $or: [
        { walletId: walletId, network: "MATIC_MUMBAI" },
        { type: "NATIVE COIN", network: "MATIC_MUMBAI" },
      ],
    });

    if (assets.length == 0) {
      return res
        .status(404)
        .send({ status: false, message: "Asset not found" });
    }

    let contractAddressArr = assets
      .filter((doc) => doc.type !== "NATIVE COIN")
      .map(({ token_contract_address }) => token_contract_address);
    console.log(contractAddressArr);
    // return;
    let response = await alchemy.core.getTokenBalances(
      wallet.wallet_address,
      contractAddressArr
    );
    let response2 = await alchemy.core.getBalance(
      wallet.wallet_address,
      "latest"
    );
    console.log("RESPONSE2", response2);
    console.log("RESPONSE", response);
    // return;
    const decimalMap = new Map();
    const balanceMap = new Map();
    assets.map((ele) =>
      decimalMap.set(ele.token_contract_address, ele.token_decimal)
    );

    response.tokenBalances.map((ele) => {
      let decimal = decimalMap.get(ele.contractAddress);
      balanceMap.set(ele.contractAddress, ele.tokenBalance / 10 ** decimal);
    });
    console.log("MAPS", decimalMap, balanceMap);

    assets.map((ele) => {
      if (ele.type !== "NATIVE COIN") {
        ele.balance = balanceMap.get(ele.token_contract_address);
      } else {
        ele.balance = response2._hex / 10 ** ele.token_decimal;
      }
    });
    const from = "MATIC";
    const to = "USD";
    const response_axios = await axios.get(
      `https://api.coingate.com/api/v2/rates/merchant/${from}/${to}`
    );
    console.log("ASSETS", assets);
    console.log("response_axios", response_axios);

    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });

    return res.status(200).send({
      status: true,
      message: "Assets Fetched successfully",
      data: assets,
      exchangeRate: response_axios.data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getAllReceivedToken = async function (req, res) {
  try {
    const { walletId } = req.params;

    const wallet = await walletModel.findOne({ _id: walletId });
    if (!wallet) {
      return res
        .status(404)
        .send({ status: false, message: "Wallet not found" });
    }

    const receiverTransaction = await transactionModel.find({
      receiver_address: wallet.wallet_address,
    });
    if (receiverTransaction.length == 0) {
      return res
        .status(404)
        .send({ status: false, message: "No Receiver Data Found" });
    }

    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });
    return res.status(200).send({
      status: true,
      message: "Receiver's Data fetched successfully",
      data: receiverTransaction,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};



const getPhraseWords = async function (req, res) {
  try {
    const { walletId } = req.params;

    const wallet = await walletModel.findOne({ _id: walletId });
    if (!wallet) {
      return res
        .status(404)
        .send({ status: false, message: "Wallet not found" });
    }
    // console.log(wallet)
    // console.log(wallet.encrypted_phrase)
    const decryptedPhrase = await decryptPhrase(wallet.encrypted_phrase);
    const values = Object.values(decryptedPhrase);
    // console.log('values', values)
    const shuffledArray = shuffleArray(values);
    // console.log("shuffled", shuffledArray)

    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });

    return res.status(200).send({
      status: true,
      message: "Recovery Phrase words fetched successfully",
      data: shuffledArray,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};



const updatePassword = async function (req, res) {
  try {
    const { walletId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res
        .status(400)
        .send({ status: false, message: "Pin is requried" });
    }
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).send({
        status: false,
        message: "Enter valid password, it should only contain 6 digits",
      });
    }

    const codedPassword = await bcrypt.hash(newPassword, 10);

    const updatedWallet = await walletModel.findOneAndUpdate(
      { _id: walletId },
      { $set: { password: newPassword, codedPassword: codedPassword } },
      { new: true }
    );
    if (!updatedWallet) {
      return res
        .status(404)
        .send({ status: false, message: "Wallet not found" });
    }

    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });
    return res.status(200).send({
      status: true,
      message: "Password updated successfully",
      data: updatedWallet,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};


const saveContact = async function (req, res) {
  try {
    const { receiver_address, nick_name } = req.body;
    const { walletId } = req.params;
    let obj = {};
    if (!receiver_address) {
      return res
        .status(400)
        .send({ status: false, message: "Receiver address is required" });
    }
    obj.receiver_address = receiver_address;

    if (!nick_name) {
      return res
        .status(400)
        .send({ status: false, message: "Nick name is required" });
    }
    obj.nick_name = nick_name;
    obj.walletId = walletId;

    const savedContact = await savedContactModel.create(obj);

    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });
    return res.status(200).send({
      status: true,
      message: "Contact saved successfully",
      data: savedContact,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getAllSavedContactForWallet = async function (req, res) {
  try {
    const { walletId } = req.params;

    const savedContacts = await savedContactModel.find({ walletId: walletId });

    if (savedContacts.length === 0) {
      return res
        .status(404)
        .send({ statsu: false, message: "No saved Contact found" });
    }

    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });

    return res.status(200).send({
      status: true,
      message: "Contact list fetched Successfully",
      data: savedContacts,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};

const getReferralCode = async function (req, res) {
  try {
    const { walletId } = req.params;

    const wallet = await walletModel.findOne({ _id: walletId });
    if (!wallet) {
      return res
        .status(404)
        .send({ status: false, message: "Wallet not found" });
    }
    let obj = {
      walletId: walletId,
    };
    const referralList = await referralModel.find({ walletId: walletId });

    if (referralList.length === 0) {
      obj.referral_code = generateReferralCode();
    } else {
      const lastReferral = referralList[referralList.length - 1];
      if (lastReferral.isExpired === true) {
        obj.referral_code = generateReferralCode();
      } else {
        //Add successfull log
        logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
          requestTime: Date.now() - req.startTime,
        });
        return res
          .status(200)
          .send({
            status: true,
            message: "Reference code fetched successfully",
            data: wallet,
          });
      }
    }

    const referralData = await referralModel.create(obj);
    const updatedWallet = await walletModel.findOneAndUpdate(
      { _id: walletId },
      { $set: { referral_code: referralData.referral_code } },
      { new: true }
    );

    //Add successfull log
    logger.info(`API ${req.params.endpoint} success: ${res.statusCode}`, {
      requestTime: Date.now() - req.startTime,
    });
    return res
      .status(200)
      .send({
        status: true,
        message: "Referral Code fetched successfully",
        data: updatedWallet,
      });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ status: false, message: error.message });
  }
};
module.exports = {
  encodeAPIKey,
  createWallet,
  generateRecoveryPhrase,
  updateWalletWithPhrase,
  encryptRecoveryPhrase,
  decryptRecoveryPhrase,
  verifyRecoveryPhrase,
  importToken,
  sendToken,
  getAllTransactions,
  importWallet,
  verifyPhraseForImportWallet,
  getPrivateKey,
  getAllAssetsOfWallet,
  getAllReceivedToken,
  generateCreds,
  generateToken,
  getTokenMetadata,
  getPhraseWords,
  getParticularTokenOfWallet,
  verifyPin,
  updatePassword,
  getAllNotifications,
  getERC20TransactionHistory,
  getNonERC20TransactionHistory,
  getParticularTransaction,
  saveContact,
  getAllSavedContactForWallet,
  getReferralCode,
};
