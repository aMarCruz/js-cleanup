const path = require('path')

const testDir = path.resolve(__dirname, '..')

/**
 * Join paths relative to /test
 * @param {string} folder -
 * @param {string} name -
 */
const joinPath = function (folder, name) {
  const file = path.join(testDir, folder, name).replace(/\\/g, '/')

  return !path.extname(file) ? file + '.js' : file
}

module.exports = joinPath
