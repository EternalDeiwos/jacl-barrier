'use strict'

/**
 * Test dependencies
 */
const cwd = process.cwd()
const path = require('path')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const _ = require('lodash')
const Store = require('jacl-store')
const AuthEngine = require('jacl-auth-engine')

/**
 * Module
 * @ignore
 */
const Config = require('../src/Config')
const Logger = require('../src/Logger')
const OIDC = require('../src/OIDCHandler')

/**
 * Assertions
 */
chai.use(chaiAsPromised)
chai.use(sinonChai)
chai.should()
let expect = chai.expect


/**
 * Constants
 */
const LOG_NAME = 'barrier'
const log = Logger.getLogger(LOG_NAME)
const STORE_DATA_DIR = './test/store'
const POSITIVE_CONFIG_PATH = './test/config/dev.json'
const NEGATIVE_CONFIG_PATH = './test/config/dev_deny.json'

/**
 * Code under test
 */
const Barrier = require('../src/Barrier')

/**
 *
 */
describe('Barrier', () => {
  let barrier

  beforeEach(() => {
    sinon.spy(log, 'debug')
    sinon.spy(log, 'info')
    sinon.spy(log, 'error')
    sinon.spy(log, 'warn')
  })

  afterEach(() => {
    log.debug.restore()
    log.info.restore()
    log.error.restore()
    log.warn.restore()
  })

  describe.skip('Integration', function () {
    this.timeout(0)

    describe('positive rule', function () {
      before(() => {
        barrier = new Barrier(POSITIVE_CONFIG_PATH)
      })

      it('should allow access', function (done) {
        let promise = barrier.enforce(42)
        promise.should.eventually.be.true.notify(done)
      })
    })

    describe('negative rule', function () {
      before(() => {
        barrier = new Barrier(NEGATIVE_CONFIG_PATH)
      })

      it('should deny access', function (done) {
        let promise = barrier.enforce(42)
        promise.should.eventually.be.false.notify(done)
      })
    })
  })

  describe('log', () => {
    it('should return the logger singleton', () => {
      Logger.getLogger(LOG_NAME).should.equal(log)
    })
  })

  describe('constructor', () => {
    const ret = { a: 1 }
    
    beforeEach(() => {
      barrier = new Barrier(POSITIVE_CONFIG_PATH)
    })

    it('should throw if no descriptor is provided', () => {
      expect(() => new Barrier()).to.throw
    })

    it('should assign a Store', () => {
      barrier.store.should.be.an.instanceof(Store)
    })

    it('should assign an AuthEngine', () => {
      barrier.engine.should.be.an.instanceof(AuthEngine)
    })

    describe('string (config path) parameter', () => {

      it('should log to debug', () => {
        log.debug.should.be.called
      })

      it('should throw if file doesn\'t exist', () => {
        expect(() => new Barrier('invalid_path')).to.throw
      })

      it('should assign it to the barrier instance if successful', () => {
        barrier.config.should.be.an.instanceof(Config)
      })
    })

    describe('Config instance parameter', () => {
      it('should assign it to the barrier instance', () => {
        let descriptor = require(path.join(cwd, POSITIVE_CONFIG_PATH))
        let config = new Config(descriptor)
        let barrier = new Barrier(config)
        barrier.config.should.equal(config)
      })
    })

    describe('Config descriptor object parameter', () => {
      it('should assign it to the barrier instance', () => {
        let descriptor = require(path.join(cwd, POSITIVE_CONFIG_PATH))
        let barrier = new Barrier(descriptor)
        barrier.config.should.contain.all.keys(Object.keys(descriptor))
      })
    })
  })

  describe('makeDecision', () => {
    const attributes = {
      subject: { a: 1 },
      object: { b: 2 },
      environment: { c: 3 }
    }
    const identifier = 42

    let result
    beforeEach(() => {
      barrier = new Barrier(POSITIVE_CONFIG_PATH)
      sinon.stub(barrier.engine, 'enforce').returns(false)
      result = barrier.makeDecision(attributes, 42)
    })

    afterEach(() => {
      barrier.engine.enforce.restore()
    })

    it('should defer to the auth engine', () => {
      barrier.engine.enforce.should.be.calledWith(barrier.config.access, 
        attributes.subject,
        attributes.object,
        attributes.environment)
    })

    it('should log to info', () => {
      log.info.should.be.called
    })

    it('should return a boolean', () => {
      result.should.be.a('boolean')
      result.should.be.false
    })
  })

  describe('authenticate', () => {
    let identifier = 42
    let subjectAttributes = ['/some/attr']

    beforeEach(() => {
      sinon.stub(OIDC, 'handle')
      barrier = new Barrier(POSITIVE_CONFIG_PATH)
      barrier.authenticate(identifier, subjectAttributes)
    })

    afterEach(() => {
      OIDC.handle.restore()
    })

    it('should defer to the OIDC handler', () => {
      OIDC.handle.should.be.called
    })

    it('should pass the barrier and the provider config to the OIDC handler', () => {
      OIDC.handle.should.be.calledWith(barrier, identifier, subjectAttributes, barrier.config.provider)
    })
  })

  describe('enforce', () => {
    let identifier = 42
    let badIdentifier = 'not a number'
    let result
    let authPromise = Promise.resolve([0, 0, { subject: { somekey: 'someval' }}])
    let attributePointers = ['/some/attr']
    beforeEach(() => {
      barrier = new Barrier(POSITIVE_CONFIG_PATH)
      sinon.stub(barrier.engine, 'attributesList').returns(attributePointers)
      sinon.stub(barrier, 'authenticate').returns(authPromise)
      sinon.stub(barrier, 'makeDecision').returns(true)
      result = barrier.enforce(identifier)
    })

    afterEach(() => {
      barrier.authenticate.restore()
      barrier.makeDecision.restore()
      barrier.engine.attributesList.restore()
    })

    it('should log to debug', () => {
      log.debug.should.be.called
    })

    it('should not log to info', () => {
      log.info.should.not.be.called
    })

    it('should log to warn if passed an invalid identifier', () => {
      let result = barrier.enforce(badIdentifier)
      log.warn.should.be.called
    })

    it('should reject if passed an invalid identifier', () => {
      let result = barrier.enforce(badIdentifier)
      result.should.eventually.be.false
    })

    it('should request the attribute list from the auth engine', () => {
      barrier.engine.attributesList.should.be.calledWith(barrier.config.access, 'subject')
      barrier.engine.attributesList.should.be.calledWith(barrier.config.access, 'object')
      barrier.engine.attributesList.should.be.calledWith(barrier.config.access, 'environment')
    })

    it('should call authenticate', () => {
      barrier.authenticate.should.be.called
    })

    it('should return a Promise', () => {
      result.should.be.a.instanceof(Promise)
    })

    it('should resolve to a boolean', () => {
      result.should.eventually.be.true
    })
  })
})  
