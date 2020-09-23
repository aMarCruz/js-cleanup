const fs = require('fs')
// const path = require('path')

const buff = fs.readFileSync('./index.d.ts', 'utf8')
const data = buff.replace(/^\s*export\s*=\s*(?=cleanup)/m, 'export default ')

fs.writeFileSync('./esm/index.d.ts', data)
