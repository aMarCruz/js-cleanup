import makeError from './make-error'
import skipES6Str from './skip-es6-str'
import skipQuotes from './skip-quotes'
import skipReOrCm from './skip-re-or-cm'
import trimLines from './trim-lines'

type SkipFn = (ctx: Context, idx: number) => number

/** Matches the last whitespace of the buffer */
const reFinalSpc = /\s+$/g

/**
 * Trims trailing spaces of the whole buffer.
 *
 * @param ctx Execution context
 * @param start Start of trainling part, can contain non-blank chars
 */
const finish = (ctx: Context) => {
  //
  // Get trailing whitespace beginning at the last start position
  reFinalSpc.lastIndex = ctx.start
  const mm = reFinalSpc.exec(ctx.buff)

  if (mm) {
    // Searches trailing spaces
    const pos = mm[0].search(/.+$/)

    // istanbul ignore else: `pos` should always be >=0
    if (~pos) {
      ctx.magicStr.overwrite(mm.index! + pos, ctx.buff.length, '')
      ctx.changes = true
    }
  }

  return ctx.changes
}

const uncloseMessage = (ctx: Context) =>
  `Unclosed ${ctx.stack.pop() === '}' ? 'bracket' : 'ES6 Template'}.`

/**
 * Handles closing brackets. It can be a regular bracket or one closing an
 * ES6 TL expression.
 *
 * @param ctx Execution context
 * @param start Position of this bracket
 */
const skipBracket = (ctx: Context, start: number) => {
  const ch = ctx.stack.pop()

  if (ch == null) {
    throw makeError(new Error('Unexpected character "}"'), start)
  }

  if (ch === '`') {
    return skipES6Str(ctx, start)
  }

  return start + 1 // skip this
}

/**
 * Pushes a regular JS bracket into the stack.
 *
 * @param ctx Execution context
 * @param index Bracket position
 */
const pushBracket = (ctx: Context, index: number) => {
  ctx.stack.push('}')
  return index + 1
}

/**
 * Functions to process the next significant character in the buffer.
 */
const skipFn: { [k: string]: SkipFn } = {
  '"': skipQuotes,
  "'": skipQuotes,
  '`': skipES6Str,
  '{': pushBracket,
  '}': skipBracket,
  '/': skipReOrCm,
}

/**
 * Main function for removal of empty lines and comments.
 *
 * @param ctx Execution context
 * @param parser Acorn parser and options
 * @returns `true` if the buffer changed.
 */
const cleanupBuffer = function (ctx: Context) {
  const re = /["'/`{}]/g

  // Don't cache buff
  let fn: SkipFn
  let mm = re.exec(ctx.buff)

  while (mm) {
    fn = skipFn[mm[0]]
    re.lastIndex = fn(ctx, mm.index)
    mm = re.exec(ctx.buff)
  }

  if (ctx.stack.length) {
    throw new Error(uncloseMessage(ctx))
  }

  trimLines(ctx, ctx.buff.length)

  return finish(ctx)
}

export default cleanupBuffer
