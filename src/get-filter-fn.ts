import predefFilters from './predef-filters'

const hasOwnProp = Object.prototype.hasOwnProperty

/**
 * Parses an individual filter.
 *
 * @param filter Filter
 */
const parseEach = (filter: string | RegExp) => {
  //
  if (filter instanceof RegExp) {
    return filter
  }

  if (hasOwnProp.call(predefFilters, filter)) {
    return predefFilters[filter]
  }

  throw new Error(`cleanup: unknown comment filter: "${filter}"`)
}

/**
 * Makes the regexes to filter out comments.
 *
 * @param list User filters
 */
const makeFilters = (list?: string | RegExp | (string | RegExp)[]) => {
  //
  if (list == null) {
    return [predefFilters.some]
  }

  const filters = Array.isArray(list) ? list : [list]

  if (~filters.indexOf('all')) {
    return true
  }

  if (~filters.indexOf('none')) {
    return false
  }

  return filters.map(parseEach)
}

/**
 * Return a function that determinates if a comment must be removed.
 *
 * @param list Default or defined comment filters
 */
const getFilterFn = function (list?: string | RegExp | (string | RegExp)[]) {
  const filters = makeFilters(list)

  if (filters === true) {
    return () => false
  }

  if (filters === false) {
    return () => true
  }

  /**
   * Determinates if a comment must be preserved.
   *
   * @param ctx Execution context
   * @param start Start of the whole comment
   * @param end End of the whole comment
   */
  const mustRemove = function (mm: RegExpExecArray) {
    let content = mm[0]

    // Extract the content, including the `isBlock` indicator
    content = content[1] === '*' ? content.slice(1, -2) : content.slice(1)

    // Search a filter that matches the content
    return !filters.some(filter => filter.test(content))
  }

  return mustRemove
}

export default getFilterFn
