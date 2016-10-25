'use strict'

/**
 * Test dependencies
 */
const fs = require('fs')
const cwd = process.cwd()
const path = require('path')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const _ = require('lodash')
const {JSONSchema} = require('json-document')

/**
 * Assertions
 */
chai.should()
let expect = chai.expect
chai.use(sinonChai)

/**
 * Code under test
 */
const Logger = require('../src/Logger')
const Config = require('../src/Config')
const ConfigSchema = require('../src/ConfigSchema')

/**
 * Constants
 */
const LOG_NAME = 'config'
const log = Logger.getLogger(LOG_NAME)

/**
 *
 */
describe('Config', () => {
  const INVALID_PATH = './invalid_path/my_config.json'
  const INVALID_ABS_PATH = '/invalid_path/my_config.json'
  const VALID_PATH = './my_config.json'
  const VALID_ABS_PATH = '/my_config.json'

  beforeEach(() => {
    sinon.stub(log, 'info')
    sinon.stub(log, 'error')
  })

  afterEach(() => {
    log.info.restore()
    log.error.restore()
  })

  describe('schema', () => {
    it('should be an instance of JSONSchema', () => {
      Config.schema.should.be.an.instanceof(JSONSchema)
    })

    it('should return ConfigSchema', () => {
      Config.schema.should.equal(ConfigSchema)
    })
  })

  describe('serialize', () => {

    describe('with a relative path', () => {
      describe('that is valid', () => {
        let config, result
        
        beforeEach(() => {
          sinon.stub(fs, 'writeFileSync')

          config = new Config({
            access: 'rule',
            provider: {
              issuer: 'https://some.other.provider.com',
              redirect_uris: ['https://mydomain.com/callback'],
              client_id: 'abc',
              client_secret: '123'
            }
          })

          result = config.serialize(VALID_PATH)
        })

        afterEach(() => {
          fs.writeFileSync.restore()
        })

        it('should log to info', () => {
          log.info.should.be.calledTwice
        })

        it('should not log to error', () => {
          log.error.should.not.be.called
        })

        it('should return true', () => {
          result.should.be.true
        })

        it('should call writeFileSync', () => {
          fs.writeFileSync.should.have.been.called
        })
      })

      describe('that is invalid', () => {
        let config, result
        
        beforeEach(() => {
          sinon.stub(fs, 'writeFileSync').throws()

          config = new Config({
            access: 'rule',
            provider: {
              issuer: 'https://some.other.provider.com',
              redirect_uris: ['https://mydomain.com/callback'],
              client_id: 'abc',
              client_secret: '123'
            }
          })

          result = config.serialize(INVALID_PATH)
        })

        afterEach(() => {
          fs.writeFileSync.restore()
        })


        it('should log to error', () => {
          log.error.should.be.calledOnce
        })

        it('should not log to info', () => {
          log.info.should.be.calledOnce
        })

        it('should return false', () => {
          result.should.be.false
        })

        it('should call writeFileSync', () => {
          fs.writeFileSync.should.have.been.called
        })

        it('writeFileSync should throw', () => {
          fs.writeFileSync.should.have.thrown
        })
      })
    })

    describe('with a absolute path', () => {      
      describe('that is valid', () => {
        let config, result
        
        beforeEach(() => {
          sinon.stub(fs, 'writeFileSync')

          config = new Config({
            access: 'rule',
            provider: {
              issuer: 'https://some.other.provider.com',
              redirect_uris: ['https://mydomain.com/callback'],
              client_id: 'abc',
              client_secret: '123'
            }
          })

          result = config.serialize(VALID_ABS_PATH)
        })

        afterEach(() => {
          fs.writeFileSync.restore()
        })

        it('should log to info', () => {
          log.info.should.be.calledTwice
        })

        it('should not log to error', () => {
          log.error.should.not.be.called
        })

        it('should return true', () => {
          result.should.be.true
        })

        it('should call writeFileSync', () => {
          fs.writeFileSync.should.have.been.called
        })
      })

      describe('that is invalid', () => {
        let config, result
        
        beforeEach(() => {
          sinon.stub(fs, 'writeFileSync').throws()

          config = new Config({
            access: 'rule',
            provider: {
              issuer: 'https://some.other.provider.com',
              redirect_uris: ['https://mydomain.com/callback'],
              client_id: 'abc',
              client_secret: '123'
            }
          })

          result = config.serialize(INVALID_ABS_PATH)
        })

        afterEach(() => {
          fs.writeFileSync.restore()
        })

        it('should log to error', () => {
          log.error.should.be.calledOnce
        })

        it('should not log to info', () => {
          log.info.should.be.calledOnce
        })

        it('should return false', () => {
          result.should.be.false
        })

        it('should call writeFileSync', () => {
          fs.writeFileSync.should.have.been.called
        })

        it('writeFileSync should throw', () => {
          fs.writeFileSync.should.have.thrown
        })
      })
    })
  })

  describe('static deserialize', () => {
    const INVALID_PATH = './invalid_path/my_log_file.log'
    const INVALID_ABS_PATH = '/invalid_path/my_log_file.log'
    const VALID_PATH = './my_log_file.log'
    const VALID_ABS_PATH = '/my_log_file.log'
    const VALID_CONFIG = {
      access: 'rule',
      provider: {
        issuer: 'https://some.other.provider.com',
        redirect_uris: ['https://mydomain.com/callback'],
        client_id: 'abc',
        client_secret: '123'
      }
    }

    describe('with a relative path', () => {
      describe('that is valid', () => {
        let config
        
        beforeEach(() => {
          sinon.stub(fs, 'readFileSync').returns(JSON.stringify(VALID_CONFIG))
          config = Config.deserialize(VALID_PATH)
        })

        afterEach(() => {
          fs.readFileSync.restore()
        })

        it('should return a Config object', () => {
          config.should.be.an.instanceof(Config)
        })

        it('should log to info', () => {
          log.info.should.be.calledTwice
        })

        it('should not log to error', () => {
          log.error.should.not.be.called
        })

        it('should call readFileSync', () => {
          fs.readFileSync.should.be.called
        })
      })

      describe('that is invalid', () => {
        let config
        
        beforeEach(() => {
          sinon.stub(fs, 'readFileSync').throws()
          config = Config.deserialize(INVALID_PATH)
        })

        afterEach(() => {
          fs.readFileSync.restore()
        })

        it('should not log to info', () => {
          log.info.should.be.calledOnce
        })

        it('should log to error', () => {
          log.error.should.be.calledOnce
        })

        it('should return null', () => {
          expect(config).to.be.null
        })

        it('should call readFileSync', () => {
          fs.readFileSync.should.be.called
        })

        it('readFileSync should throw', () => {
          fs.readFileSync.should.throw
        })
      })
    })

    describe('with an absolute path', () => {
      describe('that is valid', () => {
        let config
        
        beforeEach(() => {
          sinon.stub(fs, 'readFileSync').returns(JSON.stringify(VALID_CONFIG))
          config = Config.deserialize(VALID_ABS_PATH)
        })

        afterEach(() => {
          fs.readFileSync.restore()
        })

        it('should return a Config object', () => {
          config.should.be.an.instanceof(Config)
        })

        it('should log to info', () => {
          log.info.should.be.calledTwice
        })

        it('should not log to error', () => {
          log.error.should.not.be.called
        })

        it('should call readFileSync', () => {
          fs.readFileSync.should.be.called
        })
      })

      describe('that is invalid', () => {
        let config
        
        beforeEach(() => {
          sinon.stub(fs, 'readFileSync').throws()
          config = Config.deserialize(INVALID_ABS_PATH)
        })

        afterEach(() => {
          fs.readFileSync.restore()
        })

        it('should not log to info', () => {
          log.info.should.be.calledOnce
        })

        it('should log to error', () => {
          log.error.should.be.calledOnce
        })

        it('should return null', () => {
          expect(config).to.be.null
        })

        it('should call readFileSync', () => {
          fs.readFileSync.should.be.called
        })

        it('readFileSync should throw', () => {
          fs.readFileSync.should.throw
        })
      })
    })
  })
})