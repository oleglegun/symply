const path = require('path')
const { scanFiles } = require('./fs-helpers')

const PARTIAL_EXTENTION = '.html'

/**
 * @typedef {Object<string, string>} Partials
 */

/**
 * @returns {Partials}
 */
function loadPartials(partialsPath) {
    const partials = scanFiles(partialsPath, true, false, false)

    const result = partials.reduce((acc, partial) => {
        acc[getPartialName(partial.name)] = partial.contents
        return acc
    }, {})

    return result
}

/**
 *
 * @param {string} fileName
 * @returns {string}
 */
function getPartialName(fileName) {
    return path.basename(fileName, PARTIAL_EXTENTION)
}

module.exports = { loadPartials }
