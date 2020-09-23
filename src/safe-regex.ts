import { EOL } from 'perf-regexes'

/**
 * Replaces the marker '@LE' with line-endings characters in the regex.
 * Safe to use with minifiers.
 *
 * @param re Regex to replace
 * @param flags Regex flags
 */
const safeRegex = (re: RegExp, flags?: string) =>
  new RegExp(re.source.replace(/@LE/g, EOL.source), flags)

export default safeRegex
