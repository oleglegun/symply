const path = require('path')
const { scanFiles } = require('./fs-helpers')

// TODO add support for yaml and js formats
// TODO add support for nested dir structure
const VIEW_EXTENSION = '.json'

/**
 * @typedef {Object<string, Object>} Views
 */

/**
 * @param {string} viewsPath
 * @return {Views}
 */
function loadViews(viewsPath) {
    const views = scanFiles(viewsPath, true, false, false)

    // console.log(partials)
    const result = views.reduce((acc, view) => {
        acc[getViewName(view.name)] = JSON.parse(view.contents)
        return acc
    }, {})

    return result
}

/**
 *
 * @param {string} fileName
 * @return {string}
 */
function getViewName(fileName) {
    return path.basename(fileName, VIEW_EXTENSION)
}

module.exports = { loadViews }
