import { EOL, JS_MLCMNT, JS_SLCMNT } from 'perf-regexes'
import makeError from './make-error'
import trimLines from './trim-lines'

/**
 * Matches non-line-endings characters
 */
const R_NOEOLS = /[^\n\r\u2028\u2029]+/g

/**
 * By using premaked string of spaces, blankBlock is faster than
 * block.replace(/[^ \n]+/, ' ').
 */
const spaces = new Array(150).join(' ')

/**
 * Helper function to convert characters in spaces, except EOLs.
 * @param str Block to convert
 */
const blankBlock = (str: string) => {
  const len = str.length
  str = spaces

  while (str.length < len) {
    str += spaces
  }

  return str.slice(0, len)
}

/**
 * Returns `true` if a comment must be removed due there's non-blank
 * content after it in the same line.
 */
const removeThis = (ctx: Context, end: number) => {
  const buffer = ctx.buff
  let ch

  // Find the next non-space to the right, or the end of the buffer.
  while (end < buffer.length) {
    ch = buffer[end]

    // Found an EOL, let the caller handle this
    if (ch === '\n' || ch === '\r') {
      return false
    }

    // Found non-space, we need remove this comment
    if (/\S/.test(ch)) {
      return true
    }

    end++
  }

  return false
}

/**
 * Handle comments that must be removed.
 *
 * If the comment is multi-line and does not ends with an EOL, remove it
 * here because the caller will not do that.
 *
 * Other comments are only replaced with blanks, except its line-endings,
 * and either `trimLines` or `finalTrim` will remove it in a later step.
 */
const rmComment = (ctx: Context, start: number, end: number) => {
  const buffer = ctx.buff

  // Multiline comments, if they are not isolated, should be removed here,
  // since trimLines will not see it.
  if (buffer[start + 1] === '*' && removeThis(ctx, end)) {
    ctx.magicStr.overwrite(start, end, '')
    ctx.changes = true
  }

  // Replace the comment with spaces, except EOLs, so in a future step
  // trimLines can normalize and compact it in a right way.
  ctx.buff =
    buffer.substr(0, start) +
    buffer.slice(start, end).replace(R_NOEOLS, blankBlock) +
    buffer.substr(end)
}

/**
 * Called when the option `compactComments` is `false`, preserves the
 * whitespace within the comment, only normalizing line-ending.
 *
 * @param ctx Execution context
 * @param start Start of the comment
 * @param end Ending position of the comment
 */
const normalize = (ctx: Context, start: number, end: number) => {
  //
  // Trim the previous block up to the beginning of this comment
  trimLines(ctx, start)

  // Only normalize the line-endings within the comment
  const str = ctx.buff.slice(start, end).replace(EOL, ctx.eolChar)
  ctx.magicStr.overwrite(start, end, str)
  ctx.changes = true

  // ...and adjust `start` to prevent trimLines from touching it.
  ctx.start = end
}

/** Matches comments */
const reCmnt = {
  '*': JS_MLCMNT,
  '/': JS_SLCMNT,
}

/**
 * Comment handler.
 *
 * If compactComments is `false`, line compaction must be done here
 * and update the start position in the execution context.
 *
 * @param ctx Execution context
 * @param start Start of this comment
 * @param ch Type of this comment, either '*' or '/'
 */
const handleComment = function (ctx: Context, start: number, ch: '*' | '/') {
  //
  const re = reCmnt[ch]
  re.lastIndex = start

  const mm = re.exec(ctx.buff)

  if (mm == null || mm.index !== start) {
    throw makeError(new Error(`Unclosed comment.`), start)
  }

  const end = re.lastIndex

  if (ctx.filter(mm)) {
    // This comment must be removed or replaced by spaces.
    rmComment(ctx, start, end)
    //
  } else if (!ctx.compact && ch === '*') {
    // Preserve whitespace of this comment, only normalize lines.
    normalize(ctx, start, end)
  }

  return end // trimLines will preserve and compact this comment
}

export default handleComment
