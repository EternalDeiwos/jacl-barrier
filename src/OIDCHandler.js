'use strict'

/**
 * Dependencies
 * @ignore
 */
const cwd = process.cwd()
const path = require('path')
const fs = require('fs')
const {JWT, JWK} = require('jose')
const querystring = require('querystring')
const url = require('url')
const {CookieJar} = require('tough-cookie')
const webcrypto = require('webcrypto')
const {JSONPointer} = require('json-document')

/**
 * Module Dependencies
 * @ignore
 */
const Logger = require('./Logger')

/**
 * Constants
 * @ignore
 */
const LOG_NAME = 'oidc'
const ABAC_SCOPES = 'openid profile email rhodes'
const log = Logger.getLogger(LOG_NAME)

/**
 * Load Cookie Jar
 * @ignore
 */
const file = path.join(cwd, 'cookie.jar.json')
let jar
try {
  let fileStats = fs.lstatSync(file)
  if (fileStats.isFile()) {
    log.info('Cookies loaded!')
    jar = CookieJar.fromJSON(require(file))
  } else {
    jar = new CookieJar()
  }
} catch (e) {
  log.warn(e.message)
  jar = new CookieJar()
}

/**
 * Fetch with Cookies!
 * @ignore
 */
const fetch = require('fetch-cookie')(require('node-fetch'), jar)

/**
 * Encode strings to base64
 * @param  {string} input
 * @return {string} base64 representation of the input string
 */
function toBase64(input) {
  return new Buffer(input).toString('base64')
}

/**
 * Save Cookies
 * @ignore
 */
function saveCookies () {
  let serialized = jar.serializeSync()
  // log.debug({jar}, 'Cookies serialized')
  fs.writeFileSync(file, JSON.stringify(serialized))
}

/**
 * OIDCHandler
 *
 * @class
 * 
 */
class OIDCHandler {

  static handle (barrier, identifier, subjectAttributes, options) {
    log.debug({ identifier }, 'Handle OIDC Auth')
    let oidc = new OIDCHandler(barrier, identifier, subjectAttributes, options)

    return Promise
      .resolve(oidc)
      .then(oidc.discover)
      .then(oidc.getJSONResponse)
      .then(oidc.handleDiscoveryResponse)
      .then(oidc.getJSONResponse)
      .then(oidc.handleJWKSetResponse)
      .then(oidc.signin)
      .then(oidc.handleSignInResponse)
      .then(oidc.authenticate)
      .then(oidc.handleAuthenticationResponse)
      .then(oidc.getJWT)
      .then(oidc.getJSONResponse)
      .then(oidc.handleJWTResponse)
      // .then(oidc.verifyJWT)
      .then(oidc.userinfo)
      .then(oidc.getJSONResponse)
      .then(oidc.verifyAttributes)
      .then(oidc.persistCookies)
      .catch(e => {
        log.error(e)
      })
  }

  constructor (barrier, identifier, subjectAttributes, options) {
    this.barrier = barrier
    this.identifier = identifier
    this.subjectAttributes = subjectAttributes || []
    this.options = options || {}
  }

  discover (oidc) {
    let {issuer} = oidc.options
    log.debug('OIDC Discovery for issuer ' + issuer)

    return Promise.all([
      Promise.resolve(oidc),
      fetch(`${issuer}/.well-known/openid-configuration`,
      {
        timeout: 300
      }).catch(e => Promise.reject(e))
    ])
  }

  getJSONResponse (args) {
    let [oidc, res] = args
    log.trace('parse json response')
    return Promise.all([
      Promise.resolve(oidc),
      res.json()
    ])
  }

  handleDiscoveryResponse (args) {
    let [oidc, config] = args

    oidc.options = Object.assign(oidc.options, config)
    log.debug('Handle config response and fetch JWKs from ' + oidc.options.jwks_uri)

    return Promise.all([
      Promise.resolve(oidc),
      fetch(oidc.options.jwks_uri)
    ])
  }

  handleJWKSetResponse (args) {
    let [oidc, jwks] = args

    if (jwks) {
      oidc.jwks = jwks.keys

      log.debug(`Fetched ${jwks && jwks.keys && jwks.keys.length} JWKs`)

      jwks.keys.forEach(key => {
        if (key && key.use === 'sig') {
          oidc.signing_key = webcrypto.subtle.importKey('jwk', key, 'RSASSA-PKCS1-v1_5', true, ['verify'])
        }
      })

      return Promise.resolve(oidc)
    } else {
      return Promise.reject(new Error('Failed to fetch JWKs'))
    }
  }

  signin (oidc) {

    let { identifier, options: { 
      signin, client_id, redirect_uris: [redirect_uri] 
    }} = oidc
    log.debug('Starting session at ' + signin)

    return Promise.all([
      Promise.resolve(oidc),
      fetch(signin + '?' + querystring.stringify({
        response_type: 'code',
        scope: ABAC_SCOPES,
        client_id,
        redirect_uri
      }), {
        headers: {
          'upgrade-insecure-requests': '1'
        }
      })
    ])
  }

  handleSignInResponse (args) {
    let [oidc, res] = args
    let {identifier} = oidc
    let text = res.text()

    log.debug({text}, 'Handle signin response')
    return Promise.resolve(oidc)
  }

  authenticate (oidc) {
    let {identifier, options: { signin }} = oidc
    log.debug({identifier}, 'authenticate at ' + signin + '/callback')

    return Promise.all([
      Promise.resolve(oidc),
      fetch(signin + '/callback?' + querystring.stringify({
        identifier
      }), {
        headers: {
          'upgrade-insecure-requests': '1'
        },
        redirect: 'manual'
      })
    ]) 
  }

  handleAuthenticationResponse (args) {
    let [oidc, res] = args
    let text = res.text()

    log.debug({text}, 'Handle authenticate response')

    if (res.headers) {
      let location = res.headers.get('location')

      if (location) {
        let query = url.parse(location, true).query

        if (query && query.code) {
          log.info({identifier: oidc.identifier, code: query.code}, 'User authenticated')
          return Promise.all([
            Promise.resolve(oidc),
            Promise.resolve(query.code)
          ])
        }
      }
    }

    return Promise.reject(new Error('Authentication Failed - Auth code missing or invalid'))
  }

  getJWT (args) {
    let [oidc, code] = args
    let { client_id, client_secret, redirect_uris: [redirect_uri]} = oidc.options
    log.debug('Fetching token')

    let body = querystring.stringify({
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirect_uri
    })

    return Promise.all([
      Promise.resolve(oidc),
      fetch(oidc.options.token_endpoint, 
      {
        method: 'POST',
        body,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Basic ' + toBase64(`${client_id}:${client_secret}`)
        }
      })
    ])
  }

  handleJWTResponse (args) {
    let [oidc, res] = args
    let {access_token} = res
    log.debug('Handle token response')
    oidc.tokens = res

    log.debug('awaiting JWK')

    return Promise.all([
      oidc.signing_key,
      Promise.resolve(access_token)
    ])
    .then(args => {
      let [key, token] = args
      log.debug('verifying JWT')
      return JWT.verify(key, token)
    }).then(jwt => {
      oidc.access_token = jwt

      return Promise.all([
        Promise.resolve(oidc),
        oidc.access_token
      ])
    })
  }

  verifyJWT (args) {
    let [oidc, access_token] = args

    if (access_token && access_token.verified) {
      log.info({access_token}, 'Verified access token')
    } else {
      return Promise.reject(new Error('Token not verified'))
    }
    return Promise.all(args)
  }

  userinfo (args) {
    let [oidc, access_token] = args

    log.debug('Fetching user info')

    return Promise.all([
      Promise.resolve(oidc),
      fetch(oidc.options.userinfo_endpoint,
      {
        headers: {
          Authorization: `Bearer ${access_token.segments.join('.')}`
        }
      })
    ])
  }

  verifyAttributes (args) {
    let [oidc, userinfo] = args
    let pointers = oidc.subjectAttributes
    let subject = {}

    log.debug({userinfo}, 'Validating Userinfo against required fields')
    oidc.userinfo = userinfo

    try {
      pointers.forEach(pointer => {
        let ptr = JSONPointer.parse(pointer)
        ptr.replace(subject, ptr.get({ subject: userinfo }))
      })
    } catch (e) {
      return Promise.reject(new Error('Missing required attribute'))
    }

    log.debug('attributes prepared for Auth Engine')

    return Promise.all([
      Promise.resolve(oidc),
      Promise.resolve(userinfo),
      Promise.resolve(subject)
    ])
  }

  persistCookies (args) {
    log.info('Saving cookies!')
    saveCookies()
    return Promise.resolve(args)
  }

}

/**
 * Exports
 */
module.exports = OIDCHandler
