'use strict'

/**
 * Dependencies
 * @ignore
 */
const {JSONSchema} = require('json-document')

/**
 * JACL Provider Schema
 */
const schema = new JSONSchema({
  type: 'object',
  properties: {

    /**
     * Name of provider
     * @type {string}
     */
    name: { type: 'string' },

    /**
     * Signin URI
     * @type {string}
     * @default discovered from openid-configuration
     */
    signin: { type: 'string', format: 'uri' },
    
    /**
     * Issuer URI
     * @type {string}
     * @required
     */
    issuer: { type: 'string', format: 'uri' },

    /**
     * OIDC Client ID
     * @type {string}
     * @required
     */
    client_id: { type: 'string' },

    /**
     * OIDC Client Secret
     * @type {string}
     * @required
     */
    client_secret: { type: 'string' },

    /**
     * Redirect URIs
     * @type {array<string>}
     * @required
     */
    redirect_uris: { type: 'array', items: { type: 'string' }, minItems: 1 },

    /**
     * Scope to Attributes mapping
     * @type {Object}
     * @default {}
     */
    scope_attributes: { type: 'object', default: {} }
  },
  required: ['issuer', 'client_id', 'redirect_uris', 'client_secret']
})

/**
 * Exports
 * @ignore
 */
module.exports = schema