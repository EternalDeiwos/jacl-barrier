'use strict'

/**
 * Test dependencies
 */
const cwd = process.cwd()
const path = require('path')
const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const _ = require('lodash')
const fetch = require('node-fetch')

/**
 * Assertions
 */
chai.use(chaiAsPromised)
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
  let barrier
  before(() => {
    barrier = new Barrier(CONFIG_PATH)
  })
  
  it('should be true', (done) => {
    let promise = barrier.enforce(42)
    promise.should.be.fulfilled
    promise.should.eventually.equal(true).notify(() => {
      console.error(promise)
      done()
    })
  })
})