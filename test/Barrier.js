'use strict'

/**
 * Test dependencies
 */
const cwd = process.cwd()
const path = require('path')
const chai = require('chai')
const _ = require('lodash')

/**
 * Assertions
 */
chai.should()
let expect = chai.expect

/**
 * Constants
 */
const STORE_DATA_DIR = './test/store'
const CONFIG_PATH = './test/config/dev.json'

/**
 * Code under test
 */
const Barrier = require('../src/Barrier')

/**
 *
 */
describe('Barrier', () => {
  let barrier = new Barrier(CONFIG_PATH)
  barrier.enforce({})
})