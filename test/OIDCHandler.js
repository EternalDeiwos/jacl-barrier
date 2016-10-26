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
const Logger = require('../src/Logger')

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
const LOG_NAME = 'oidc'
const log = Logger.getLogger(LOG_NAME)

/**
 * Code under test
 */
const OIDCHandler = require('../src/OIDCHandler')

/**
 *
 */
describe.only('OIDCHandler', () => {
  let barrier

  beforeEach(() => {
    sinon.stub(log, 'debug')
    sinon.stub(log, 'info')
    sinon.stub(log, 'error')
    sinon.stub(log, 'warn')
  })

  afterEach(() => {
    log.debug.restore()
    log.info.restore()
    log.error.restore()
    log.warn.restore()
  })

  describe('static handle', () => {
    before(() => {
      sinon.stub(OIDCHandler.prototype, 'discover')
      sinon.stub(OIDCHandler.prototype, 'getJSONResponse')
      sinon.stub(OIDCHandler.prototype, 'handleDiscoveryResponse')
      sinon.stub(OIDCHandler.prototype, 'handleJWKSetResponse')
      sinon.stub(OIDCHandler.prototype, 'signin')
      sinon.stub(OIDCHandler.prototype, 'handleSignInResponse')
      sinon.stub(OIDCHandler.prototype, 'authenticate')
      sinon.stub(OIDCHandler.prototype, 'handleAuthenticationResponse')
      sinon.stub(OIDCHandler.prototype, 'getJWT')
      sinon.stub(OIDCHandler.prototype, 'handleJWTResponse')
      sinon.stub(OIDCHandler.prototype, 'userinfo')
      sinon.stub(OIDCHandler.prototype, 'verifyAttributes')
      sinon.stub(OIDCHandler.prototype, 'persistCookies')
      OIDCHandler.handle()
    })

    after(() => {
      OIDCHandler.prototype.discover.restore()
      OIDCHandler.prototype.getJSONResponse.restore()
      OIDCHandler.prototype.handleDiscoveryResponse.restore()
      OIDCHandler.prototype.handleJWKSetResponse.restore()
      OIDCHandler.prototype.signin.restore()
      OIDCHandler.prototype.handleSignInResponse.restore()
      OIDCHandler.prototype.authenticate.restore()
      OIDCHandler.prototype.handleAuthenticationResponse.restore()
      OIDCHandler.prototype.getJWT.restore()
      OIDCHandler.prototype.handleJWTResponse.restore()
      OIDCHandler.prototype.userinfo.restore()
      OIDCHandler.prototype.verifyAttributes.restore()
      OIDCHandler.prototype.persistCookies.restore()
    })

    it('should call discover', () => {
      OIDCHandler.prototype.discover.should.be.called
    })

    it('should call getJSONResponse x4', () => {
      OIDCHandler.prototype.getJSONResponse.should.have.callCount(4)
    })

    it('should call handleDiscoveryResponse', () => {
      OIDCHandler.prototype.handleDiscoveryResponse.should.be.called
    })

    it('should call handleJWKSetResponse', () => {
      OIDCHandler.prototype.handleJWKSetResponse.should.be.called
    })

    it('should call signin', () => {
      OIDCHandler.prototype.signin.should.be.called
    })

    it('should call handleSignInResponse', () => {
      OIDCHandler.prototype.handleSignInResponse.should.be.called
    })

    it('should call authenticate', () => {
      OIDCHandler.prototype.authenticate.should.be.called
    })

    it('should call handleAuthenticationResponse', () => {
      OIDCHandler.prototype.handleAuthenticationResponse.should.be.called
    })

    it('should call getJWT', () => {
      OIDCHandler.prototype.getJWT.should.be.called
    })

    it('should call handleJWTResponse', () => {
      OIDCHandler.prototype.handleJWTResponse.should.be.called
    })

    it('should call userinfo', () => {
      OIDCHandler.prototype.userinfo.should.be.called
    })

    it('should call verifyAttributes', () => {
      OIDCHandler.prototype.verifyAttributes.should.be.called
    })

    it('should call persistCookies', () => {
      OIDCHandler.prototype.persistCookies.should.be.called
    })

    it('should return a Promise', () => {
      OIDCHandler.handle().should.be.a.instanceof(Promise)
    })

    it.skip('should log to debug', () => {
      log.debug.should.be.called
    })
  })

  describe('discover', () => {
    it('should return a Promise')
  })


})