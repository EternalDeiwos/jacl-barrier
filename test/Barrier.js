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
const POSITIVE_CONFIG_PATH = './test/config/dev.json'
const NEGATIVE_CONFIG_PATH = './test/config/dev_deny.json'

/**
 * Code under test
 */
const Barrier = require('../src/Barrier')

/**
 *
 */
describe('Barrier', () => {
  let barrier

  describe('Integration', function () {
    this.timeout(0)

    describe('positive rule', function () {
      before(() => {
        barrier = new Barrier(POSITIVE_CONFIG_PATH)
      })

      it('should allow access', function (done) {
        let promise = barrier.enforce(42)
        promise.should.eventually.be.true.notify(done)
      })
    })

    describe('negative rule', function () {
      before(() => {
        barrier = new Barrier(NEGATIVE_CONFIG_PATH)
      })

      it('should deny access', function (done) {
        let promise = barrier.enforce(42)
        promise.should.eventually.be.false.notify(done)
      })
    })

  })  
})