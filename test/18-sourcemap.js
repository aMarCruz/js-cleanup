// @ts-check
'use strict'

const cleanup   = require('..')
const expect    = require('expect')
const fs        = require('fs')
const validate  = require('sourcemap-validator')

describe('Sourcemap support', function () {

  const srcPath = 'test/maps/'

  it('must generate a valid sourcemap object', function () {

    const file = srcPath + 'bundle-src.js'
    const code = fs.readFileSync(file, 'utf8')
    const opts = {}
    opts[file] = code

    const result = cleanup(code, file, {
      comments: ['some', 'eslint'],
      sourcemapOptions: { includeContent: false },
    })
    expect(result).toBeAn(Object).toBeTruthy()
    expect(result.code).toNotBe(code)

    const minSrc = result.code
    const srcMap = result.map

    expect(fs.readFileSync(srcPath + 'bundle.js', 'utf8')).toBe(minSrc)
    expect(srcMap).toBeAn(Object).toBeTruthy()
    expect(srcMap.sources).toBeAn('array').toEqual([file])
    expect(srcMap.sourcesContent).toBeAn('array').toEqual([null])

    validate(minSrc, JSON.stringify(srcMap), opts)
  })

  it('must inline the map with `inlineMap: true`', function () {
    const file = srcPath + 'bundle-src.js'
    const code = fs.readFileSync(file, 'utf8')

    const result = cleanup(code, file, {
      comments: ['none'],
      sourcemapOptions: { includeContent: true, inlineMap: true },
    })
    expect(result).toBeAn(Object).toBeTruthy()
    expect(result).toExcludeKey('map')
    expect(result.code).toNotBe(code)

    // current version of sourcemap-validator does not supports charset
    const minSrc = result.code.replace(';charset=utf-8', '')
    const mapPos = minSrc.indexOf('\n//# sourceMappingURL=data:application/json;')

    expect(mapPos).toBeGreaterThan(0, 'Expected an inlined sourcemap but it is not there.')
    expect(fs.readFileSync(srcPath + 'bundle-clean.js', 'utf8')).toBe(minSrc.substr(0, mapPos))

    validate(minSrc)
  })

  it('must add `map:null` if the code did not change', function () {
    const code = 'const a=0'
    const file = 'file.ext'

    const result = cleanup(code, file)
    expect(result).toBeAn(Object).toBeTruthy()
    expect(result.code).toBe(code)
    expect(result.map).toBe(null)
  })

  it('must exclude the `map` property with `sourceMap:false`', function () {
    const file = srcPath + 'bundle-src.js'
    let code = fs.readFileSync(file, 'utf8')
    let result = cleanup(code, file, { sourcemap: false })
    expect(result).toExcludeKey('map')
    expect(result.code).toNotBe(code)

    code = 'const a=0'
    result = cleanup(code, file, { sourcemap: false })
    expect(result).toBeAn(Object).toBeTruthy()
    expect(result).toExcludeKey('map')
    expect(result.code).toBe(code)
  })

})
