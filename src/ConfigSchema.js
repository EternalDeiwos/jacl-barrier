'use strict'

/**
 * Dependencies
 * @ignore
 */
const {JSONSchema} = require('json-document')

/**
 * JACL Barrier Schema
 */
const schema = new JSONSchema({
  type: 'object',
  properties: {

    /**
     * provider
     *
     * @description
     * Information about the identity provider including the issuer url and
     * name.
     */
    provider: {
      type: 'object',
      properties: {
        name: { type: 'string' },
        url: { type: 'string', format: 'uri'},
        // Client metadata here...
      },
      required: ['url']
    },

    /**
     * stores
     *
     * @description
     * Paths to various data stores containing attributes or attribute
     * generators.
     */
    stores: {
      type: 'array',
    },

    access: {
      type: 'string'
    }
  },
  required: ['provider', 'access']
})

/**
 * Exports
 * @ignore
 */
module.exports = schema