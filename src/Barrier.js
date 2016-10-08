'use strict'

/**
 * Dependencies
 * @ignore
 */
const cwd = process.cwd()
const path = require('path')
const {JSONDocument} = require('json-document')
const Store = require('jacl-store')
const AuthEngine = require('jacl-auth-engine')
// const {RelyingParty} = require('oidc-rp')

/**
 * Module Dependencies
 * @ignore
 */
const Logger = require('./Logger')
const Config = require('./Config')

/**
 * Constants
 * @ignore
 */
const LOG_NAME = 'barrier'
const log = Logger.getLogger(LOG_NAME)

/**
 * Barrier
 *
 * @class
 * 
 */
class Barrier {

  /**
   * Constructor
   * 
   * @param  {string|object|Config} descriptor - a config instance, descriptor
   * object or path to a file containing a config descriptor object.
   */
  constructor (descriptor) {
    if (typeof descriptor === 'string') {
      try {
        let config = require(path.join(cwd, descriptor))
        log.debug({path: descriptor}, 'importing config')
        this.config = new Config(config)
      } catch (e) {
        log.error(e)
        process.exit(1)
      }
    } else if (descriptor instanceof Config) {
      this.config = descriptor
    } else {
      this.config = new Config(descriptor)
    }
    log.debug({config: this.config}, 'Barrier configured')

    this.store = new Store(this.config.stores)
    log.debug({store: this.store}, 'Stores built')

    this.engine = new AuthEngine(this.store.get('/rules'))
    log.debug({rules: this.engine.rule()}, 'Engine built')
  }

  /**
   * Enforce
   *
   * @description 
   * Start an access request based on a identifier of some sort
   * 
   * @param  {object} identifier - working on it...
   * @return {boolean} 
   */
  enforce (identifier) {
    let decision = false
    let {access: ruleName} = this.config
    log.debug({rule: ruleName}, 'Starting access control')

    let requiredAttributes = this.engine.attributesList(ruleName)
    log.debug({attributes: requiredAttributes}, 'needed attributes')

    let fetched = this.store.get(requiredAttributes)
    log.debug({fetched}, 'fetched attributes')

    decision = this.engine.enforce(ruleName, fetched.subject, fetched.object, fetched.environment)
    log.info({decision, identifier}, 'Access control decision')
    return decision
  }

}

/**
 * Exports
 */
module.exports = Barrier
