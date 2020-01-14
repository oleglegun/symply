const path = require('path')
const fs = require('fs')
const { scanFiles } = require('./fs-helpers')

/**
 *
 * @param {string} templatesPath
 * @returns {Object<string, string>}
 */
function loadTemplates(templatesPath) {
    const templateFiles = scanFiles(templatesPath)

    const templates = {}

    templateFiles.forEach(template => {
        const filename = template.name
        const templateName = path.basename(filename, '.html')

        const fileContents = fs.readFileSync(path.join(process.cwd(), templatesPath, filename), {
            encoding: 'utf8',
        })

        templates[templateName] = fileContents
    })

    return templates
}

module.exports = {
    loadTemplates,
}
