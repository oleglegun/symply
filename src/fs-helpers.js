const fs = require('fs-extra')
const path = require('path')
const promisify = require('util').promisify

/**
 * @typedef FileEntry
 * @property {string} name File name
 * @property {string} dirname Directories that lead to the file itself
 * @property {string} [contents] Contents of the file
 */

/**
 *
 * @param {string} scanPath Path name to scan
 * @param {boolean} readFileContents Read file contents into memory
 * @param {boolean} removeScanPath If true - scanPath will be removed from FileEntry.dirname.
 * @param {boolean} scanNestedDirectories
 * @returns {FileEntry[]}
 */
function scanFiles(scanPath, readFileContents, removeScanPath, scanNestedDirectories) {
    if (removeScanPath) {
        return scanFilesInDirectory(scanPath, '', readFileContents, scanNestedDirectories)
    }
    return scanFilesInDirectory(scanPath, scanPath, readFileContents, scanNestedDirectories)
}

/**
 *
 * @param {string} scanPath
 * @param {string} basePath
 * @param {boolean} readFileContents
 * @param {boolean} scanNestedDirectories
 */
function scanFilesInDirectory(scanPath, basePath, readFileContents, scanNestedDirectories) {
    const files = fs.readdirSync(scanPath)

    const result = []

    files.forEach(filename => {
        const relativePath = path.join(scanPath, filename)
        const stats = fs.statSync(relativePath)

        if (stats.isDirectory()) {
            if (scanNestedDirectories) {
                result.push(...scanFilesInDirectory(relativePath, basePath, readFileContents, true))
            }
        } else {
            let contents

            if (readFileContents) {
                contents = fs.readFileSync(relativePath, { encoding: 'utf8' })
            }

            result.push({
                name: filename,
                dirname: path.dirname(basePath ? relativePath.replace(basePath + '/', '') : relativePath),
                contents: contents,
            })
        }
    })

    return result
}

/**
 *
 * @param {string} fileName
 * @param {string[]} validExtensionsList
 */
function isFileExtensionValid(fileName, validExtensionsList) {
    if (!validExtensionsList) {
        return false
    }

    for (let i = 0; i < validExtensionsList.length; i++) {
        if (fileName.endsWith(validExtensionsList[i])) {
            return true
        }
    }
    return false
}

async function copyFileAsync(filePath, destinationPath) {
    return promisify(fs.copyFile)(filePath, destinationPath)
}

function clearDirectoryContents(directoryPath) {
    fs.emptyDirSync(directoryPath)
}

function getFileContents(filePath) {
    return fs.readFileSync(filePath, { encoding: 'utf8' })
}

/**
 *
 * @param {string} directoryPath
 *
 * @returns {boolean} Returns true if the directory is created
 */
function createDirectoryIfNotExists(directoryPath) {
    if (fs.existsSync(directoryPath)) {
        return false
    }

    fs.mkdirSync(directoryPath)
    return true
}

/**
 *
 * @param {string} filePath
 * @param {string} [contents]
 *
 * @returns {boolean} Returns true if the file is created
 */
function createFileIfNotExists(filePath, contents) {
    if (fs.existsSync(filePath)) {
        return false
    }

    fs.writeFileSync(filePath, contents, { encoding: 'utf8' })
    return true
}

module.exports = {
    scanFiles,
    isFileExtensionValid,
    getFileContents,
    copyFileAsync,
    clearDirectoryContents,
    createDirectoryIfNotExists,
    createFileIfNotExists,
}
