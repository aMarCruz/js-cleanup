/**
 * Predefined filters.
 *
 * None of this is really accurate, js-cleanup is not a parser, but they
 * are suitable for the job without introducing more complexity.
 */
const predefFilters: { [k: string]: RegExp } = {
  /* eslint-disable unicorn/better-regex */

  // The default filter
  some: /^.!|@(?:license|preserve)\b/,

  // Only license
  license: /@license\b/,

  // http://eslint.org/docs/user-guide/configuring
  eslint: /^\*\s*(?:eslint(?:\s|-env\s|-(?:en|dis)able(?:\s|$))|global\s)|^.[\t ]*eslint-disable-(?:next-)?line(?:[\t ]|$)/,

  // https://flow.org/en/docs
  flow: /^.\s*(?:@flow(?:\s|$)|\$Flow[A-Za-z]|flowlint\s|flowlint(?:-next)?-line[\t ])|^\*[\t ]*(?:flow-include\s|:{1,3}[^:])/,

  // https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md
  istanbul: /^.\s*istanbul\s+ignore\s+[a-z]/,

  // http://usejsdoc.org
  jsdoc: /^\*\*[\S\s]*@[a-z]{2}/,

  // http://jshint.com/docs/#inline-configuration
  jshint: /^.\s*(?:jshint|globals|exported)\s/,

  // http://www.jslint.com/help.html
  jslint: /^.(?:jslint|global|property)\s\S/,

  // http://www.html5rocks.com/en/tutorials/developertools/sourcemaps
  sources: /^.[#@][\t ]+source(?:Mapping)?URL=/,

  // http://www.typescriptlang.org/docs
  ts: /^(?:\/\/\s*<(?:reference\s|amd-[a-z]).*>|.\s*@(?:jsx[\t ]|ts-(?:check|nocheck|ignore|expect-error)\b))/,

  // http://www.typescriptlang.org/docs/handbook/triple-slash-directives.html
  ts3s: /^\/\/\s*<(?:reference\s|amd-[a-z]).*>/,
}

export default predefFilters
