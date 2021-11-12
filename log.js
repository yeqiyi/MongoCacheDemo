const log4js = require('log4js');
log4js.configure({
    appenders: {
        access: { type: 'file', filename: './log/runtime.log' }
    },
    categories: {
        default: {
            appenders: ['access'],
            level: 'trace'
        }
    }
});

const logger = log4js.getLogger();

module.exports = {
    logger: logger
}