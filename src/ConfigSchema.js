'use strict'

/**
 * Dependencies
 * @ignore
 */
const {JSONSchema} = require('json-document')

/**
 * Module Dependencies
 * @ignore
 */
const ProviderSchema = require('./ProviderSchema')

/**
 * JACL Barrier Schema
 */
const schema = new JSONSchema({
  type: 'object',
  properties: {

    /**
     * Provider
     * @required
     */
    provider: ProviderSchema,

    /**
     * Stores directories
     * @type {string}
     * @default []
     */
    stores: { type: 'array', default: [] },

    /**
     * Rule to enforce
     * @type {string}
     * @required
     */
    access: { type: 'string' }
  },
  required: ['provider', 'access']
})

/**
 * Exports
 * @ignore
 */
module.exports = schema