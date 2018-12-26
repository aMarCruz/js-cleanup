/*
  Rollup configuration.
*/
const nodeResolve = require('rollup-plugin-node-resolve')
const typescript = require('rollup-plugin-typescript')
const pkg = require('./package.json')

const external = Object.keys(pkg.dependencies)

const banner = `/**
 * js-cleanup v${pkg.version}
 * @author aMarCruz
 * @license MIT
 */
/* eslint-disable */`

export default {
  input: pkg.source,
  plugins: [
    nodeResolve(),
    typescript({
      module: 'es6',
      sourceMap: true,
      target: 'es6',
      include: 'src/*.ts',
    }),
  ],
  external,
  output: [{
    banner,
    file: pkg.main,
    format: 'cjs',
    interop: false,
    sourcemap: true,
  }, {
    banner,
    file: pkg.module,
    format: 'es',
    sourcemap: true,
  }],
}
