// @ts-check
'use strict'

const testStr = require('./utils/make-tester')({ sourcemap: false })

describe('The default filter', function () {
  it('must preserve comments containing "@license"', function () {
    const str = ['/* @license MIT */', '//@license MIT', '/*\n @license MIT\n*/']
    testStr(str, str)
    testStr(str + '\n//a', str + '\n')
  })

  it('must preserve comments containing @preserve', function () {
    const str = '/*\n  @preserve\n*/\n/*@preserve*/\n0// @preserve'
    testStr(str, str)
    testStr(str + '\n//a', str + '\n')
  })

  it('must preserve comments starting with "/*!"', function () {
    const str = '/*!x*/\n0//! z\n'
    testStr(str, str)
    testStr(str + '\n//a', str)
  })
})

describe('Special filters', function () {
  it('"all" must preserve all comments', function () {
    const source = ['/*x*/', 'foo // x', '/**///z\n\n\n\n'].join('\n')

    testStr(source, source.trim() + '\n', { comments: 'all' })
    testStr(source, source.trim() + '\n\n\n', { comments: 'all', maxEmptyLines: 2 })
    testStr(source, source, { comments: 'all', maxEmptyLines: -1 })
  })

  it('"none" must remove all the comments', function () {
    const source = [
      '/** @license MIT */',
      '//x',
      'foo',
      '//!x',
      '/* @preserve *///x\n\n\n\n',
    ]

    testStr(source, 'foo\n', { comments: 'none' })
    testStr(source, '\n\nfoo\n\n\n', { comments: 'none', maxEmptyLines: 2 })
    testStr(source, '\n\nfoo\n\n\n\n\n\n', { comments: 'none', maxEmptyLines: -1 })
  })
})

// eslint-disable-next-line max-lines-per-function
describe('Predefined filters', function () {
  it('"license" must preserve only comments with "@license"', function () {
    const source = ['/** @license MIT */', '//x', 'foo', '//!x', '/* @preserve *///x\n\n\n']

    testStr(source, '/** @license MIT */\nfoo\n', { comments: 'license' })
    testStr(source, '/** @license MIT */\n\nfoo\n\n\n', {
      comments: 'license',
      maxEmptyLines: 2,
    })
  })

  it('"eslint" must preserve ESLint comments', function () {
    const source = [
      '/*eslint-env mocha*/',
      '/*eslint-disable no-console*/',
      '/* eslint no-console:0 */',
      '/* eslint-disable no-undef */',
      '/*global Promise*/',
      '/* eslint-disable-next-line max-len */',
      '/*eslint-disable-next-line */',
      '// eslint-disable-next-line',
      'foo=1 //eslint-disable-line no-undef',
      'foo=2 /* eslint-disable-line*/',
      '/*  eslint-disable*/',
      '/*eslint-enable  */',
      '/*eslint-enable*/',
    ].join('\n')

    testStr(source, source, { comments: 'eslint' })
  })

  it('"eslint" must recognize valid multiline directives', function () {
    const source = [
      '/*\n global x*/',
      '/*global\nPromise\n*/',
      '/*eslint-env\nmocha\n*/',
      '/*\n eslint rule\n*/',
      '/*eslint\nrule*/',
      'foo=1 /* eslint-disable\n*/\n',
    ].join('\n')

    testStr(source, source, { comments: 'eslint' })
    testStr(source + '//', source, { comments: 'eslint' })
  })

  it('"eslint" must ignore invalid ESLint comments', function () {
    const source = [
      '/* eslint*/',
      '// eslint-disable no-undef',
      '//eslint-env mocha',
      '// eslint no-console:0',
      '//global Promise',
      '/*\neslint-disable-next-line */',
      'foo=1 /*eslint-disable-line\n*/',
      '///*eslint-enable*/',
    ]
    testStr(source, 'foo=1\n', { comments: 'eslint' })
  })

  it('"eslint" cannot detect some invalid cases', function () {
    const source = ['/* eslint', '*/', '/* global', '*/', '// eslint-disable-next-line no']
    testStr(source, source, { comments: 'eslint' })
  })

  it('"istanbul" must preserve istanbul directives', function () {
    const opts = { comments: 'istanbul' }
    const str = '//istanbul ignore next\n0/* istanbul ignore else */\n'
    testStr(str, str, opts)
    testStr(str + '//istanbul ignore', str, opts)
  })

  it('"jsdoc" must preserve JSDoc blocks.', function () {
    const source = [
      '/**',
      ' * @class',
      ' */',
      '/// The main class',
      'class Main {',
      '  /**@type {function}*/',
      '  constructor() {}',
      '}',
      '/*@type {string}*/',
      '/** @ @type {string}*/',
      'const x=""',
    ]
    const expected = [
      '/**',
      ' * @class',
      ' */',
      'class Main {',
      '  /**@type {function}*/',
      '  constructor() {}',
      '}',
      '/** @ @type {string}*/', // note: this is not an edge case
      'const x=""',
    ]
    testStr(source, expected, { comments: 'jsdoc' })
  })

  it('"jshint" must preserve jshint directives', function () {
    const source = [
      '/* jshint undef: true */',
      '/*jshint unused: true*/',
      '/* globals MY_GLOBAL */',
      '/*\njshint +W034\n*/',
      'let a',
    ].join('\n')

    testStr(source, source, { comments: 'jshint' })
    testStr(source + '//', source, { comments: 'jshint' })
  })

  it('"jslint" must preserve jslint directives', function () {
    const source = [
      '//jslint bitwise',
      '/*jslint bitwise */',
      '//jslint', // missing parameter
      '/* jslint bitwise*/', // space not allowed
      '/*jslint\nbitwise\n*/',
      '/*jslint node*/',
      '//global MY_GLOBAL',
      '/*global MY_GLOBAL*/',
      '/*global\nMY_GLOBAL\n*/',
      '/*global */', // missing parameter
      '//global', // missing parameter
      '/* global MY_GLOBAL*/', // space
      'let a',
    ]
    const expected = [
      '//jslint bitwise',
      '/*jslint bitwise */',
      '/*jslint\nbitwise\n*/',
      '/*jslint node*/',
      '//global MY_GLOBAL',
      '/*global MY_GLOBAL*/',
      '/*global\nMY_GLOBAL\n*/',
      'let a',
    ]
    testStr(source, expected, { comments: 'jslint' })
  })

  it('"sources" must preserve sourcemap directives', function () {
    const opts = { comments: 'sources' }
    let str

    str = '// sourceMappingURL=abc.ext\n0\n//# sourceMappingURL=abc.ext'
    testStr(str, '0\n//# sourceMappingURL=abc.ext', opts)
    str = str.replace('//# ', '//@ ')
    testStr(str, '0\n//@ sourceMappingURL=abc.ext', opts)

    str = '//#sourceURL=foo\n0\n//# sourceURL=abc.ext'
    testStr(str, '0\n//# sourceURL=abc.ext', opts)
    str = str.replace('//# ', '//@ ')
    testStr(str, '0\n//@ sourceURL=abc.ext', opts)
  })
})

describe('Custom filters', function () {
  it('can be one regex', function () {
    const str = '//foo\n/* fooooo */'
    testStr(str, str, {
      comments: [/foo/],
    })
  })

  it('can be an array of regexes', function () {
    const str = '//foo\n//bar\n// bar\n'
    testStr(str, '//foo\n//bar\n', {
      comments: [/foo/, /^\/bar/],
    })
  })

  it('will receive the comment type as first char', function () {
    testStr('/*foo*/\n//foo\n//bar\n/*bar*/', '/*foo*/\n//bar\n', {
      comments: [/^\*foo/, /^\/bar/],
    })
  })

  it('must replace default filters', function () {
    testStr('/*@license X*/\n//foo', '//foo', {
      comments: [/foo/],
    })
  })
})
