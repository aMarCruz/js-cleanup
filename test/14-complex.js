// @ts-check
'use strict'

const testFile = require('./utils/test-file')

describe('Process complex file', function () {
  it('riot.js', function () {
    const opts = {
      comments: ['some', 'istanbul'],
    }
    testFile('riot.js', opts)
  })
})
