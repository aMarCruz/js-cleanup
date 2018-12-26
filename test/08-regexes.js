// @ts-check
'use strict'

describe('In regexes', function () {

  const testStr = require('./utils/make-tester')({ sourcemap: false })

  it('must skip comment-like sequences in regexes', function () {
    let str
    str = '/\\//'
    testStr(str, str)
    str = '/\\*/'
    testStr(str, str)
    str = '/\\*[/*x*/]/'
    testStr(str, str)
  })

  it('must not confuse comment with regexes', function () {
    testStr('//x/', '')
    testStr('/**/', '')
    testStr('0///', '0')
    testStr('5x/**/a', '5xa')
  })

  it('must not confuse division sign with regexes', function () {
    testStr('5/x//', '5/x')
    testStr('a=/**/0', 'a=0')
    testStr('c=//\n0', 'c=\n0')
    testStr('x = /x/* 5 */y/', 'x = /x/* 5 */y/')
  })

  it('must ignore quotes inside regexes', function () {
    testStr('/"/', '/"/')
    testStr('a=/"/0', 'a=/"/0')
    testStr('c=/\'/\n0', 'c=/\'/\n0')
  })

  it('hard LS/PS within regex is a SyntaxError, but are normalized anyway', function () {
    let str
    str = 'a=/\u2028/'
    testStr(str, 'a=/\n/')
    str = 'a=/\u2029/'
    testStr(str, 'a=/\n/')
  })

})
