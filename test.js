const fs = require('fs')
const glob = require('glob')
const path = require('path')

jest.mock('fs')
jest.mock('glob')

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
  jest.spyOn(console, 'log')

  it('should call console.log function if output is console', () => {
    const logger = createLogger({
      output: 'console'
    })

    logger('testing logger console output')

    expect(console.log).toBeCalled()
  })
})

describe('Testing write stream function to output logs to a file', () => {
  const writeStreamStub = jest.fn()
  const onceStreamEventStub = jest.fn()
  const endStreamStub = jest.fn()
  const onStreamStub = jest.fn()

  const isFileStub = jest.fn()

  fs.createWriteStream.mockReturnValue({
    write: writeStreamStub,
    once: onceStreamEventStub,
    end: endStreamStub,
    on: onStreamStub
  })

  fs.lstatSync.mockReturnValue({
    isFile: isFileStub
  })

  it('logging with file output should create the log folder if it does not exists', () => {
    fs.existsSync.mockReturnValueOnce(false)
    fs.existsSync.mockReturnValueOnce(false)
    fs.existsSync.mockReturnValueOnce(true)

    createLogger({
      output: 'file',
      dir: path.join(__dirname, 'log')
    })

    expect(fs.mkdirSync).toBeCalled()
  })

  it('logging with file output but with non-existent folder and parent folder should throw an error', () => {
    fs.existsSync.mockReturnValueOnce(false)
    fs.existsSync.mockReturnValueOnce(false)
    fs.existsSync.mockReturnValueOnce(false)

    expect(() => createLogger({
      output: 'file',
      dir: path.join(__dirname, 'parent', 'log')
    })).toThrow(/no such directory or parent directory/)
  })

  it('logging with file output and with dir specified as existing file should throw an error', () => {
    fs.existsSync.mockReturnValueOnce(true)
    isFileStub.mockReturnValueOnce(true)

    expect(() => createLogger({
      output: 'file',
      dir: path.join(__dirname, 'README.md')
    })).toThrow(/is a file/)
  })

  it('logging to file should create the autorotate folder if it does not exist', () => {
    const logger = createLogger({
      output: 'file'
    })

    fs.existsSync.mockReturnValueOnce(false)
    glob.sync.mockReturnValueOnce(Array(1).fill(''))
    fs.mkdirSync.mockClear()

    logger('testing logger')

    expect(fs.mkdirSync.mock.calls.length).toBe(1)
  })

  it('logging to file with autorotate disabled should not create the autorotate folder', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none'
    })

    fs.existsSync.mockReturnValueOnce(true)
    glob.sync.mockReturnValueOnce(Array(1).fill(''))
    fs.mkdirSync.mockClear()

    logger('testing logger')

    expect(fs.mkdirSync).not.toBeCalled()
  })

  it('logging to file with the file not existing should log to file with suffix `_1.log`', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none'
    })

    fs.existsSync.mockReturnValueOnce(true)
    glob.sync.mockReturnValueOnce([])
    fs.createWriteStream.mockClear()

    logger('testing logger')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_1.log)$/)
  })

  it('logging to file with a size limit in `K` unit and the previous file having reached the limit should call log to another file with an incremented number', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '10K'
    })

    fs.existsSync.mockReturnValueOnce(true)
    fs.existsSync.mockReturnValueOnce(true)
    fs.statSync.mockReturnValueOnce({ size: 10 * 1024 })
    glob.sync.mockReturnValueOnce(Array(5).fill(''))
    fs.createWriteStream.mockClear()

    logger('testing logger')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_6.log)$/)
  })

  it('logging to file with a size limit in `M` unit and the previous file having reached the limit should call log to another file with an incremented number', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '5M'
    })

    fs.existsSync.mockReturnValueOnce(true)
    fs.existsSync.mockReturnValueOnce(true)
    fs.statSync.mockReturnValueOnce({ size: 5 * 1024 * 1024 })
    glob.sync.mockReturnValueOnce(Array(3).fill(''))
    fs.createWriteStream.mockClear()

    logger('testing logger')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_4.log)$/)
  })

  it('logging to file with a size limit in `G` unit and the previous file having reached the limit should call log to another file with an incremented number', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '1G'
    })

    fs.existsSync.mockReturnValueOnce(true)
    fs.existsSync.mockReturnValueOnce(true)
    fs.statSync.mockReturnValueOnce({ size: 1024 ** 3 })
    glob.sync.mockReturnValueOnce(Array(1).fill(''))
    fs.createWriteStream.mockClear()

    logger('testing logger')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_2.log)$/)
  })

  it('logging to a file with size limit specified in `G` unit should write to the same file when its size is below the limit', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '1G'
    })

    fs.existsSync.mockReturnValueOnce(true)
    fs.existsSync.mockReturnValueOnce(true)
    fs.statSync.mockReturnValueOnce({ size: 0.87 * 1024 * 1024 * 1024 })
    glob.sync.mockReturnValueOnce(Array(1).fill(''))
    fs.createWriteStream.mockClear()

    logger('testing logger')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_1.log)$/)
  })

  it('logging to a file with size limit specified in `M` unit should write to the same file when its size is below the limit', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '7M'
    })

    fs.existsSync.mockReturnValueOnce(true)
    fs.existsSync.mockReturnValueOnce(true)
    fs.statSync.mockReturnValueOnce({ size: 6.4 * 1024 * 1024 })
    glob.sync.mockReturnValueOnce(Array(8).fill(''))
    fs.createWriteStream.mockClear()

    logger('testing logger')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_8.log)$/)
  })

  it('logging to a file with size limit specified in `K` unit should write to the same file when its size is below the limit', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none',
      dirDateFormat: 'DD-MMMM-YYYY',
      dateFormat: 'DD-MMMM-YYYYTHH',
      size: '200K'
    })

    fs.existsSync.mockReturnValueOnce(true)
    fs.existsSync.mockReturnValueOnce(true)
    fs.statSync.mockReturnValueOnce({ size: 150 * 1024 })
    glob.sync.mockReturnValueOnce(Array(50).fill(''))
    fs.createWriteStream.mockClear()

    logger('testing logger')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_50.log)$/)
  })

  it('logging to file with level passed should write to the file with the level as part of the filename suffix in lowercase', () => {
    const logger = createLogger({
      output: 'file',
      autorotate: 'none'
    })

    fs.existsSync.mockReturnValueOnce(true)
    glob.sync.mockReturnValueOnce([])
    fs.createWriteStream.mockClear()

    logger('testing logger', 'Warn')

    expect(fs.createWriteStream.mock.calls[0][0]).toMatch(/(_warn_1.log)$/)
  })
})
