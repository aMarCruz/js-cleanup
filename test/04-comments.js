// @ts-check
'use strict'

const testStr = require('./utils/make-tester')({ sourcemap: false })

describe('Comments remotion', function () {

  it('must trim trailing whitespace inside comments', function () {
    testStr('/*\n @license X \n*/', '/*\n @license X\n*/')
    testStr('/* \n @license X \n */', '/*\n @license X\n */')
  })

  it('must correctly remove the first comment', function () {
    testStr('/*x*/', '')
    testStr('/*x*/\n', '')
    testStr('\n/*x*/', '')
    testStr('\n\n\n/*x*/', '')
    testStr('\n/*x*/ \n', '')
    testStr(' \n/*x*/\n', '')
    testStr('\n/*x*/ \nX', 'X')
    testStr('\n /*x*/\nX', 'X')
    testStr('\n\n\n/*x*/\n\n\n\nX', '\n\nX', 2)
    testStr('\n\n\n/*x*/\n\n\n\nX', '\n\n\n\n\n\n\nX', -1)
  })

  it('must correctly remove the last comment', function () {
    testStr('foo/*x*/', 'foo')
    testStr('foo/*x*/\n', 'foo\n')
    testStr('foo/*x*/\n\n\n\n', 'foo\n')
    testStr('foo/*x*/\n\n\n\n', 'foo\n\n\n', 2)
    testStr('foo/*x*/\n\n\n\n', 'foo\n\n\n\n', -1)

    testStr('foo\n/*x*/ ', 'foo\n')
    testStr('foo\n/*x*/ \n', 'foo\n')
    testStr('foo\n/*x*/ \n\n\n\n', 'foo\n')
    testStr('foo\n/*x*/ \n\n\n\n', 'foo\n\n\n', 2)
    testStr('foo\n/*x*/ \n\n\n\n', 'foo\n\n\n\n\n', -1)

    testStr('foo /*x*/ ', 'foo')
    testStr('foo /*x*/ \n', 'foo\n')
    testStr('foo /*x*/ \n\n\n\n', 'foo\n')
    testStr('foo /*x*/ \n\n\n\n', 'foo\n\n\n', 2)
    testStr('foo /*x*/ \n\n\n\n', 'foo\n\n\n\n', -1)
  })

  it('must remove final comments preceded by tabs', function () {
    testStr('foo \t /*x*/ ', 'foo')
    testStr('foo \t /*x*/ \n ', 'foo\n')
    testStr('foo \t /*x*/ \n\n\n\n ', 'foo\n')
    testStr('foo \t /*x*/ \n\n\n\n ', 'foo\n\n\n', 2)
    testStr('foo \t /*x*/ \n\n\n\n ', 'foo\n\n\n\n', -1)
  })

  it('must remove comments in the middle', function () {
    testStr('foo /*x*/\nbar', 'foo\nbar')
    testStr('foo/*x*/ \n\n\n\nbar', 'foo\nbar')
    testStr('foo /*x*/ \n\nbar\n ', 'foo\nbar\n')
    testStr('foo/*x*/\n\nbar\n ', 'foo\n\nbar\n', 2)
    testStr('foo/*x*/\n\nbar\n\n\n\n ', 'foo\n\nbar\n\n\n', 2)
  })

  it('must remove comments sharing its line with content', function () {
    testStr('foo/*x*/+bar', 'foo+bar')
    testStr('foo /*x*/+bar ', 'foo +bar')
    testStr('foo/*x*/ +bar ', 'foo +bar')
    testStr('foo /*x*/ +bar ', 'foo  +bar')
    testStr('foo=Array<*/* x */>', 'foo=Array<*>')

    testStr('foo\n/*x*/bar ', 'foo\nbar')
    testStr('foo\n/*x*/bar \n', 'foo\nbar\n')
    testStr('foo\n/*x*/bar \n\n\n\n', 'foo\nbar\n')
    testStr('foo\n/*x*/bar \n\n\n\n', 'foo\nbar\n\n\n', 2)

    testStr('foo /*x*/+bar \n', 'foo +bar\n')
    testStr('foo /*x*/+bar \n\n\n\n', 'foo +bar\n')
    testStr('foo /*x*/+bar \n\n\n\n', 'foo +bar\n\n\n', 2)

    testStr('foo \t/*x*/ +bar ', 'foo \t +bar')
    testStr('foo \t/*x*/ +bar \n ', 'foo \t +bar\n')
    testStr('foo \t/*x*/ +bar \n\n\n\n ', 'foo \t +bar\n')
    testStr('foo \t/*x*/ +bar \n\n\n\n ', 'foo \t +bar\n\n\n', 2)
  })

  it('must remove consecutive comments', function () {
    const source = [
      '/*x*/',
      'foo /*x*/',
      '/**//**/\n\n\n\n',
    ].join('\n')

    testStr(source.replace(/\n/g, ''), 'foo')
    testStr(source, 'foo\n')
    testStr(source, '\nfoo\n\n\n', 2)
    testStr(source, '\nfoo\n\n\n\n\n', -1)
  })

  it('must remove comments of any length', function () {
    const source = [
      '/*',
      'This is a long comment',
      Array(200).join('Nostrud minim nisi aliqua non aute dolor ullamco anim eu consectetur. '),
      Array(200).join('Fugiat esse culpa voluptate laborum ea dolor ut qui aliquip cillum irure.'),
      '*/0',
    ]
    testStr(source, '0')
  })

  it('must remove comments even if there\'s no changes in line-endings', function () {
    const source = [
      '/* to remove */foo',
      ' /**/ bar',
      'baz',
    ]
    testStr(source, 'foo\n  bar\nbaz', { comments: null })
  })

})

describe('Comments remotion (one-line and mixed)', function () {

  it('must remove comments at top', function () {
    testStr('// top', '')
    testStr('// top\n', '')
    testStr('// top\nfoo', 'foo')
    testStr(' // top\nfoo', 'foo')
    testStr(' // top \n foo', ' foo')
  })

  it('must remove comments at right', function () {
    testStr('foo// right', 'foo')
    testStr('foo //right \n', 'foo\n')
    testStr('foo // right\n', 'foo\n')
    testStr('foo // right\n\n\n\n', 'foo\n')
    testStr('foo // right\n\n\n\n', 'foo\n\n\n', 2)
    testStr('foo // right\n\n\n\n', 'foo\n\n\n\n', -1)
  })

  it('must remove comments at right', function () {
    testStr('foo\n//bottom', 'foo\n')
    testStr('foo\n //bottom \n', 'foo\n')
    testStr('foo\n // bottom\n', 'foo\n')
    testStr('foo\n // bottom\n\n\n\n', 'foo\n')
    testStr('foo\n // bottom\n\n\n\n', 'foo\n\n\n', 2)
    testStr('foo\n // bottom\n\n\n\n', 'foo\n\n\n\n\n', -1)
  })

  it('must remove the last comments, even if empty', function () {
    testStr('foo//', 'foo')
    testStr('foo //', 'foo')
    testStr('foo\n//', 'foo\n')
    testStr('foo\n // ', 'foo\n')
    testStr('foo // \n', 'foo\n')
    testStr('foo\n //\n\n\n\n', 'foo\n')
    testStr('foo\n //\n\n\n\n', 'foo\n\n\n', 2)
    testStr('foo\n //\n\n\n\n', 'foo\n\n\n\n\n', -1)
  })

  it('must remove comments in any position', function () {
    const source = [
      '//top',
      'foo //right',
      '//right',
      'foo',
      ' // bottom',
    ]
    testStr(source, 'foo\nfoo\n')
  })

  it('must remove mixed consecutive comments', function () {
    const source = [
      '/**/',
      '/*x*/',
      'foo // x',
      '/**///x\n\n\n\n',
    ].join('\n')

    testStr(source.replace(/\n/g, ''), 'foo')
    testStr(source, 'foo\n')
    testStr(source, '\n\nfoo\n\n\n', 2)
    testStr(source, '\n\nfoo\n\n\n\n\n', -1)
  })

  it('must remove nested comments', function () {
    testStr('/*/**/', '')
    testStr('/*/**/\n', '')
    testStr('/* /**/\nX', 'X')
    testStr('/*\n/**/\nX', 'X')

    testStr('/*//*/', '')
    testStr('/*//*/\n', '')
    testStr('/*//\n*/\nX', 'X')
    testStr('/*\n//*/\nX', 'X')

    testStr('///**/', '')
    testStr('///**/\n', '')
    testStr('///**/\nX', 'X')
    testStr('X///**/\n', 'X\n')
  })

  it('must recognize unicode LS/PS within comments', function () {
    const source = '/* a\u2029 b\u2028 */\n'
    testStr(source, '\n\n\n', -1)
  })

})
