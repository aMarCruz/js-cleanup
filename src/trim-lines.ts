import safeRegex from './safe-regex'

/**
 * Source to match consecutive whitespace that ends in a line-ending of any
 * type. The whitespace can include other line-endings.
 */
const sAllLines = safeRegex(/\s*(?:@LE)/).source

/**
 * Matches one line-endings and its leading characters.
 */
const reEachLine = safeRegex(/.*(?:@LE)/, 'g')

/**
 * Normalizes and compacts a block of blank characters to convert it into a
 * block of line-endings that do not exceed the maximum number defined by the
 * user.
 *
 * @param ctx Maximum number of *characters* for the empty lines
 * @param str Block of blank characters to search on
 * @param first This is the first block
 */
const packLines = (ctx: Context, str: string, first: boolean) => {

  // First case, no empty lines
  if (!ctx.empties) {
    return first ? '' : ctx.eolChar
  }

  // Normalize eols and discard other characters in this region
  str = str.replace(reEachLine, ctx.eolChar)

  // Second case, limit to max N lines
  if (ctx.empties > 0) {
    const limit = first ? ctx.maxTopLen : ctx.maxEols.length

    if (str.length > limit) {
      return str.substr(0, limit)
    }
  }

  // Third case is keep all the empty lines, so do nothing more
  return str
}

/**
 * Normalizes and compacts the region of consecutive whitespace.
 *
 * @param ctx Execution context
 * @param mm Regex result with the index and content to squash
 * @param end Ending of the region
 */
const squashRegion = (ctx: Context, mm: RegExpExecArray, end: number) => {

  // Get the start position and content of the region to squash.
  const start = mm.index
  const oldStr = mm[0]

  // Optimize the high frecuency case of one only normalized eol,
  // but not at start
  if (start > 0 && oldStr === ctx.eolChar) {
    return
  }

  // Compact intermediate lines, if `maxEmptyLines` is zero all blank lines
  // are removed. If it is -1 the spaces are removed, keeping the EOLs.
  const newStr = packLines(ctx, oldStr, !start)

  if (oldStr !== newStr) {
    ctx.magicStr.overwrite(start, end, newStr)
    ctx.changes = true
  }
}

/**
 * Normalizes and compacts lines in a block of text.
 *
 * @param ctx Execution context
 * @--param start Offset of the start of the region
 * @param end Ending of the region
 */
const trimLines = function (ctx: Context, end: number) {

  if (ctx.start >= end) {
    return
  }

  const buffer = ctx.buff
  const re = RegExp(sAllLines, 'g')

  re.lastIndex = ctx.start
  let mm = re.exec(buffer)

  while (mm) {

    if (mm.index >= end) {
      ctx.start = end
      return
    }

    ctx.start = re.lastIndex

    squashRegion(ctx, mm, ctx.start)

    mm = re.exec(buffer)
  }
}

export default trimLines
