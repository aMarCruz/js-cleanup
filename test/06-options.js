// @ts-check
'use strict'

const testStr = require('./utils/make-tester')({
  comments: 'all',
  sourcemap: false,
})

/** @typedef {import('..').Options} Options */

const emptyLines10 = '\n\n\n\n\n\n\n\n\n\n'
const emptyLinesTop = emptyLines10 + 'X'
const emptyLinesBottom = 'X' + emptyLines10
const emptyLinesTopAndBottom = emptyLines10 + 'X' + emptyLines10
const emptyLinesTopMiddleBottom = emptyLines10 + 'X' + emptyLines10 + 'X' + emptyLines10

describe('compactComments', function () {
  /** @type {Options} */
  const opts = { comments: 'all', compactComments: false }

  it('with `false` must not touch trailing whitespace in multiline comments', function () {
    let str

    str = '/* \n X \n*/ '
    testStr(str, str.trim(), opts)
    str = ' \n/* \n X \n */ \n'
    testStr(str, '/* \n X \n */\n', opts)
    str = 'a// X '
    testStr(str, 'a// X', opts)
    str = 'a// X \n'
    testStr(str, 'a// X\n', opts)
  })

  it('with `false` must normalize but no change line count within comments', function () {
    let str

    str = '\n\n\n/*!\n\n\n*/\n\n\n'
    opts.maxEmptyLines = 0
    testStr(str, '/*!\n\n\n*/\n', opts)
    opts.maxEmptyLines = 1
    testStr(str, '\n/*!\n\n\n*/\n\n', opts)
    opts.maxEmptyLines = -1
    testStr(str, '\n\n\n/*!\n\n\n*/\n\n\n', opts)

    str = '\r\r\n/*\r\r\n\n\u2028\u2029*/\r'
    opts.maxEmptyLines = 0
    testStr(str, '/*\n\n\n\n\n*/\n', opts)
    opts.maxEmptyLines = -1
    testStr(str, '\n\n/*\n\n\n\n\n*/\n', opts)

    opts.maxEmptyLines = 0  // restore
  })

})

describe('lineEndings', function () {

  it('must convert to Unix line-endings with `lineEndings: "unix"`', function () {
    /** @type {Options} */
    const opts = { maxEmptyLines: 1, lineEndings: 'unix' }
    const str5 = '\r\n\r\n\r\r\rX'

    testStr('X\r', 'X\n', opts)
    testStr('X\n', 'X\n', opts)
    testStr('X\r\n', 'X\n', opts)

    testStr(str5, '\nX', opts)
    opts.maxEmptyLines = 2
    testStr(str5, '\n\nX', opts)
    opts.maxEmptyLines = 5
    testStr(str5, '\n\n\n\n\nX', opts)
    opts.maxEmptyLines = -1
    testStr(str5, '\n\n\n\n\nX', opts)
    opts.maxEmptyLines = 10
    testStr(str5, '\n\n\n\n\nX', opts)
  })

  it('must convert to Windows line-endings with `lineEndings: "win"`', function () {
    /** @type {Options} */
    const opts = { maxEmptyLines: 1, lineEndings: 'win' }

    testStr(emptyLinesTop, '\r\nX', opts)
    testStr(emptyLinesBottom, 'X\r\n\r\n', opts)
    testStr(emptyLinesTopAndBottom, '\r\nX\r\n\r\n', opts)
    testStr(emptyLinesTopMiddleBottom, '\r\nX\r\n\r\nX\r\n\r\n', opts)
    opts.maxEmptyLines = 10
    testStr(emptyLinesTop, emptyLinesTop.replace(/\n/g, '\r\n'), opts)
    testStr(emptyLinesBottom, emptyLinesBottom.replace(/\n/g, '\r\n'), opts)
    testStr(emptyLinesTopAndBottom, emptyLinesTopAndBottom.replace(/\n/g, '\r\n'), opts)
    testStr(emptyLinesTopMiddleBottom, emptyLinesTopMiddleBottom.replace(/\n/g, '\r\n'), opts)
  })

  it('must convert to Mac line-endings with `lineEndings: "mac"`', function () {
    /** @type {Options} */
    const opts = { maxEmptyLines: 1, lineEndings: 'mac' }

    testStr(emptyLinesTop, '\rX', opts)
    testStr(emptyLinesBottom, 'X\r\r', opts)
    testStr(emptyLinesTopMiddleBottom, '\rX\r\rX\r\r', opts)
    testStr(emptyLinesTopAndBottom, '\rX\r\r', opts)
    opts.maxEmptyLines = 10
    testStr(emptyLinesTop, emptyLinesTop.replace(/\n/g, '\r'), opts)
    testStr(emptyLinesBottom, emptyLinesBottom.replace(/\n/g, '\r'), opts)
    testStr(emptyLinesTopAndBottom, emptyLinesTopAndBottom.replace(/\n/g, '\r'), opts)
    testStr(emptyLinesTopMiddleBottom, emptyLinesTopMiddleBottom.replace(/\n/g, '\r'), opts)
  })

  it('must normalize line-endings of buffers with mixed line-endings', function () {
    /** @type {Options} */
    const opts = { maxEmptyLines: -1, lineEndings: 'mac' }

    testStr('\r', '\r', opts)
    testStr('\n', '\r', opts)
    testStr('\r\n', '\r', opts)
    testStr('\r\r\n\n\r', '\r\r\r\r', opts)
    testStr('\rX \n\r\rXX\nX\r\rX\n\r\n', '\rX\r\r\rXX\rX\r\rX\r\r', opts)
    testStr('\r\n \n\r \r\r\n \r\r \n', '\r\r\r\r\r\r\r\r', opts)
    opts.lineEndings = 'win'
    testStr('\r', '\r\n', opts)
    testStr('\n', '\r\n', opts)
    testStr('\r\n', '\r\n', opts)
    testStr('\r\r\n\n\r', '\r\n\r\n\r\n\r\n', opts)
    testStr('\rX \n\r\rXX\nX\r\rX\n\r\n', '\r\nX\r\n\r\n\r\nXX\r\nX\r\n\r\nX\r\n\r\n', opts)
    testStr('\r\n \n\r \r\r\n \r\r \n', '\r\n\r\n\r\n\r\n\r\n\r\n\r\n\r\n', opts)
  })

})

describe('maxEmptyLines', function () {

  it('must keep all the lines by setting `maxEmptyLines: -1`', function () {
    testStr(emptyLines10, emptyLines10, -1)
    testStr(emptyLinesTop, emptyLinesTop, -1)
    testStr(emptyLinesBottom, emptyLinesBottom, -1)
    testStr(emptyLinesTopAndBottom, emptyLinesTopAndBottom, -1)
    testStr(emptyLinesTopMiddleBottom, emptyLinesTopMiddleBottom, -1)
  })

  it('must keep `maxEmptyLines` at the start of the buffer', function () {
    testStr('\n\n\nX\nX\t\n', '\n\nX\nX\n', 2)
    testStr('  \n\t\nX  ', '\nX', 1)
    testStr('\nX', '\nX', 1)
    testStr('\n', '\n', 1)
    testStr(emptyLinesTop, 'X', 0)
    testStr(emptyLinesTop, '\nX', 1)
    testStr(emptyLinesTop, '\n\n\nX', 3)
    testStr(emptyLinesTop, emptyLinesTop, 10)
    testStr(emptyLinesTop, emptyLinesTop, 20)
  })

  it('must keep `maxEmptyLines` at the end of the buffer', function () {
    testStr(emptyLinesBottom, 'X\n', 0)
    testStr(emptyLinesBottom, 'X\n\n', 1)
    testStr(emptyLinesBottom, 'X\n\n\n\n', 3)
    testStr(emptyLinesBottom, emptyLinesBottom, 10)
    testStr(emptyLinesBottom, emptyLinesBottom, 20)
  })

  it('must keep `maxEmptyLines` at the top and bottom', function () {
    testStr(emptyLinesTopAndBottom, 'X\n', 0)
    testStr(emptyLinesTopAndBottom, '\nX\n\n', 1)
    testStr(emptyLinesTopAndBottom, '\n\n\nX\n\n\n\n', 3)
    testStr(emptyLinesTopAndBottom, emptyLinesTopAndBottom, 10)
    testStr(emptyLinesTopAndBottom, emptyLinesTopAndBottom, 20)
  })

  it('must keep `maxEmptyLines` at the middle of the buffer', function () {
    testStr(emptyLinesTopMiddleBottom, 'X\nX\n', 0)
    testStr(emptyLinesTopMiddleBottom, '\nX\n\nX\n\n', 1)
    testStr(emptyLinesTopMiddleBottom, '\n\n\nX\n\n\n\nX\n\n\n\n', 3)
    testStr(emptyLinesTopMiddleBottom, emptyLinesTopMiddleBottom, 10)
    testStr(emptyLinesTopMiddleBottom, emptyLinesTopMiddleBottom, 20)
  })

  it('must respect maxEmptyLines inside comments', function () {
    const str1 = '/*\n\n\n\n  @license MIT\n*/\n'
    const str2 = '/*@license MIT\n\n\n\n*/'

    testStr(str1, '/*\n  @license MIT\n*/\n', 0)
    testStr(str1, '/*\n\n\n  @license MIT\n*/\n', 2)
    testStr(str1, str1, -1)
    testStr(str2, '/*@license MIT\n*/', 0)
    testStr(str2, '/*@license MIT\n\n\n*/', 2)
    testStr(str2, str2, -1)
  })

})
