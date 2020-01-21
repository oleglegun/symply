const path = require('path')
const yaml = require('js-yaml')
const { scanFiles } = require('./fs-helpers')

// TODO add support for nested dir structure
const SUPPORTED_VIEW_EXTENSION = {
    JSON: '.json',
    YAML: '.yaml',
    JS: '.js',
}

/**
 * @typedef {Object<string, Object>} Views
 */

/**
 * @param {string} viewsPath
 * @return {Views}
 */
function loadViews(viewsPath) {
    const views = scanFiles(viewsPath, true, false, false)

    let parsedContents
    let viewName

    const result = views.reduce((acc, view) => {
        const fileName = view.name

        switch (path.extname(fileName)) {
            case SUPPORTED_VIEW_EXTENSION.JSON:
                parsedContents = JSON.parse(view.contents)
                viewName = getViewName(fileName, SUPPORTED_VIEW_EXTENSION.JSON)
                break
            case SUPPORTED_VIEW_EXTENSION.YAML:
                parsedContents = yaml.safeLoad(view.contents)
                viewName = getViewName(fileName, SUPPORTED_VIEW_EXTENSION.YAML)
                break
            case SUPPORTED_VIEW_EXTENSION.JS:
                parsedContents = eval(view.contents)
                viewName = getViewName(fileName, SUPPORTED_VIEW_EXTENSION.JS)
                break
            default:
                throw new Error('View file type is not supported: ' + path.extname(fileName))
        }
        if (acc[viewName]) {
            throw new Error('Views with the same file name, but different extensions are not supported.')
        }

        acc[viewName] = parsedContents

        return acc
    }, {})

    return result
}

/**
 *
 * @param {string} fileName
 * @param {string} extension
 * @return {string}
 */
function getViewName(fileName, extension) {
    return path.basename(fileName, extension)
}

module.exports = { loadViews }
