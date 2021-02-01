import fs from 'fs-extra'
import path from 'path'
import { promisify } from 'util'
import logger from './logger'
import chalk from 'chalk'

export { existsSync } from 'fs'

/*-----------------------------------------------------------------------------
 * Public functions
 *----------------------------------------------------------------------------*/

export function scanFiles(
    scanPath: string,
    /** Read file contents into memory */
    readFileContents: boolean,
    /** If true - scanPath will be removed from FileEntry.dirname. */
    removeScanPath: boolean,
    scanNestedDirectories: boolean
): FileSystem.FileEntry[] {
    if (removeScanPath) {
        return scanFilesInDirectory(scanPath, scanPath, readFileContents, scanNestedDirectories)
    }
    return scanFilesInDirectory(scanPath, '', readFileContents, scanNestedDirectories)
}

export function hasFileExtension(fileName: string, validExtensionsList: string[]): boolean {
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

export async function createDirectoryAsync(dirPath: string): Promise<void> {
    return fs.ensureDir(dirPath)
}

export async function copyFileAsync(filePath: string, destinationPath: string): Promise<void> {
    return promisify(fs.copyFile)(filePath, destinationPath)
}

function scanFilesInDirectory(
    scanPath: string,
    basePath: string,
    readFileContents: boolean,
    scanNestedDirectories: boolean
): FileSystem.FileEntry[] {
    let files: string[] = []
    try {
        files = fs.readdirSync(scanPath)
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.warning('Directory', chalk.blueBright(scanPath), 'is not found.')
        }
    }

    const result: FileSystem.FileEntry[] = []

    files.forEach((filename) => {
        const relativePath = path.join(scanPath, filename)
        const stats = fs.statSync(relativePath)

        if (stats.isDirectory()) {
            if (scanNestedDirectories) {
                result.push(...scanFilesInDirectory(relativePath, basePath, readFileContents, true))
            }
        } else {
            let contents = ''

            if (readFileContents) {
                contents = fs.readFileSync(relativePath, { encoding: 'utf8' })
            }

            result.push({
                name: filename,
                dirname: path.dirname(basePath ? relativePath.replace(basePath + path.sep, '') : relativePath),
                contents: contents,
            })
        }
    })

    return result
}

export function clearDirectoryContents(directoryPath: string): void {
    fs.emptyDirSync(directoryPath)
}

export function getFileContents(filePath: string): string {
    return fs.readFileSync(filePath, { encoding: 'utf8' })
}

export function createDirectoryIfNotExists(directoryPath: string): boolean {
    if (fs.existsSync(directoryPath)) {
        return false
    }

    fs.mkdirSync(directoryPath)
    return true
}

export function createFileIfNotExists(filePath: string, contents?: string) {
    if (fs.existsSync(filePath)) {
        return false
    }

    fs.ensureFileSync(filePath)
}

export function createFile(filePath: string, contents?: string) {
    fs.ensureFileSync(filePath)
    fs.writeFileSync(filePath, contents || '', { encoding: 'utf8' })
}

export function joinAndResolvePath(...pathParts: string[]): string {
    const joinedPath = path.join(...pathParts)

    if (path.isAbsolute(joinedPath)) {
        return joinedPath
    } else {
        return path.join(process.cwd(), joinedPath)
    }
}
