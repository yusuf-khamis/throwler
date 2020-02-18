const sinon = require('sinon')
const fs = require('fs')
const path = require('path')
const moment = require('moment')
const crypto = require('crypto')

const { createLogger } = require('.')

describe('Testing initializing logger to return a logging function', () => {
  it('should return a function if no parameters passed', () => {
    expect(typeof createLogger()).toBe('function')
  })

  it('should return a function if parameters are passed', () => {
    expect(typeof createLogger({ output: 'console', timestamp: false })).toBe('function')
  })

  it('should return a function if invalid option values are passed and the invalid option values will be replaced with the default values', () => {
    expect(typeof createLogger({
      output: 'other',
      timestamp: Date.now(),
      autorotate: 'yearly',
      dirDateFormat: '',
      dateFormat: '',
      dir: true,
      size: 'l'
    })).toBe('function')
  })
})

describe('Testing console log output logs', () => {
  let consoleLogStub

  beforeEach(() => {
    consoleLogStub = sinon.stub(console, 'log')
  })

  afterEach(() => {
    consoleLogStub.restore()
  })

  it('should call console.log function if output is console', () => {
    const logger = createLogger({
      output: 'console'
    })

    logger('testing logger console output')

    expect(consoleLogStub.called).toBe(true)
  })
})

describe('Testing write stream function to output logs to a file', () => {
  let createStreamStub
  let fsMkdirSyncStub

  let writeStreamStub
  let onceStreamEventStub
  let endStreamStub
  let onStreamStub

  beforeEach(() => {
    writeStreamStub = sinon.stub()
    onceStreamEventStub = sinon.stub()
    endStreamStub = sinon.stub()
    onStreamStub = sinon.stub()

    createStreamStub = sinon.stub(fs, 'createWriteStream').returns({
      write: writeStreamStub,
      once: onceStreamEventStub,
      end: endStreamStub,
      on: onStreamStub
    })

    fsMkdirSyncStub = sinon.stub(fs, 'mkdirSync')
  })

  afterEach(() => {
    createStreamStub.restore()
    fsMkdirSyncStub.restore()
  })

  it('logging with file output should create the log folder if it does not exists', () => {
    createLogger({
      output: 'file',
      dir: path.join(__dirname, 'logs')
    })

    expect(fsMkdirSyncStub.called).toBe(true)
  })

  it('logging with file output but with non-existent folder and parent folder should throw an error', () => {
    expect(() => createLogger({
      output: 'file',
      dir: path.join(__dirname, 'parent', 'log')
    })).toThrow()
  })

  it('logging with file output and with dir specified as existing folder should throw an error', () => {
    expect(() => createLogger({
      output: 'file',
      dir: path.join(__dirname, 'README.md')
    })).toThrow()
  })

  it('logging to file should create the autorotate folder if it does not exist', () => {
    const logger = createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log')
    })

    logger('testing logger')

    expect(fsMkdirSyncStub.called).toBe(true)
  })

  it('logging to file with autorotate disabled should not create the autorotate folder', () => {
    const logger = createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log'),
      autorotate: 'none'
    })

    logger('testing logger')

    expect(fsMkdirSyncStub.called).toBe(false)
  })

  it('logging to file with the file not existing should log to file with suffix `_1.log`', () => {
    const logger = createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log'),
      autorotate: 'none'
    })

    logger('testing logger')

    expect(createStreamStub.getCall(0).args[0]).toMatch(/(_1.log)$/)
  })

  it('logging to file with a size limit and the previous file having reached the limit should call log to another file with an incremented number', () => {
    const logger = createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log'),
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '10K'
    })

    const filename = path.join(__dirname, 'log', moment().format('DD-MMMM-YYYYTHH') + '_1.log')

    fs.writeFileSync(filename, crypto.randomBytes(10 * 1024))

    logger('testing logger')

    expect(createStreamStub.getCall(0).args[0]).toMatch(/(_2.log)$/)

    fs.unlinkSync(filename)
  })

  it('logging to a file with size limit specified in form of gigabytes should write to the same file when its size is below the limit', () => {
    const logger = createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log'),
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '1G'
    })

    const filename = path.join(__dirname, 'log', moment().format('DD-MMMM-YYYYTHH') + '_1.log')

    fs.writeFileSync(filename, crypto.randomBytes(50 * 1024))

    logger('testing logger')

    expect(createStreamStub.getCall(0).args[0]).toMatch(/(_1.log)$/)

    fs.unlinkSync(filename)
  })

  it('logging to a file with size limit specified in form of megabytes should write to the same file when its size is below the limit', () => {
    const logger = createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log'),
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '10M'
    })

    const filename = path.join(__dirname, 'log', moment().format('DD-MMMM-YYYYTHH') + '_1.log')

    fs.writeFileSync(filename, crypto.randomBytes(20 * 1024))

    logger('testing logger')

    expect(createStreamStub.getCall(0).args[0]).toMatch(/(_1.log)$/)

    fs.unlinkSync(filename)
  })

  it('logging to file with level passed should write to the file with the level as part of the filename suffix in lowercase', () => {
    const logger = createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log'),
      autorotate: 'none'
    })

    logger('testing logger', 'Warn')

    expect(createStreamStub.getCall(0).args[0]).toMatch(/(_warn_1.log)$/)
  })
})
