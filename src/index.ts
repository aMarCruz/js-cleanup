import cleanupBuffer from './cleanup-buffer'
import createContext from './create-context'

import type { Options, Result } from '..'

/**
 * Get the options for the sourcemap.
 */
const getMapOpts = (options: Options, file: string) => {
  const opts = options.sourcemapOptions || {}

  return {
    source: file,
    includeContent: opts.includeContent === true,
    inlineMap: opts.inlineMap === true,
    hires: opts.hires !== false,
  }
}

/**
 * Creates the result.
 *
 * @param ctx Execution context
 * @param file Source filename
 * @param options User options
 */
const genChangedRes = (ctx: Context, file: string, options: Options) => {
  const mapOpts = options.sourcemap !== false && getMapOpts(options, file)
  const result: Result = {
    code: ctx.magicStr.toString(),
  }

  if (mapOpts) {
    const map = ctx.magicStr.generateMap(mapOpts)

    if (mapOpts.inlineMap) {
      result.code += `\n//# sourceMappingURL=${map.toUrl()};`
    } else {
      result.map = map
    }
  }

  return result
}

/**
 * Smart comment and whitespace cleaner for JavaScript-like files.
 *
 * @param code Source buffer
 * @param file Source filename
 * @param options User options
 */
const cleanup = function (code: string, file?: string | null, options?: Options): Result {
  options = options || {}

  const context = createContext(code, options)
  const changes = cleanupBuffer(context)

  return changes
    ? genChangedRes(context, file || '', options)
    : options.sourcemap !== false
      ? { code, map: null }
      : { code }
}

export default cleanup
