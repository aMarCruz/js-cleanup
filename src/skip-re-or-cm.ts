import skipRegex from 'skip-regex'
import handleComment from './handle-comment'

/**
 * Handles slashes, which can initiate a regex or comment.
 *
 * @param ctx Execution context
 * @param index Position of the slash
 */
const skipReOrCm = function (ctx: Context, index: number) {
  /*
    This function is always called with an out-of-string slash, so
    if it is followed by '*' or '/' it _must be_ a comment.

    If it isn't followed by any of those characters, it could be
    a regex or a division sign, any of which skipRegex will jump.
  */
  const ch = ctx.buff[index + 1]

  if (ch === '*' || ch === '/') {
    return handleComment(ctx, index, ch)
  }

  // will returns index+1 if it is not a regex
  return skipRegex(ctx.buff, index)
}

export default skipReOrCm
