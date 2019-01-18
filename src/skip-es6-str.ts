import makeError from './make-error'
import trimLines from './trim-lines'

/** Flag for ES6 TL in the stack */
const ES6_BQ = '`'

/**
 * Searches the next backtick that signals the end of the ES6 Template Literal
 * or the sequence "${" that starts a sub-expression, skipping any escaped
 * character.
 *
 * @param buffer Whole code
 * @param start Starting position of the template
 * @param stack To save nested ES6 TL positions
 * @returns The end of the string (-1 if not found).
 */
const skipTL = (buffer: string, start: number, stack: string[]) => {

  // Only three characters are of interest to this function
  const re = /[`$\\]/g

  // `start` points to the a backtick inside `code`
  re.lastIndex = start + 1

  while (re.exec(buffer)) {
    const pos = re.lastIndex
    const c = buffer[pos - 1]

    if (c === ES6_BQ) {
      return pos                          // found the end of this TL
    }

    /*
      If a sub-expression is found, push a backtick in the stack.
      When the calling loop finds a closing brace and see the backtick,
      it will restore the ES6 TL parsing mode.
    */
    if (c === '$') {
      if (buffer[pos] === '{') {
        stack.push(ES6_BQ)
        return pos + 1
      }
      if (buffer[pos] === '`') {
        return pos + 1
      }
    }

    // This is an escaped char, skip it
    re.lastIndex = pos + 1
  }

  throw makeError(new Error('Unclosed ES6 Template Literal.'), start)
}

/**
 * Handles ES6 TL.
 *
 * Line trimming is done here and the position is shifted so that trimLines
 * does not touch the literals.
 *
 * @param ctx Execution context
 * @param start Start of the ES6 TL
 */
const skipES6Str = function (ctx: Context, start: number) {

  trimLines(ctx, start)

  ctx.start = skipTL(ctx.buff, start, ctx.stack)

  return ctx.start
}

export default skipES6Str
