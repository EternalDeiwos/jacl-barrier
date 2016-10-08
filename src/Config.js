
/**
 * Dependencies
 * @ignore
 */
const cwd = process.cwd()
const fs = require('fs')
const path = require('path')
const {JSONDocument} = require('json-document')

/**
 * Module Dependencies
 * @ignore
 */
const Logger = require('./Logger')
const configSchema = require('./ConfigSchema')

/**
 * Constants
 * @ignore
 */
const LOG_NAME = 'config'
const CONFIG_DIR = path.join(cwd, 'config')
const log = Logger.getLogger(LOG_NAME)

/**
 * Config
 *
 * @class
 * JSON Document wrapper for Barrier configuration documents
 */
class Config extends JSONDocument {

  /**
   * Schema
   */
  static get schema () {
    return configSchema
  }

  /**
   * Serialize
   *
   * @description
   * Serialize config to file
   * 
   * @param  {string} file
   * @return {boolean} success or failure
   */
  serialize (file) {
    log.info('Serializing config to ' + file)

    try {
      fs.writeFileSync(path.isAbsolute(file)
        ? file
        : path.join(cwd, file), 
        JSON.stringify(this))
      return true
      log.info('Config saved')
    } catch (e) {
      log.error(e)
    }
    return false
  }

  /**
   * Deserialize
   *
   * @description 
   * Import config from file
   * 
   * @param  {string} file
   * @return {Config}
   */
  static deserialize (file) {
    log.info('Deserializing config from ' + file)
    try {
      let data = fs.readFileSync(file)
      log.info('Config loaded')
      return new Config(JSON.parse(data))
    } catch (e) {
      log.error(e)
    }
    return null
  }
  
}

/**
 * Exports
 * @ignore
 */
module.exports = Config