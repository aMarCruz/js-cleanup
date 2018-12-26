import cleanupBuffer from './cleanup-buffer'
import createContext from './create-context'

type UserOptions = import('..').Options
type CleanResult = import('..').Result

/**
 * Get the options for the sourcemap.
 */
const getMapOpts = (options: UserOptions, file?: string) => {
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
const genChangedRes = (ctx: Context, file: string, options: UserOptions) => {

  const mapOpts = options.sourcemap !== false && getMapOpts(options, file)
  const result: CleanResult = {
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
 * Main function.
 *
 * @param code Source buffer
 * @param file Source filename
 * @param options User options
 */
const cleanup = function (code: string, file: string, options: UserOptions): CleanResult {
  options = options || {}

  const context = createContext(code, options)
  const changes = cleanupBuffer(context)

  return changes
    ? genChangedRes(context, file, options)
    : options.sourcemap !== false
      ? { code, map: null }
      : { code }
}

export default cleanup
