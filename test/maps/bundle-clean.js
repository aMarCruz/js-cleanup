const __TEST = 1
function preproc (code) {
  return code
}
function postproc (code) {
  return code
}
export default function jspp (options = {}) {
  const filter = id => id || __TEST
  return {
    name: 'jspp',
    run(code, id) {
      if (typeof code != 'string') {
        code = '__CODE'
      }
      if (!filter(id)) {
        return null
      }
      return postproc(preproc(code, options))
    }
  }
}
