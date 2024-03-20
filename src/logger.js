const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { colorize } = winston.format

const logDir = './src/logFiles'; // Ensure this directory exists


const logger = winston.createLogger({

    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new DailyRotateFile({
            filename: `${logDir}/%DATE%.log`,
            level: 'info',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true
        })
    ],
});



module.exports = {logger}
