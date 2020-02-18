'use strict'

const path = require('path')
const fs = require('fs')
const util = require('util')
const moment = require('moment')
const glob = require('glob')

const defaultOpts = {
  output: 'file',
  timestamp: true,
  autorotate: 'hourly',
  dirDateFormat: 'DD-MMMM-YYYY',
  dateFormat: 'DD-MMMM-YYYYTHH',
  dir: '.',
  size: '10M'
}

// Create logger function prepares the logger and returns a logging function
// The function takes the logging options as parameter
function createLogger (options) {
  const opts = options || {}

  // Option to specify transport, whether 'console' or 'file'
  if (!opts.output || (opts.output && !String(opts.output).match(/^(console|file)$/))) {
    opts.output = defaultOpts.output
  }

  // Option whether or not to include timestamp on the final log
  if (typeof opts.timestamp !== 'boolean') {
    opts.timestamp = defaultOpts.timestamp
  }

  // Option whether to autorotate the logs (change log file after the specified period)
  // Works with file transport only
  if (!opts.autorotate || (opts.autorotate && !String(opts.autorotate).match(/^(hourly|daily|none)$/))) {
    opts.autorotate = defaultOpts.autorotate
  }

  // Option to specify the date format for the log directory
  if (!String(opts.dirDateFormat).match(/^[-_., /\\DMY]+$/)) {
    opts.dirDateFormat = defaultOpts.dirDateFormat
  }

  // Sets the date format if not specified in the options
  if (!String(opts.dateFormat).match(/^[-_., /\\DMYTH]+$/)) {
    opts.dateFormat = defaultOpts.dateFormat
  }

  // Validates the directory option
  if (typeof opts.dir === 'string') {
    // The directory name should not be a file
    if (fs.existsSync(opts.dir) && fs.lstatSync(opts.dir).isFile()) {
      const error = new Error('Directory \'' + opts.dir + '\' is a file')
      error.name = 'ERR_INVALID_ARG_TYPE'

      throw error
    }

    // If the directory does not exists but has a parent, it is created,
    // But if the directory and its parent do not exists, throw an error
    if (!fs.existsSync(opts.dir)) {
      if (!fs.existsSync(path.dirname(opts.dir))) {
        const error = new Error('There is no such directory or parent directory \'' + opts.dir + '\'')
        error.name = 'ENOENT'

        throw error
      }

      fs.mkdirSync(opts.dir)
    }
  } else {
    opts.dir = defaultOpts.dir
  }

  // Validates the size option, to decide whether to autorotate the log file when the reach the disk size specified
  if (!opts.size || !String(opts.size).match(/^\d+(M|K|G)$/i)) {
    opts.size = defaultOpts.size
  }

  // The function which when called, will be outputting the logs in the transport specified (either console or file)
  return function (content, level) {
    if (level) {
      level = '_' + String(level).toLowerCase()
    } else {
      level = ''
    }

    const data = {
      timestamp: moment().format('YYYY-MMM-DDTHH:mm:ss'),
      ...(level && { level: level.substr(1) }),
      content: content
    }

    const utilOptions = {
      depth: Infinity,
      maxArrayLength: Infinity
    }

    if (opts.output === 'file') {
      let dirname

      if (opts.autorotate === 'none') {
        dirname = opts.dir
      } else {
        dirname = path.join(opts.dir, moment().format(opts.dirDateFormat))
      }

      const filenamePattern = path.join(dirname, moment().format(opts.dateFormat) + level + '_*.log')

      if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname)
      }

      const logFiles = glob.sync(filenamePattern)

      let filename = filenamePattern.substring(0, filenamePattern.lastIndexOf('*')) + (logFiles.length || 1) +
        filenamePattern.substring(filenamePattern.lastIndexOf('*') + 1)

      if (fs.existsSync(filename)) {
        const stats = fs.statSync(filename)

        const unit = opts.size.match(/(m|k|g)/i)[0].toLowerCase()
        const size = Number(opts.size.match(/\d+/)[0])

        let comparisonSize = 0

        switch (unit) {
          case 'k':
            comparisonSize = size * 1024

            break
          case 'm':
            comparisonSize = size * 1048576

            break

          case 'g':
            comparisonSize = size * 1073741824

            break
        }

        if (stats.size >= comparisonSize) {
          const num = (logFiles.length || 1) + 1

          filename = filenamePattern.substring(0, filenamePattern.lastIndexOf('*')) + num +
            filenamePattern.substring(filenamePattern.lastIndexOf('*') + 1)
        }
      }

      const stream = fs.createWriteStream(filename, {
        flags: 'a+',
        encoding: 'utf8'
      })

      let count = 0

      const writeFn = function () {
        process.nextTick(() => {
          count += 1

          const writeData = Buffer.concat([
            Buffer.from(util.inspect(data, utilOptions), 'utf8'),
            Buffer.from('\n\n', 'utf8')
          ])

          if (stream.write(writeData)) {
            stream.end()

            return
          }

          stream.once('drain', writeFn)
        })
      }

      stream.on('error', err => {
        console.log(err)

        if (count <= 3) {
          writeFn()
        }
      })

      writeFn()
    } else {
      console.log(util.inspect(data, utilOptions))
    }
  }
}

module.exports.createLogger = createLogger
