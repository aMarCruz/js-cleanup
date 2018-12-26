// @ts-check
'use strict'

const testStr = require('./utils/make-tester')({ sourcemap: false })

describe('TypeScript', function () {

  it('"ts" must handle TypeScript files', function () {
    const source = [
      '/*@ts-nocheck*/',
      '// @ts-check',
      '///<reference lib="es6"/>',
      '//@ts-ignore',
      'const foo = (a: number, b: {}) => {',
      '  /* @ts-ignore: wtf?*/',
      '  return foo as {} //any',
      '}',
      '// @jsx h',
    ]
    const expected = [
      '/*@ts-nocheck*/',
      '// @ts-check',
      '///<reference lib="es6"/>',
      '//@ts-ignore',
      'const foo = (a: number, b: {}) => {',
      '  /* @ts-ignore: wtf?*/',
      '  return foo as {}',
      '}',
      '// @jsx h',
    ]
    testStr(source, expected, { comments: ['ts'] })
  })

  it('"ts" must preserve Triple-Slash directives.', function () {
    const source = [
      '/// <reference path="foo.bar" />',
      '/// <reference types=\'node\' />',
      '/// <reference><reference/>',  // no ts
      '/** @module FooMain */',       // no tS
      '///<amd-module />',
      '/// The main class',   // no ts
      '/* @jsx preact.h */',
      'class Main {',
      '  constructor() {}',
      '}',
    ]
    const expected = [
      '/// <reference path="foo.bar" />',
      '/// <reference types=\'node\' />',
      '///<amd-module />',
      '/* @jsx preact.h */',
      'class Main {',
      '  constructor() {}',
      '}',
    ]
    testStr(source, expected, { comments: 'ts' })
  })

  it('"ts3s" must preserve only Triple-Slash directives.', function () {
    const source = [
      '//@ts-check',
      '/// <reference path="foo.bar" />',
      '/// <reference types=\'node\' />',
      '///<amd-module />',
      '/* @jsx preact.h */',
      'class Main {',
      '  //@ts-ignore',
      '  constructor() {}',
      '}',
    ]
    const expected = [
      '/// <reference path="foo.bar" />',
      '/// <reference types=\'node\' />',
      '///<amd-module />',
      'class Main {',
      '  constructor() {}',
      '}',
    ]
    testStr(source, expected, { comments: 'ts3s' })
  })

})

describe('Flow', function () {

  /*
    @flow and $Flow<any> can be contained in single or multiline comments.
  */
  it('"flow" must preserve facebook Flow directives', function () {
    const source = [
      '//@flow',
      '/*@flow*/',
      '/*\n@flow\n*/',
      '//main class',         // remove
      '// $FlowFixMe',
      '/*',
      ' $FlowIgnore*/',
      'class Main {',
      '  constructor(s:string) {}',
      '}',
    ]
    const expected = [
      '//@flow',
      '/*@flow*/',
      '/*\n@flow\n*/',
      '// $FlowFixMe',
      '/*',
      ' $FlowIgnore*/',
      'class Main {',
      '  constructor(s:string) {}',
      '}',
    ]
    testStr(source, expected, { comments: 'flow' })
  })

  /*
    Definitions starts with "::" or "flow-include" and can be only in
    multiline comments, preceded by optional tabs or spaces.
    Types (ex. in parameters) must follow the name and have 1 or 3
    colons but, since we aren't parsing the comment, we also must accept
    this comments in any place and with 2 colons, as in definitions.
  */
  it('"flow" must preserve comment types', function () {
    const source = [
      '//@flow',
      '/*::',
      ' type A = {};',
      '*/',
      '/* :: type B={}*/',
      '/*\ntype B={}\n*/',    // remove, not valid
      '//main class',         // remove
      'class Main {',
      '  //*flow-include pop:number*/', // remove, not valid
      '  /*flow-include pop:string */',
      '  constructor(s/* :A*/) /*:::boolean */ {/*::::number*/}', // remove the 3rd
      '}',
    ]
    const expected = [
      '//@flow',
      '/*::',
      ' type A = {};',
      '*/',
      '/* :: type B={}*/',
      'class Main {',
      '  /*flow-include pop:string */',
      '  constructor(s/* :A*/) /*:::boolean */ {}',
      '}',
    ]
    testStr(source, expected, { comments: 'flow' })
  })

  /*
    @flow and $Flow<any> can be in single or multiline comment
    Directive "::" or "flow-include" can be only in multiline comments
    and can be preceded by tabs or spaces.
    The types (ex. parameters) must be after the parameter and with one
    or three colons but, since we aren't parsing the comment, we must
    accept 1 to 3 colons.
  */
  it('"flow" must also preserve flowlint directives', function () {
    const source = [
      '/* @flow */',
      '//main class',   // remove
      '/*\fflowlint\nx*/',
      '//flowlint x',
      'class Main {',
      '  //flowlint-line x',
      '  // flowlint-next-line x*/',
      '  /*\nflowlint-next-line x*/',
      '  constructor(/*: string*/s) {} /*flowlint-next-line x\n*/',
      '  /*flowlint-next-line*/',   //invalid
      '}',
    ]
    const expected = [
      '/* @flow */',
      '/*\fflowlint\nx*/',
      '//flowlint x',
      'class Main {',
      '  //flowlint-line x',
      '  // flowlint-next-line x*/',
      '  /*\nflowlint-next-line x*/',
      '  constructor(/*: string*/s) {} /*flowlint-next-line x\n*/',
      '}',
    ]
    testStr(source, expected, { comments: 'flow' })
  })

})
