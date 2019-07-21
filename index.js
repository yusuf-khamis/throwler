const path = require('path');
const fs = require('fs');
const util = require('util');
const moment = require('moment');

const defaultOpts = {
    output: 'file',
    levels: [],
    timestamp: true,
    autorotate: 'hourly',
    dirDateFormat: 'DD-MMMM-YYYY',
    dateFormat: 'DD-MMMM-YYYYTHH',
    dir: '.'
};

/**
 * Create a logger for logging
 *
 * @param options Logging options
 */
function createLogger(options) {
    let opts = options || {};

    if (!opts.output || opts.output && !String(opts.output).match(/^(console|file)$/)) {
        opts.output = defaultOpts.output;
    }

    if(!(opts.levels instanceof Array) || opts.levels instanceof Array && opts.levels.find(level => !String(level).match(/^[a-z]+$/i))) {
        opts.levels = defaultOpts.levels;
    }

    if (typeof opts.timestamp !== 'boolean') {
        opts.timestamp = defaultOpts.timestamp;
    }

    if (!opts.autorotate || opts.autorotate && String(opts.autorotate).match(/^(hourly|daily|none)$/)) {
        opts.autorotate = defaultOpts.autorotate;
    }

    if (!String(opts.dirDateFormat).match(/^[-_., \/\\DMY]+$/)) {
        opts.dirDateFormat = defaultOpts.dirDateFormat;
    }

    if (!opts.dateFormat) {
        opts.dateFormat = defaultOpts.dateFormat;
    }

    if (opts.dir) {
        if (fs.existsSync(opts.dir) && fs.lstatSync(opts.dir).isFile()) {
            let error = new Error('Directory \'' + opts.dir + '\' is a file');
            error.name = 'ERR_INVALID_ARG_TYPE';

            throw error;
        }

        if (!fs.existsSync(opts.dir)) {
            if (!fs.existsSync(path.dirname(opts.dir))) {
                let error = new Error('There is no such directory or parent directory \'' + opts.dir + '\'');
                error.name = 'ENOENT';

                throw error;
            }

            fs.mkdirSync(opts.dir);
        }
    } else {
        opts.dir = defaultOpts.dir;
    }

    return function (content, level) {
        if (!level || !opts.levels.find(item => item.toLowerCase() === String(level).toLowerCase())) {
            level = '';
        } else {
            level = '_' + String(opts.levels.find(item => item.toLowerCase() === String(level).toLowerCase())).toLowerCase();
        }

        let dirname;

        if (opts.autorotate === 'none') {
            dirname = opts.dir;
        } else {
            dirname = opts.dir + path.sep + moment().format(opts.dirDateFormat);
        }

        const filename = dirname + path.sep + moment().format(opts.dateFormat) + level + '.log';

        if (opts.output === 'file' && !fs.existsSync(dirname)) {
            try {
                fs.mkdirSync(dirname);
            } catch (e) { }
        }

        const data = {
            timestamp: moment().format('YYYY-MM-DDTHH:mm:ss'),
            ...(level && { level: level.substr(1) }),
            content: content
        };

        const utilOptions = {
            depth: Infinity,
            maxArrayLength: Infinity
        };

        if (opts.output === 'file') {
            const stream = fs.createWriteStream(filename, {
                flags: 'a+',
                encoding: 'utf8'
            });

            const writeFn = function() {
                const writeData = Buffer.concat([Buffer.from(util.inspect(data, utilOptions)), Buffer.from('\n\n')]);

                if (stream.write(writeData)) {
                    stream.end();

                    return;
                }

                stream.once('drain', writeFn);
            };

            stream.on('error', err => {
                console.log(err);

                writeFn();
            });

            writeFn();
        } else {
            console.log(util.inspect(data, utilOptions));
        }

    }
}

module.exports.createLogger = createLogger;
