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
const {JWT} = require('jose')

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
describe('OIDCHandler', () => {
  let barrier, SubtleCrypto = require('webcrypto/src/SubtleCrypto')
  const identifier = 42
  const subjectAttributes = ['/some/val']
  const providerConfig = require('./config/dev.json').provider
  const jwks = {
    keys: [
      { use: 'sig' }
    ]
  }
  const textRet = 'hello'
  const jsonRet = { a: 1 }
  const fetchRet = { json: () => jsonRet, text: () => textRet }

  beforeEach(() => {
    sinon.stub(SubtleCrypto.prototype, 'importKey')
    sinon.stub(OIDCHandler, 'fetch').returns(fetchRet)
    sinon.stub(log, 'debug')
    sinon.stub(log, 'info')
    sinon.stub(log, 'error')
    sinon.stub(log, 'warn')
  })

  afterEach(() => {
    SubtleCrypto.prototype.importKey.restore()
    OIDCHandler.fetch.restore()
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

  describe('static handle where an inner method rejects', () => {
    before(() => {
      sinon.stub(OIDCHandler.prototype, 'discover')
      sinon.stub(OIDCHandler.prototype, 'getJSONResponse')
      sinon.stub(OIDCHandler.prototype, 'handleDiscoveryResponse')
      sinon.stub(OIDCHandler.prototype, 'handleJWKSetResponse')
      sinon.stub(OIDCHandler.prototype, 'signin')
      sinon.stub(OIDCHandler.prototype, 'handleSignInResponse')
      sinon.stub(OIDCHandler.prototype, 'authenticate')
      sinon.stub(OIDCHandler.prototype, 'handleAuthenticationResponse')
      sinon.stub(OIDCHandler.prototype, 'getJWT').returns(Promise.reject(new Error()))
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
      OIDCHandler.prototype.getJSONResponse.should.have.callCount(2)
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

    it('should not call handleJWTResponse', () => {
      OIDCHandler.prototype.handleJWTResponse.should.not.be.called
    })

    it('should not call userinfo', () => {
      OIDCHandler.prototype.userinfo.should.be.not.called
    })

    it('should not call verifyAttributes', () => {
      OIDCHandler.prototype.verifyAttributes.should.not.be.called
    })

    it('should not call persistCookies', () => {
      OIDCHandler.prototype.persistCookies.should.not.be.called
    })

    it('should return a Promise', () => {
      OIDCHandler.handle().should.be.a.instanceof(Promise)
    })

    it.skip('should log to debug', () => {
      log.debug.should.be.called
    })

    it.skip('should log to error', () => {
      log.error.should.be.called
    })
  })

  describe('method', () => {
    let oidc
    beforeEach(() => {
      oidc = new OIDCHandler(null, identifier, subjectAttributes, providerConfig)
    })

    describe('discover', () => {
      it('should return a Promise')
      it('should fetch ${issuer}/.well-known/openid-configuration')
      it('should log to debug')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain a fetch response')
      it('should reject if the fetch fails')
    })

    describe('getJSONResponse', () => {
      it('should return a Promise')
      it('should log to trace')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain an object')
    })

    describe('handleDiscoveryResponse', () => {
      it('should log to debug')
      it('should fetch jwks')
      it('should return a Promise')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain a fetch response')
      it('should reject if the fetch fails')
    })

    describe('handleJWKSetResponse', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should to a handler reference')
      it('should reject jwks is empty')
    })

    describe('signin', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should fetch signin')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain a fetch response')
      it('should reject if the fetch fails')
    })

    describe('handleDiscoveryResponse', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should to a handler reference')
    })

    describe('authenticate', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should fetch authenticate')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain a fetch response')
      it('should reject if the fetch fails')
    })

    describe('handleAuthenticationResponse', () => {
      it('should log to debug')
      it('should log to info')
      it('should return a Promise')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain the authorization code')
      it('should reject if authorization code not present')
    })

    describe('getJWT', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should fetch access token jwt')
      it('should fetch using POST')
      it('should fetch with authorization header')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain a fetch response')
      it('should reject if the fetch fails')
    })

    describe('handleJWTResponse', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should fetch decode access token jwt')
      it('should call verify on JWT')
      it('should resolve to an array')
      it('result should contain a handler reference')
      
      describe('result should contain an access token', () => {
        it('that is verified')
        it('that is decoded')
      })

      it('should reject if the fetch fails')
    })

    describe.skip('verifyJWT', () => {

    })

    describe('userinfo', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should fetch userinfo jwt')
      it('should fetch with authorization header')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain a fetch response')
      it('should reject if the fetch fails')
    })

    describe('verifyAttributes', () => {
      it('should log to debug')
      it('should return a Promise')
      it('should assign userinfo to the handler')
      it('should resolve to an array')
      it('result should contain a handler reference')
      it('result should contain userinfo')
      it('result should contain relevenat subject attributes object')
      it('should reject if missing any required attributes')
    })

    describe('persistCookies', () => {
      it('should log to info')
      it('should return a Promise')
      it('should evaluate to the same as what was passed in')
    })

  })
})