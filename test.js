const path = require('path');
const cluster = require('cluster');
const os = require('os');
const createLogger = require('..').createLogger;

const options = {
    autorotate: 'daily',
    dateFormat: process.env.LOG_DATETIME_FORMAT,
    dirDateFormat: process.env.LOG_DATE_FORMAT,
    timestamp: true,
    output: 'file',
    levels: [
        'info', 'warning', 'error'
    ],
    dir: path.resolve(__dirname, 'logs')
};

const logger = createLogger(options);

if (cluster.isMaster) {
    for (let i = 0; i < os.cpus().length; i++) {
        cluster.fork();
    }
} else {
    for (let i = 0; i < 100000; i++) {
        (async function() {
            logger({options, options, options}, options.levels[parseInt(Math.random() * 3)]);
        })();
    }
}