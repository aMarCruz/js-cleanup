// @ts-check
/*
  Rollup configuration.
*/
import nodeResolve from '@rollup/plugin-node-resolve'
import typescript from '@wessberg/rollup-plugin-ts'
import pkg from './package.json'

const external = require('module').builtinModules.concat(
  Object.keys(pkg.dependencies),
  Object.keys(pkg.devDependencies)
)

const banner = `/**
 * js-cleanup v${pkg.version}
 * @author aMarCruz
 * @license MIT
 */
/* eslint-disable */`

export default {
  input: pkg.source,
  external,
  plugins: [typescript(), nodeResolve()],
  output: [
    {
      banner,
      file: pkg.main,
      format: 'cjs',
      interop: false,
      preferConst: true,
      sourcemap: true,
      exports: 'auto',
    },
    {
      banner,
      file: pkg.module,
      format: 'es',
      preferConst: true,
      sourcemap: true,
      exports: 'default',
    },
  ],
}
