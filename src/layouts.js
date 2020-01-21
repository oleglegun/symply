const path = require('path')
const { scanFiles } = require('./fs-helpers')

// TODO: add support for md and txt formats
const LAYOUT_EXTENSION = '.html'


function loadLayouts(layoutsPath) {
    const layouts = scanFiles(layoutsPath, true, false, false)

    const result = layouts.reduce((acc, layout) => {
        acc[getTemplateName(layout.name)] = layout.contents
        return acc
    }, {})

    return result
}

/**
 *
 * @param {string} fileName
 * @return {string}
 */
function getTemplateName(fileName) {
    return path.basename(fileName, LAYOUT_EXTENSION)
}

module.exports = { loadLayouts }
