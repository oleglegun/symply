const path = require('path')
const { scanFiles } = require('./fs-helpers')

// TODO: add support for md and txt formats
const TEMPLATE_EXTENSION = '.html'


function loadTemplates(templatesPath) {
    const templates = scanFiles(templatesPath, true, false, false)

    const result = templates.reduce((acc, template) => {
        acc[getTemplateName(template.name)] = template.contents
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
    return path.basename(fileName, TEMPLATE_EXTENSION)
}

module.exports = { loadTemplates }
