/**
 * Augments the error with the position of the error into the source.
 *
 * @param err Error object
 * @param pos Absolute position into the buffer (base 0)
 */
const makeError = function (err: Error, pos: number) {
  (err as any).position = pos
  return err
}

export default makeError
