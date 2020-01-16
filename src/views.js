const path = require('path')
const { scanFiles } = require('./fs-helpers')

const VIEW_EXTENSION = '.json'

/**
 * @typedef {Object<string, Object>} Views
 */

/**
 * @returns {Views}
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
 * @returns {string}
 */
function getViewName(fileName) {
    return path.basename(fileName, VIEW_EXTENSION)
}

module.exports = {  loadViews }
