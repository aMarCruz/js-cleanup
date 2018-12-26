// @ts-check
'use strict'

const testLines = require('./utils/make-tester')({ sourcemap: false })

describe('Lines', function () {

  it('by default removes all the empty lines and normalize to unix', function () {
    const source = [
      '',
      'abc ',
      'x\t',
      '\r\ny \r',
      '\n\n\r\t',
      'z ',
    ]
    testLines(source, 'abc\nx\ny\nz')
  })

  it('must not touch current indentation of non-empty lines', function () {
    testLines('\n X\n  X', ' X\n  X')
    testLines('  X\n\n X', '  X\n X')
  })

  it('must respect the last line-ending, if there\'s one', function () {
    testLines('\nX\n\n\n', 'X\n')
    testLines('X\n ', 'X\n')
    testLines('X\n', 'X\n')
    testLines('X', 'X')
  })

  it('must correctly trim adjacent whitespace (0)', function () {
    testLines('\n\n\n\n', '')
    testLines(' \n \n\t \n \r\n', '')
    testLines('\n\t\r\n\t\f\v\n', '')
    testLines('\n \n', '')
    testLines('\n ', '')
    testLines('  \n', '')
    testLines('  ', '')
  })

  it('must correctly trim adjacent whitespace (2)', function () {
    const opts = { maxEmptyLines: 2 }
    testLines('\n\n\n\n', '\n\n', opts)
    testLines(' \n \n\t \n \r\n', '\n\n', opts)
    testLines('\n\t\r\n\t\f\v\n', '\n\n', opts)
    testLines('\n \n', '\n\n', opts)
    testLines('\n ', '\n', opts)
    testLines('  \n', '\n', opts)
    testLines('  ', '', opts)
  })

  it('must correctly trim adjacent whitespace (-1)', function () {
    const opts = { maxEmptyLines: -1 }
    testLines('\n\n\n\n', '\n\n\n\n', opts)
    testLines(' \n \n\t \n \r\n', '\n\n\n\n', opts)
    testLines('\n\t\r\n\t\f\v\n', '\n\n\n', opts)
    testLines('\n \n', '\n\n', opts)
    testLines('\n ', '\n', opts)
    testLines('  \n', '\n', opts)
    testLines('  ', '', opts)
  })

  it('must trim trailing spaces', function () {
    testLines('  \nX \nX\t  \nX \t\n', 'X\nX\nX\n')
    testLines('  \n\t\nX  ', 'X')
    testLines('\nX  ', 'X')
    testLines('X \n', 'X\n')
    testLines('X ', 'X')
  })

  it('must also trim and normalize unicode LS and PS', function () {
    let str = '\u2029let a\u2029let b\u2028\u2029\n\u2029'
    testLines(str, 'let a\nlet b\n', 0)
    testLines(str, '\nlet a\nlet b\n\n', 1)
    testLines(str, '\nlet a\nlet b\n\n\n\n', -1)

    str = '\u2029\t \u2029\v \u2029'
    testLines(str, '', 0)
    testLines(str, '\n', 1)
    testLines(str, '\n\n', 2)
    testLines(str, '\n\n\n', -1)
  })

})
