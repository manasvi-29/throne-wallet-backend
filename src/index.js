const express = require('express')
const mongoose = require('mongoose')
require('dotenv').config()
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const { initiateMaticToken } = require('./utils/util');

const app = express()

app.use(helmet());

app.options('*', cors());
app.use(cors());

app.use(express.json())

// Apply rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  
app.use(limiter);


mongoose.connect(process.env.DB_URL,{
    useNewUrlParser: true,
})
.then(()=>{
    initiateMaticToken()
    console.log("MongoDb Connected")
})
.catch((err)=>{
    console.log(err)
    process.exit(1)
})

app.use('/', require('./routes/route'))
app.listen(process.env.PORT,function(){
    console.log("Express app running on port " + (process.env.PORT))
})