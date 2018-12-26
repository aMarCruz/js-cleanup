
export = cleanup

declare function cleanup (
  source: string,
  file?: string,
  options?: cleanup.Options
): cleanup.Result

// tslint:disable-next-line:no-namespace
declare namespace cleanup {

  interface Options {
    /**
     * Determinates which comments must be preserved.
     * @default ['some']
     */
    comments?: string | RegExp | Array<string | RegExp>
    /**
     * Determinates if the content of the comments that are preserved should
     * be compacted.
     * @default true
     */
    compactComments?: boolean
    /**
     * Maximum number of successive empty lines to be preserved.
     * @default 0
     */
    maxEmptyLines?: number
    /**
     * Type of line-endings for normalization.
     * @default 'unix'
     */
    lineEndings?: 'unix' | 'mac' | 'win'
    /**
     * Should generate sourcemap?
     * @default true
     */
    sourcemap?: boolean
    /**
     * Sourcemap options
     */
    sourcemapOptions?: {
      includeContent?: boolean
      inlineMap?: boolean
      hires?: boolean
    }
  }

  interface Result {
    code: string
    map?: import('magic-string').SourceMap | null
  }
}
