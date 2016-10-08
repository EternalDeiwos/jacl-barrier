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
 * Helpers
 * @ignore
 */
const defaultLogLevel = () => {
  return process.env.ENV && process.env.ENV.toLowerCase() === 'production'
    ? bunyan.INFO
    : bunyan.DEBUG
}

const defaultLogger = name => {
  let level = defaultLogLevel()
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
 * Logging directory sanity check
 *
 * Make a logs directory with the permissions of 755 if it doesn't exist.
 */
let stats = fs.statSync(LOG_DIR)
if (!(stats && stats.isDirectory())) {
  fs.mkdirSync(LOG_DIR, 0o755)
}

/**
 * Globals
 * @ignore
 */
let loggers = {}

/**
 * Logger
 *
 * @class
 * Handles the creation, caching and namespacing of bunyan loggers
 */
class Logger {

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
    if (!opts) {
      // get default logger
      log.trace('returning default logger')
      return loggers.main
    
    } else if (typeof opts === 'string') {
      // get logger based on namespacing
      if (loggers[opts]) {
        log.trace('logger exists, returning')
        return loggers[opts]
      } else if (opts.indexOf(':') > -1) {
        log.trace({query: opts}, 'creating namespaced logger')
        let ref = []
        let current = null
        let hierarchy = opts.split(':')
        hierarchy.forEach(scope => {
          ref.push(scope)
          let namespace = ref.join(':')
          if (loggers[namespace]) {
            current = loggers[namespace]
          } else {
            loggers[namespace] = bunyan.createLogger(defaultLogger(namespace))
          }

        })
        return loggers[opts]

      } else {
        log.trace({query: opts}, 'creating logger')
        let logger = bunyan.createLogger(defaultLogger(opts))
        loggers[opts] = logger
        return logger
      }
    
    } else if (typeof opts === 'object') {
      // get new logger based on a descriptor object passed in
      log.trace('creating customised logger')
      if (opts.name) {
        let level, stream = null
        if (opts.level) {
          level = opts.level
          delete opts.level
        } else {
          level = defaultLogLevel()
        }

        if (opts.stream) {
          if (opts.stream != process.stdout) {
            stream = opts.stream
          }
          delete opts.stream
        }

        let standardStreams = [
          {
            level,
            stream: process.stdout
          },
          {
            level,
            path: path.join(LOG_DIR, `${opts.name}.log`),
          }
        ]

        if (stream) {
          standardStreams.push({
            level,
            stream
          })
        }

        opts.streams = standardStreams
        return bunyan.createLogger(opts)
      }
    }

    log.error(new Error('Invalid logger'))
  }

}

/**
 * Default loggers
 * @ignore
 */
loggers.main = bunyan.createLogger(defaultLogger('main'))
loggers.bunyan = bunyan.createLogger(defaultLogger('bunyan'))
let log = loggers.bunyan
log.addSerializers({ 
  loggers: logger => {
    let ret = {}
    Object.keys(logger).forEach(key => {
      ret[key] = logger[key].level()
    })
    return ret
  }
})

/**
 * Exports
 * @ignore
 */
module.exports = Logger