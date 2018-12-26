// @ts-check
'use strict'

const testStr = require('./utils/make-tester')({ sourcemap: false })

describe('In strings', function () {

  it('must remove comments between strings', function () {
    testStr('"a"+/*x*/"b"', '"a"+"b"')
    testStr('"a"+ \n/*x*/"b"', '"a"+\n"b"')
    testStr('"a"/*x*/+ \n"b"', '"a"+\n"b"')
    testStr('"a" /*x*/+\n"b"', '"a" +\n"b"')

    testStr("'a'+/*x*/'b'", "'a'+'b'")
    testStr("'a'+ \n/*x*/'b'", "'a'+\n'b'")
    testStr("'a'/*x*/+ \n'b'", "'a'+\n'b'")
    testStr("'a' /*x*/+\n'b'", "'a' +\n'b'")

    testStr('"a"/*x*/"b"', '"a""b"')
    testStr("'a'/*x*/'b'", "'a''b'")
  })

  it('must handle escaped multiline strings', function () {
    let str
    str = "'a\\\n'"
    testStr(str, str)
    str = "'\\\na'"
    testStr(str, str)
    str = '"a\\\n"'
    testStr(str, str)
    str = '"\\\na"'
    testStr(str, str)

    str = "'a \\\n b '"
    testStr(str, str)
    str = '"a \\\n b "'
    testStr(str, str)
  })

  // See https://tc39.github.io/ecma262/#table-33
  it('must handle unicode LS and PS in strings', function () {
    let str
    str = "'a\\u2028'"
    testStr(str, str)
    str = "'\\u2028a'"
    testStr(str, str)
    str = '"a\\u2029"'
    testStr(str, str)
    str = '"\\u2029a"'
    testStr(str, str)
  })

  it('hard LS/PS within string is a SyntaxError, but are normalized anyway', function () {
    let str
    str = "'a \u2028 b '"
    testStr(str, "'a\n b '")
    str = '"a \u2029 b "'
    testStr(str, '"a\n b "')
  })

  it('must ignore comment-like sequences within strings', function () {
    let str
    str = "'/* \\\n*/'"
    testStr(str, str)
    str = '"/* \\\n*/"'
    testStr(str, str)
    str = "'//x'"
    testStr(str, str)
    str = '"//x"'

    testStr(str, str)
    str = "'//x\\\n'"
    testStr(str, str)
    str = '"//x\\\n"'
    testStr(str, str)

    testStr(str, str)
    str = "'\\\n//x'"
    testStr(str, str)
    str = '"\\\n//x"'
    testStr(str, str)
  })

})
