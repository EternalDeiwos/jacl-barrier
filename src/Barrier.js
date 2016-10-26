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
const fetch = require('node-fetch')
const OIDC = require('./OIDCHandler')

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
    if (!descriptor) {
      throw new Error('Barrier config required')
    }

    if (typeof descriptor === 'string') {
      try {
        log.debug({path: descriptor}, 'importing config')
        let config = require(path.join(cwd, descriptor))
        this.config = new Config(config)
      } catch (e) {
        log.error(e)
        throw e
      }
    } else if (descriptor instanceof Config) {
      this.config = descriptor
    } else {
      this.config = new Config(descriptor)
    }
    log.debug('Barrier configured')

    this.store = new Store(this.config.stores)
    log.debug('Stores built')

    this.engine = new AuthEngine(this.store.get('/rules'))
    log.debug('Engine built')
  }

  makeDecision (attributes, identifier) {
    let {access: rule} = this.config
    let decision = this.engine.enforce(rule, attributes.subject, attributes.object, attributes.environment)
    log.info({decision, identifier}, 'Access control decision')
    return decision
  }

  authenticate (identifier, subjectAttributes) {
    // log.debug({options: this.config.provider}, 'provider config')
    return OIDC.handle(this, identifier, subjectAttributes, this.config.provider)
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
    let {engine, config, store} = this
    let {access: ruleName} = config
    log.debug({rule: ruleName}, 'Starting access control')

    let subjectAttributes = engine.attributesList(ruleName, 'subject')
    let requiredAttributes = subjectAttributes
      .concat(engine.attributesList(ruleName, 'object'))
      .concat(engine.attributesList(ruleName, 'environment'))
    
    log.debug({attributes: requiredAttributes}, 'needed attributes')

    let fetched = store.get(requiredAttributes)
    log.debug('fetched store attributes')

    let store_subject = fetched.subject
    return this.authenticate(identifier, subjectAttributes)
      .then(args => {
        let [_, __, subjectData] = args
        fetched = Object.assign(fetched, subjectData || store_subject || {})
        return Promise.resolve(this.makeDecision(fetched, identifier))
      })
      

  }

}

/**
 * Exports
 */
module.exports = Barrier
