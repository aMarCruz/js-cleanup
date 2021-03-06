// @ts-check
'use strict'

const testFile = require('./utils/test-file')

describe('Fixed Issues', function () {
  it('#1 Fails to process jsx file', function () {
    testFile('issue_10')
  })

  it('#10 Errors out on spread operator', function () {
    testFile('issue_10')
  })

  it('#11 Pass more options to acorn: import()', function () {
    testFile('issue_11')
  })

  it('#16 rollup hang up when running with this plugin in node.js', function () {
    testFile('issue_16-rollup')
  })
})
