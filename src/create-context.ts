import MagicString from 'magic-string'
import getFilterFn from './get-filter-fn'

import type { Options } from '..'

const getEol = (type?: string) => (type === 'win' ? '\r\n' : type === 'mac' ? '\r' : '\n')

/**
 * Creates the execution context.
 *
 * @param buffer Source text
 * @param options User options
 */
const createContext = function (buffer: string, options: Options): Context {
  //
  const eolChar = getEol(options.lineEndings)
  const empties = (options.maxEmptyLines as any) | 0
  const maxEols = empties < 0 ? '' : new Array(empties + 2).join(eolChar)

  return {
    changes: false,
    buff: buffer,
    compact: options.compactComments !== false,
    empties,
    eolChar,
    start: 0,
    stack: [],
    maxTopLen: empties >= 0 ? empties * eolChar.length : -1,
    maxEols,
    magicStr: new MagicString(buffer),
    filter: getFilterFn(options.comments),
  }
}

export default createContext
