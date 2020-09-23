const expect = require('expect')
const cleanup = require('../..')

/**
 * Make a tester for strings
 * @param {cleanup.Options} options -
 */
const makeTester = function (options) {
  options = options || { sourceMap: false }

  /**
   * Test a cleanup string vs an expected one.
   * @param {string|string[]} code -
   * @param {string|string[]} expected -
   * @param {cleanup.Options|number} [lines] - options or maxEmptyLines
   */
  const testStr = function (code, expected, lines) {
    let opts

    if (lines == null) {
      opts = options
    } else if (typeof lines === 'object') {
      opts = Object.assign({}, options, lines)
    } else {
      opts = Object.assign({}, options, { maxEmptyLines: lines })
    }

    if (Array.isArray(code)) {
      code = code.join('\n')
    }

    if (Array.isArray(expected)) {
      expected = expected.join('\n')
    }

    const result = cleanup(code, 'test.js', opts)
    expect(result).toBeAn(Object)

    if (typeof expected === 'string') {
      expect(result.code).toBe(expected)
    } else {
      expect(result.code).toMatch(expected)
    }
  }

  return testStr
}

module.exports = makeTester
