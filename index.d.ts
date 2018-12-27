
export = cleanup

declare function cleanup (
  source: string,
  file?: string | null,
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
     * Should js-cleanup also compact whitespace and blank lines
     * in the preserved multiline comments?
     *
     * Line-ending normalization is always done.
     * @default true
     */
    compactComments?: boolean
    /**
     * Type of Line-ending for normalization.
     * @default 'unix'
     */
    lineEndings?: 'unix' | 'mac' | 'win'
    /**
     * Maximum successive empty lines to preserve in the output.
     *
     * Use a positive value, or `-1` to keep all the lines.
     * @default 0
     */
    maxEmptyLines?: number
    /**
     * Should generate a sourcemap?
     * @default true
     */
    sourcemap?: boolean
    /**
     * Sourcemap options
     */
    sourcemapOptions?: {
      /**
       * Include the original source text in the sourcemap?
       * @default false
       */
      includeContent?: boolean
      /**
       * Inline the sourcemap in the processed text?
       * @default false
       */
      inlineMap?: boolean
      /**
       * Should a hi-res sourcemap be generated?
       * @default true
       */
      hires?: boolean
    }
  }

  interface Result {
    code: string
    map?: import('magic-string').SourceMap | null
  }
}
