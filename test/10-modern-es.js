// @ts-check
'use strict'

const testStr = require('./utils/make-tester')({
  comments: 'all',
  sourcemap: false,
})

describe('Modern ES support', function () {

  it('handles ES7', function () {
    const fiveLines = '\n\n\n\n\n'
    const es6str = '`' + fiveLines + '`'
    const wrappedStr = fiveLines + es6str + fiveLines

    testStr(wrappedStr, es6str + '\n', 0)
    testStr(wrappedStr, '\n' + es6str + '\n\n', 1)
    testStr(wrappedStr, '\n\n' + es6str + '\n\n\n', 2)
    testStr(wrappedStr, wrappedStr, 5)
    testStr(wrappedStr, wrappedStr, 20)
  })

  it('must compact only the expressions in ES6 TL', function () {
    const es6str1 = '`\n  \nX\n X\n ${ \n x \n } \n `' // eslint-disable-line
    const es6str2 = '`\n  \nX\n X\n ${\n x\n } \n `'   // eslint-disable-line
    const wrappedStr = '\n\n\n' + es6str1

    testStr(es6str1, es6str2, 0)
    testStr(wrappedStr, es6str2, 0)
    testStr(wrappedStr, '\n' + es6str2, 1)
    testStr(wrappedStr, '\n\n\n' + es6str2, 3)
    testStr(wrappedStr, '\n\n\n' + es6str2, 20)
  })

  it('must compact nested expressions in ES6 TL', function () {
    const es6str1 = '`\n ${ \n x + `${ \n0 \n}` \n } `' // eslint-disable-line
    const es6str2 = '`\n ${\n x + `${\n0\n}`\n } `'   // eslint-disable-line
    const wrappedStr = '\n\n\n' + es6str1

    testStr(es6str1, es6str2, 0)
    testStr(es6str1 + '\n\n', es6str2 + '\n', 0)
    testStr(wrappedStr, es6str2, 0)
    testStr(wrappedStr, '\n' + es6str2, 1)
    testStr(wrappedStr, '\n\n\n' + es6str2, 3)
  })

  it('must ignore all inside ES6 TL fixed part', function () {
    const es6str1 = '`\n{{} ${ x }{`' // eslint-disable-line
    const es6str2 = '`} ${ x }}`'   // eslint-disable-line

    testStr(es6str1, es6str1, 0)
    testStr(es6str1 + '\n\n', es6str1 + '\n', 0)
    testStr(es6str2, es6str2, 0)
    testStr(es6str2 + '\n\n', es6str2 + '\n', 0)
  })

  it('must ignore escaped backtick and brackets in ES6 TL', function () {
    const es6str1 = '`\\${ \nx }`' // eslint-disable-line
    const es6str2 = '`\\` $\\{ \n}\\``'   // eslint-disable-line
    const es6str3 = '`$\\{ \n\\}`'   // eslint-disable-line

    testStr(es6str1, es6str1, 0)
    testStr(es6str1 + '\n\n', es6str1 + '\n', 0)
    testStr(es6str2, es6str2, 0)
    testStr(es6str2 + '\n\n', es6str2 + '\n', 0)
    testStr(es6str3, es6str3, 0)
    testStr(es6str3 + '\n\n', es6str3 + '\n', 0)
  })

  it('support to async functions', function () {
    const source = [
      '/*',
      '  ES7',
      '*/',
      'async function foo () { ',
      '  return "foo"',
      '}',
      'foo().then( value => console.log( value ) )\n',
    ]
    const expected = [
      'async function foo () {',
      '  return "foo"',
      '}',
      'foo().then( value => console.log( value ) )\n',
    ]
    testStr(source, expected, { comments: 'none' })
  })

})
