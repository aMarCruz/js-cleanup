
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
     * Type of line-endings for normalization.
     * @default 'unix'
     */
    lineEndings?: 'unix' | 'mac' | 'win'
    /**
     * Maximum successive empty lines to preserve in the output.
     * @default 0
     */
    maxEmptyLines?: number
    /**
     * Should generate sourcemap?
     * @default true
     */
    sourcemap?: boolean
    /**
     * Sourcemap options
     */
    sourcemapOptions?: {
      /** @default false */
      includeContent?: boolean
      /** @default false */
      inlineMap?: boolean
      /** @default true */
      hires?: boolean
    }
  }

  interface Result {
    code: string
    map?: import('magic-string').SourceMap | null
  }
}
