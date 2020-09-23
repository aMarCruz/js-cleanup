// @ts-check
'use strict'

const expect = require('expect')
const cleanup = require('..')

describe('Errors', function () {
  const R_WRONG_FILT = /unknown comment filter/i
  const R_UNEXPECTED = /unexpected /i
  const R_UNCLOSED = /unclosed /i

  it('must throw on unknown filters', function () {
    expect(() => {
      cleanup('', '', { comments: 'foo' })
    }).toThrow(R_WRONG_FILT)
  })

  it('must throw on filters of wrong type', function () {
    expect(() => {
      // @ts-ignore
      cleanup('', '', { comments: false })
    }).toThrow(R_WRONG_FILT)
    expect(() => {
      // @ts-ignore
      cleanup('', '', { comments: 0 })
    }).toThrow(R_WRONG_FILT)
  })

  it('must throw on unclosed comments', function () {
    expect(() => {
      cleanup('/* foo * /\n', '', { comments: 'all' })
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup('/* foo */*/\n', '', { comments: 'all' })
    }).toNotThrow()
  })

  it('must throw on unclosed strings', function () {
    expect(() => {
      cleanup('x="foo/\n"', '')
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup('x="foo', '')
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup("x='foo/\n", '')
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup("x='foo", '')
    }).toThrow(R_UNCLOSED)
  })

  it('must throw on unclosed ES6 TL', function () {
    expect(() => {
      cleanup('x=`foo/\n', '')
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup('x={`${0`}}', '') // eslint-disable-line
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup('x=`${0', '') // eslint-disable-line
    }).toThrow(R_UNCLOSED)
  })

  it('must throw on unbalanced braces', function () {
    expect(() => {
      cleanup('x={foo:1', '')
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup('x={foo:`${0}}`', '') // eslint-disable-line
    }).toThrow(R_UNCLOSED)
    expect(() => {
      cleanup('x={"{"}}', '')
    }).toThrow(R_UNEXPECTED)
    expect(() => {
      cleanup('x={{:0}', '')
    }).toThrow(R_UNCLOSED)
  })

  it('must ignore other JS errors', function () {
    expect(() => {
      cleanup('var x = ;\nfoo; //x\n')
    }).toNotThrow()
  })

  it('most parsing error must include the position', function () {
    try {
      cleanup('x={"{"}}', '')
      expect(0).toBe(1, 'Expected an error')
    } catch (err) {
      expect(err).toBeAn(Error).toInclude({ position: 7 })
    }
  })
})
