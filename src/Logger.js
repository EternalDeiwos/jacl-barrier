'use strict'

/**
 * Dependencies
 * @ignore
 */
const cwd = process.cwd()
const path = require('path')
const fs = require('fs')
const bunyan = require('bunyan')

/**
 * Constants
 * @ignore
 */
const LOG_DIR = path.join(cwd, 'logs')

/**
 * Globals
 * @ignore
 */
let log, loggers = {}

/**
 * Logger
 *
 * @class
 * Handles the creation, caching and namespacing of bunyan loggers
 */
class Logger {

  /**
   * Initialize
   * @ignore
   */
  static init () {
    Logger.initDir(LOG_DIR)
    loggers.main = bunyan.createLogger(Logger.defaultLogger('main'))
    loggers.bunyan = bunyan.createLogger(Logger.defaultLogger('bunyan'))
    log = loggers.bunyan
    log.addSerializers(Logger.loggersSerializer())
  }

  static loggersSerializer () {
    return {
      loggers: logger_container => {
        let ret = {}
        Object.keys(logger_container).forEach(key => {
          ret[key] = logger_container[key].level()
        })
        return ret
      }
    }
  }

  /**
   * Initialize Logging Directory
   * @ignore
   */
  static initDir (dir) {
    let stats, err, mkdir = () => {
      fs.mkdirSync(dir, 0o755)
    }

    try {
      stats = fs.statSync(dir)
    } catch (e) { 
      return mkdir()
    }

    if (!(stats && stats.isDirectory())) {
      return mkdir()
    }
  }

  /**
   * Default Log Level Helper
   * @ignore
   */
  static defaultLogLevel () {
    return process.env.ENV && process.env.ENV.toLowerCase() === 'production'
      ? bunyan.INFO
      : bunyan.DEBUG
  }

  /**
   * Default Logger Helper
   * @ignore
   */
  static defaultLogger (name) {
    let level = Logger.defaultLogLevel()
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

  /**
   * Get Logger
   *
   * @description 
   * Get or create a logger from a description
   * 
   * @param  {string|object} opts - a description of a logger
   * @return {Logger}
   */
  static getLogger(opts) {
    if (opts === undefined) {
      // get default logger
      log.trace('returning default logger')
      return loggers.main
    } else if (typeof opts === 'string') {
      return Logger.getLoggerByString(opts)
    } else if (typeof opts === 'object') {
      return Logger.getLoggerByDescriptor(opts)
    }

    log.error({opts}, new Error('Invalid logger requested'))
  }

  static getLoggerByString (opts) {
    if (opts.indexOf(':') > -1) {
      return Logger.createNamespacedLogger(opts)
    } else {
      return Logger.getOrCreateLogger(opts)
    }
  }

  static createNamespacedLogger (opts) {
    // get logger based on namespacing
    log.trace({name: opts, namespace: opts.split(':')}, 'creating namespaced logger')
    let ref = []
    let current = null
    let hierarchy = opts.split(':')
    hierarchy.forEach(scope => {
      ref.push(scope)
      let namespace = ref.join(':')
      current = Logger.getOrCreateLogger(namespace)
    })
    return loggers[opts]
  }

  static getOrCreateLogger (name) {
    if (loggers[name]) {
      log.trace({name}, 'logger exists, returning')
      return loggers[name]
    } else {
      log.trace({name}, 'creating logger')
      let logger = bunyan.createLogger(Logger.defaultLogger(name))
      loggers[name] = logger
      return logger
    }
  }

  static getLoggerByDescriptor (opts) {
    log.warn('creating custom logger, custom loggers are not cached')
    let {stream, streams, name, level} = opts

    if (!level) {
      level = Logger.defaultLogLevel()
    }

    if (name) {
      let descriptor = {
        name,
        level,
        streams: [
          {
            level,
            stream: process.stdout
          },
          {
            level,
            path: path.join(LOG_DIR, `${name}.log`),
          }
        ]
      }
      
      if (stream && stream != process.stdout) {
        descriptor.streams.push({
          level,
          stream
        })
      }

      if (streams && Array.isArray(streams)) {
        streams.forEach(s => {
          if (s && s.stream != process.stdout) {
            descriptor.streams.push({
              level,
              stream
            })
          }
        })
      }

      return bunyan.createLogger(descriptor)
    }

    log.error({opts}, new Error('Log name required'))
    return null
  }

}

/**
 * Exports
 * @ignore
 */
Logger.init()
module.exports = Logger