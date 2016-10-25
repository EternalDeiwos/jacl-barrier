'use strict'

/**
 * Test dependencies
 */
const cwd = process.cwd()
const path = require('path')
const chai = require('chai')
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
const chaiAsPromised = require('chai-as-promised')
const _ = require('lodash')

/**
 * Assertions
 */
chai.use(chaiAsPromised)
chai.use(sinonChai)
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
describe.skip('Barrier', () => {
  let barrier
  before(() => {
    barrier = new Barrier(CONFIG_PATH)
  })
  
  it('should be true', function (done) {
    this.timeout(0)
    let promise = barrier.enforce(42)
    promise.should.eventually.be.true.notify(done)
  })
})