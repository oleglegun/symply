/* eslint-disable */
// Module usage

// const config = require('./dist/config')

// require('./dist/src/logo').printLogo(100)

module.exports = {
    generate: async (configuration) => require('./dist/src/mainLib')(configuration),
}
