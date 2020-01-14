const fs = require('fs')
const path = require('path')

/**
 * @typedef FileEntry
 * @property {string} name File name
 * @property {string} dirname Directories that lead to the file itself
 */

/**
 *
 * @param {string} scanPath Path name to scan
 * @param {boolean} [removeScanPath] If true - scanPath will be removed from FileEntry.dirname
 * @returns {FileEntry[]}
 */
function scanFiles(scanPath, removeScanPath) {
    if (removeScanPath) {
        return scanFilesInDirectory(scanPath, '')
    }
    return scanFilesInDirectory(scanPath, scanPath)
}

function scanFilesInDirectory(scanPath, basePath) {
    const files = fs.readdirSync(scanPath)

    const result = []

    files.forEach(filename => {
        const relativePath = path.join(scanPath, filename)
        const stats = fs.statSync(relativePath)

        if (stats.isDirectory()) {
            result.push(...scanFilesInDirectory(relativePath, basePath))
        } else {
            result.push({
                name: filename,
                dirname: path.dirname(basePath ? relativePath.replace(basePath + '/', '') : relativePath),
            })
        }
    })

    return result
}

module.exports = {
    scanFiles,
}
