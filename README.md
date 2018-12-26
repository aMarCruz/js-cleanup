# js-cleanup

[![npm Version][npm-badge]][npm-url]
[![License][license-badge]][license-url]
[![Build Status][build-badge]][build-url]
[![Maintainability][climate-badge]][climate-url]
[![Coverage][cover-badge]][cover-url]

Smart comment and whitespace cleaner for JavaScript-like files.

With js-cleanup you have:

* Removal of JavaScript comments through powerful filters (configurable).
* Normalization of line endings to Unix, Mac, or Windows.
* Empty lines compactation (configurable).
* Removal of trailing whitespace, preserving ES6 Template Literal Strings.
* TypeScript definitions.
* Sourcemap support.

js-cleanup is not locked to a particular JavaScript dialect and must work in any JS-like file: TypeScript, ES2019, etc, but it is more of a post-processor, so it should run at a later stage of your toolchain, after any preprocessor or transpiler.

js-cleanup requires node v6.14 or above.

**Why not Uglify?**

Uglify is a excelent *minifier* but you have little control over the results, while with js-cleanup your coding style remains intact and the removal of comments is strictly under your control.

## Install

```bash
$ npm install js-cleanup -D
# or
$ yarn add js-cleanup -D
```

## Usage

```typescript
jsCleanup(sourceCode: string, options: Options): Result;
```

### Result

The result is a plain JS object of this type:

```typescript
{
  code: string;
  map?: object | null;
}
```

Name | Description
---- | ------
code | The processed code.
map  | A raw sourcemap object, or `null` if the text did not change.<br>Undefined if `sourcemap:false`.

### Options

Type definition:

```typescript
{
  comments?: string | RegExp,
  compactComments?: boolean,
  maxEmptyLines?: 0,           // use -1 to preserve all the lines
  lineEndings?: `unix`,      // 'mac' | 'unix' | 'win'
  sourcemap?: boolean,
  sourcemapOptions: {
    includeContent?: boolean,
    inlineMap?: boolean,
    hires?: boolean,
  }
}
```

Name               | Default   | Description
------------------ | --------- | ------------
comments           | 'some'    | Filter or array of filter names and/or regexes.<br>Use "all" to keep all, or "none" to remove all the comments.
compactComments    | true      | Should js-cleanup also compact whitespace and blank lines in the preserved multiline comments?<br>Line-ending normalization is always done.
maxEmptyLines      | 0         | Maximum successive empty lines to preserve in the output.<br>Use -1 to preserve all the lines
lineEndings        | 'unix'    | Line-ending type for normalization (always done).
sourcemap          | true      | Should js-cleanup generate a sourcemap?
_sourcemapOptions_ |           |
includeContent     | false     | Include the original source text in the sourcemap?
inlineMap          | false     | Inline the sourcemap in the processed text?
hires              | true      | Should a hi-res sourcemap be generated?

_**Note:**<br>If you want to keep JSDoc comments, you should also set `compactComments: false`.<br>Since the JSDoc presentation depends on empty lines, these should be controlled by you._

## Predefined Comment Filters

Instead the special 'all' or 'none' keywords, you can use any combination of this premaded filters:

Name     | Will preserve...
-------- | -----------------
some     | Comments containing "@license", "@preserve", or starting with "!".
license  | Comments containing "@license".
eslint   | [ESLint](http://eslint.org/docs/user-guide/configuring) directives.
flow     | [Flow](https://flow.org/en/docs) directives, including [flowlint](https://flow.org/en/docs/linting/).
istanbul | [istanbul](https://github.com/gotwarlost/istanbul/blob/master/ignoring-code-for-coverage.md) ignore comments.
jsdoc    | [JSDoc](http://usejsdoc.org/) comments.
jshint   | [JSHint](http://jshint.com/docs/#inline-configuration) directives.
jslint   | [JSLint](http://www.jslint.com/help.html) directives.
sources  | [sourcemap](http://source-map.github.io/) directives (`sourceURL` and `sourceMappingURL`).
ts       | [TypeScript](http://www.typescriptlang.org/) directives, including @jsx and triple-slash.

_**Note:**<br>Since none of this filters is really accurate (js-cleanup is not a parser), they are suitable for the job without introducing greater complexity._

See the regexes in [src/predef-filters.ts](https://github.com/aMarCruz/js-cleanup/blob/master/src/predef-filters.ts)

### Custom Filters

You can set custom filters through regexes that matches the content of the comments that you want to preserve.

The string to which the regex is applied does not includes the first slash, nor the `*/` terminator of the multiline comments, so the multiline comments begins with an asterisk (`*`) and single-line comments begins with a slash (`/`).

For example, the following filters will preserve sourcemap directives and _multiline_ comments starting with a dash:

```js
  jsCleanup(code, { comments: ['sources', /^\*-/] })
```

## Support my Work

I'm a full-stack developer with more than 20 year of experience and I try to share most of my work for free and help others, but this takes a significant amount of time and effort so, if you like my work, please consider...

[<img src="https://amarcruz.github.io/images/kofi_blue.png" height="36" title="Support Me on Ko-fi" />][kofi-url]

Of course, feedback, PRs, and stars are also welcome 🙃

Thanks for your support!

## License

The [MIT License](LICENCE) (MIT)

[npm-badge]:      https://badgen.net/npm/v/js-cleanup
[npm-url]:        https://www.npmjs.com/package/js-cleanup
[license-badge]:  https://badgen.net/github/license/aMarCruz/js-cleanup
[license-url]:    https://github.com/aMarCruz/js-cleanup/blob/master/LICENSE
[build-badge]:    https://travis-ci.org/aMarCruz/js-cleanup.svg?branch=master
[build-url]:      https://travis-ci.org/aMarCruz/js-cleanup
[climate-badge]:  https://api.codeclimate.com/v1/badges/0618a24189f355bd508d/maintainability
[climate-url]:    https://codeclimate.com/github/aMarCruz/js-cleanup/maintainability
[cover-badge]:    https://codecov.io/gh/aMarCruz/js-cleanup/branch/master/graph/badge.svg
[cover-url]:      https://codecov.io/gh/aMarCruz/js-cleanup
[size-badge]:     https://badgen.net/bundlephobia/min/js-cleanup
[size-url]:       https://bundlephobia.com/result?p=js-cleanup
[kofi-url]:       https://ko-fi.com/C0C7LF7I
