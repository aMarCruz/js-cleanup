/** @internal */
type MagicStr = import('magic-string').default

/** @internal */
type FilterFn = (mm: RegExpExecArray) => boolean

/** @internal */
// prettier-ignore
interface Context {
  changes: boolean        // has the buffer changed?
  buff: string            // the whole working buffer
  compact: boolean        // user's `compectComments` option
  empties: number         // user's `maxEmptyLines` option
  eolChar: string         // normalize EOLs to this char(s)
  start: number           // start of the current region to trim
  stack: string[]         // brackets stack, used by the ES6 TL handler
  maxTopLen: number       // maximum EOLs _characters_ at the start
  maxEols: string         // string with maximum possible EOLs
  magicStr: MagicStr      // MagicString instance with the current buffer
  filter: FilterFn        // comments filter function (mustRemove)
}
