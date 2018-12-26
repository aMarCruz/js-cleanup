import { EOL } from 'perf-regexes'

const S_LE = EOL.source

/**
 * Replaces the marker '@LE' with line-endings characters in the regex.
 * Safe to use with minifiers.
 *
 * @param re Regex to replace
 * @param flags Regex flags
 */
const safeRegex = (re: RegExp, flags?: string) =>
  RegExp(re.source.replace(/@LE/g, S_LE), flags)

export default safeRegex
