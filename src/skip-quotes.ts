import { JS_DQSTR, JS_SQSTR } from 'perf-regexes'
import makeError from './make-error'

/**
 * Searches the end of a single or double-quoted string.
 *
 * @param ctx Execution context
 * @param index Start of the string
 */
const skipQuotes = function (ctx: Context, index: number) {

  const buffer = ctx.buff
  const re = buffer[index] === '"' ? JS_DQSTR : JS_SQSTR
  re.lastIndex = index

  if (!re.exec(buffer)) {
    throw makeError(new Error(`Unclosed string.`), index)
  }

  return re.lastIndex
}

export default skipQuotes
