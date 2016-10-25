'use strict'

/**
 * Test dependencies
 */
const cwd = process.cwd()
const fs = require('fs')
const path = require('path')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const _ = require('lodash')
const bunyan = require('bunyan')

/**
 * Assertions
 */
chai.use(sinonChai)
chai.should()
let expect = chai.expect

/**
 * Constants
 */
const LOG_DIR = path.join(cwd, 'logs')

/**
 * Code under test
 */
const Logger = require('../src/Logger')

/**
 * Logger
 */
describe('Logger', () => {
  const log = Logger.getLogger('bunyan')
  
  beforeEach(() => {
    sinon.stub(log, 'trace')
    sinon.stub(log, 'error')
    sinon.stub(log, 'warn')
  })

  afterEach(() => {
    log.trace.restore()
    log.error.restore()
    log.warn.restore()
  })

  describe('init', () => {
    beforeEach(() => {
      sinon.stub(Logger, 'initDir')
    })

    afterEach(() => {
      Logger.initDir.restore()
    })

    it('should call initDir', () => {
      Logger.init()
      Logger.initDir.should.be.called
    })
  })

  describe('loggersSerializer', () => {
    const loggers = {
      a: {
        level: () => 30
      },
      b: {
        level: () => 20
      },
      c: {
        level: () => 40
      },
    }

    const expectedResult = { a: 30, b: 20, c: 40 }

    it('should produce the expected result', () => {
      Logger.loggersSerializer().loggers(loggers).should.deep.equal(expectedResult)
    })

    it('should not alter the loggers container', () => {
      let copy = Object.assign({}, loggers)
      Logger.loggersSerializer(loggers)
      loggers.should.deep.equal(copy)
    })

  })

  describe('initDir', () => {
    const dir = 'some-directory'

    let stats    
    beforeEach(() => {
      stats = sinon.stub(fs, 'statSync')
      sinon.stub(fs, 'mkdirSync')
    })

    afterEach(() => {
      fs.statSync.restore()
      fs.mkdirSync.restore()
    })

    it('should create the directory if it doesn\'t exist', () => {
      stats.throws()
      Logger.initDir(dir)

      fs.statSync.should.be.called
      fs.mkdirSync.should.be.calledWith(dir, 0o755)
    })

    it('should create the directory if a file with the same name exists', () => {
      let isDirectory = sinon.stub().returns(false)
      stats.returns({ isDirectory })
      Logger.initDir(dir)

      fs.statSync.should.be.called
      isDirectory.should.be.called
      fs.mkdirSync.should.be.calledWith(dir, 0o755)
    })

    it('shouldn\'t create the directory if it already exists', () => {
      let isDirectory = sinon.stub().returns(true)
      stats.returns({ isDirectory })
      Logger.initDir(dir)

      fs.statSync.should.be.called
      isDirectory.should.be.called
      fs.mkdirSync.should.not.be.called
    })
  })

  describe('defaultLogLevel', () => {
    it('should return INFO if ENV is production', () => {
      let tmp = process.env.ENV || ''
      process.env.ENV = 'production'
      Logger.defaultLogLevel().should.equal(bunyan.INFO)
      process.env.ENV = tmp
      process.env.ENV.should.equal(tmp)
    })

    it('should return DEBUG if ENV is anything else', () => {
      let tmp = process.env.ENV || ''
      process.env.ENV = 'anything'
      Logger.defaultLogLevel().should.equal(bunyan.DEBUG)
      process.env.ENV = tmp
      process.env.ENV.should.equal(tmp)
    })
  })

  describe('defaultLogger', () => {
    const name = 'logger'
    const defaultLogger = (name, level) => {
      return {
        name,
        streams: [
          {
            level,
            path: path.join(LOG_DIR, `${name}.log`)
          },
          {
            level,
            stream: process.stdout
          }
        ]
      }
    }

    let defaultLogLevel
    beforeEach(() => {
      defaultLogLevel = sinon.stub(Logger, 'defaultLogLevel')
    })

    afterEach(() => {
      Logger.defaultLogLevel.restore()
    })

    it('should call defaultLogLevel', () => {
      Logger.defaultLogger(name)
      Logger.defaultLogLevel.should.be.called
    })

    it('should be dynamically named', () => {
      Logger.defaultLogger(name).name.should.equal(name)
    })

    it('should use the default log level', () => {
      let level = bunyan.INFO
      defaultLogLevel.returns(level)
      Logger.defaultLogger(name).streams[0].level.should.equal(level)
    })

    it('should produce the expected output', () => {
      let level = bunyan.ERROR
      defaultLogLevel.returns(level)
      Logger.defaultLogger(name).should.deep.equal(defaultLogger(name, level))
    })
  })

  describe('getLogger', () => {
    const name = 'hello'
    const descriptor = { somekey: 'someval' }

    beforeEach(() => {
      sinon.stub(Logger, 'getLoggerByString')
      sinon.stub(Logger, 'getLoggerByDescriptor')
    })

    afterEach(() => {
      Logger.getLoggerByString.restore()
      Logger.getLoggerByDescriptor.restore()
    })

    it('should call getLoggerByString when passed a string', () => {
      Logger.getLogger(name)
      Logger.getLoggerByString.should.be.calledWith(name)
    })

    it('should call getLoggerByDescriptor when passed an object', () => {
      Logger.getLogger(descriptor)
      Logger.getLoggerByDescriptor.should.be.calledWith(descriptor)
    })

    it('should get the default logger when passed undefined')

    it.skip('should log to trace when passed undefined', () => {
      Logger.getLogger(undefined)
      log.trace.should.be.called
    })

    it.skip('should log to trace when passed nothing', () => {
      Logger.getLogger()
      log.trace.should.be.called
    })

    it('should throw when passed null', () => {
      expect(Logger.getLogger(null)).to.throw
    })
  })

  describe('getLoggerByString', () => {
    const name = 'hello'
    const namespaced = 'hello:world'

    beforeEach(() => {
      sinon.stub(Logger, 'createNamespacedLogger')
      sinon.stub(Logger, 'getOrCreateLogger')
    })

    afterEach(() => {
      Logger.createNamespacedLogger.restore()
      Logger.getOrCreateLogger.restore()
    })

    it('should call createNamespacedLogger if passed a namespaced name', () => {
      Logger.getLoggerByString(namespaced)
      Logger.createNamespacedLogger.should.be.calledWith(namespaced)
    })

    it('should call getOrCreateLogger if passed a non-namespaced name', () => {
      Logger.getLoggerByString(name)
      Logger.getOrCreateLogger.should.be.calledWith(name)
    })
  })

  describe('createNamespacedLogger', () => {
    const namespaced = 'hello:world:other'

    beforeEach(() => {
      sinon.stub(Logger, 'getOrCreateLogger')
      Logger.createNamespacedLogger(namespaced)
    })

    afterEach(() => {
      Logger.getOrCreateLogger.restore()
    })

    it.skip('should log on trace', () => {
      log.trace.should.be.called
    })

    it('should create a logger for each namespace', () => {
      let split = namespaced.split(':')
      Logger.getOrCreateLogger.should.be.calledWith(split[0])
      Logger.getOrCreateLogger.should.be.calledWith([split[0], split[1]].join(':'))
      Logger.getOrCreateLogger.should.be.calledWith(namespaced)
    })

    it('should return the final logger')
  })

  describe('getLoggerByDescriptor', () => {
    const name = 'hello'
    const level = bunyan.DEBUG
    const defaultStreams = [
      {
        level,
        stream: process.stdout
      },
      {
        level,
        path: path.join(LOG_DIR, `${name}.log`),
      }
    ]
    const descriptor1 = { name }
    const descriptor2 = { name, level }
    const descriptor3 = { name, level, stream: process.stderr }
    const descriptor4 = { name, level, streams: [
      { level, stream: 'something' },
      { level, stream: 'something else' }
    ]}

    beforeEach(() => {
      sinon.stub(Logger, 'defaultLogLevel').returns(level)
      sinon.stub(bunyan, 'createLogger')
    })

    afterEach(() => {
      Logger.defaultLogLevel.restore()
      bunyan.createLogger.restore()
    })

    it.skip('should log on warn', () => {
      log.warn.should.be.called
    })

    it('should use defaultLogLevel if level is not supplied', () => {
      Logger.getLoggerByDescriptor(descriptor1)
      Logger.defaultLogLevel.should.be.called
    })

    it.skip('should log to error if name is not supplied', () => {
      log.error.should.be.called
    })

    it('should add two default streams', () => {
      Logger.getLoggerByDescriptor(descriptor1)
      bunyan.createLogger.should.be.called
      bunyan.createLogger.getCall(0).args[0].streams.should.deep.equal(defaultStreams)
    })

    it('should add an additional specified stream', () => {
      Logger.getLoggerByDescriptor(descriptor3)
      bunyan.createLogger.should.be.called
      bunyan.createLogger.getCall(0).args[0].streams.length.should.equal(defaultStreams.length + 1)
    })

    it('should add additional specified streams', () => {
      Logger.getLoggerByDescriptor(descriptor4)
      bunyan.createLogger.should.be.called
      bunyan.createLogger.getCall(0).args[0].streams.length.should.equal(2 + descriptor4.streams.length)
    })

    it('should return a newly created logger', () => {
      Logger.getLoggerByDescriptor(descriptor1)
      bunyan.createLogger.should.be.called
    })
  })
})