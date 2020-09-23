const fs = require('fs')
const expect = require('expect')
const joinPath = require('./join-path')
const cleanup = require('../..')

/**
 * @param {string} file -
 * @param {cleanup.Options} [opts]
 * @param {boolean} [save]
 */
const testFile = function _testFile (file, opts, save) {
  const fname = joinPath('fixtures', file)
  const expected = fs.readFileSync(joinPath('expected', file), 'utf8')
  const code = fs.readFileSync(fname, 'utf8')
  const result = cleanup(code, fname, opts)

  expect(result).toBeAn(Object).toBeTruthy()
  if (save) {
    fs.writeFileSync(joinPath('expected', file + '_out'), result.code, 'utf8')
  }

  if (typeof expected === 'string') {
    expect(result.code).toBe(expected)
  } else {
    expect(result.code).toMatch(expected)
  }
}

module.exports = testFile
