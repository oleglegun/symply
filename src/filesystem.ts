import chalk from 'chalk'
import fs from 'fs-extra'
import junk from 'junk'
import path from 'path'
import { promisify } from 'util'

import logger from './logger'

export { existsSync } from 'fs'

/*-----------------------------------------------------------------------------
 * Public functions
 *----------------------------------------------------------------------------*/
export function scanFiles(
    scanPath: string,
    /** Read file contents into memory */
    readFileContents: boolean,
    /** If true - scanPath will be removed from `FileEntry.dir`. */
    removeScanPath: boolean,
    scanNestedDirectories: boolean,
    /**
     * Ignore files like: `.DS_Store`, `Thumbs.db` and etc.
     * https://github.com/sindresorhus/junk/blob/main/index.js
     *
     * Default value: `true` */
    ignoreJunkFiles = true
): FileSystem.FileEntry[] {
    if (removeScanPath) {
        return scanFilesInDirectory(scanPath, scanPath, readFileContents, scanNestedDirectories, ignoreJunkFiles)
    }
    return scanFilesInDirectory(scanPath, '', readFileContents, scanNestedDirectories, ignoreJunkFiles)
}

export function hasFileExtension(fileName: string, validExtensionsList: string[]): boolean {
    if (!validExtensionsList) {
        return false
    }

    for (let i = 0; i < validExtensionsList.length; i++) {
        if (fileName.endsWith(`.${validExtensionsList[i]}`)) {
            return true
        }
    }
    return false
}

export async function createDirectoryAsync(dirPath: string): Promise<void> {
    return fs.ensureDir(dirPath)
}

export function removeDirectory(dirPath: string) {
    fs.rmSync(dirPath, { force: true, recursive: true })
}

export function copyDirectory(srcDirPath: string, destDirPath: string) {
    fs.copySync(srcDirPath, destDirPath)
}

export function moveDirectory(srcDirPath: string, destDirPath: string) {
    fs.moveSync(srcDirPath, destDirPath)
}

export async function copyFileAsync(filePath: string, destinationFilePath: string): Promise<void> {
    return promisify(fs.copyFile)(filePath, destinationFilePath)
}

export async function copyFileToDirectoryAsync(filePath: string, destinationDirectoryPath: string): Promise<void> {
    const fileName = path.basename(filePath)
    return promisify(fs.copyFile)(filePath, path.join(destinationDirectoryPath, fileName))
}

export function copyOrMoveFilesToDirectory(
    type: 'COPY' | 'MOVE',
    srcDirPath: string,
    destDirPath: string,
    filterFunc: Symply.FileFilterFunc = () => true
): void {
    const entities = fs.readdirSync(srcDirPath, { withFileTypes: true })
    fs.ensureDirSync(destDirPath)

    for (const entity of entities) {
        const srcPath = path.join(srcDirPath, entity.name)
        const destPath = path.join(destDirPath, entity.name)

        if (entity.isFile()) {
            if (filterFunc('FILE', entity.name, path.extname(entity.name).slice(1))) {
                if (type === 'COPY') {
                    fs.copyFileSync(srcPath, destPath)
                } else {
                    moveFile(srcPath, destPath)
                }
            }
        } else if (entity.isDirectory()) {
            if (filterFunc('DIR', entity.name, '')) {
                if (type === 'COPY') {
                    copyDirectory(srcPath, destPath)
                } else {
                    moveDirectory(srcPath, destPath)
                }
            }
        } else {
            throw new Error(`File is not supported: ${entity.name}`)
        }
    }
}

export function renameFile(filePath: string, newName: string) {
    if (fs.statSync(filePath).isFile()) {
        fs.renameSync(filePath, path.join(path.dirname(filePath), newName))
    } else {
        throw new Error(`Trying to rename an invalid file: ${filePath}`)
    }
}

export function renameDirectory(dirPath: string, newName: string) {
    if (fs.statSync(dirPath).isDirectory()) {
        fs.renameSync(dirPath, path.join(path.dirname(dirPath), newName))
    } else {
        throw new Error(`Trying to rename an invalid directory: ${dirPath}`)
    }
}

/** Move file with creating directories if needed. */
export function moveFile(filePath: string, newFilePath: string) {
    fs.ensureFileSync(newFilePath)
    fs.renameSync(filePath, newFilePath)
}

function scanFilesInDirectory(
    scanPath: string,
    basePath: string,
    readFileContents: boolean,
    scanNestedDirectories: boolean,
    ignoreJunkFiles = true
): FileSystem.FileEntry[] {
    let files: string[] = []
    try {
        files = fs.readdirSync(scanPath)
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
            logger.warning('Directory', chalk.blueBright(scanPath), 'is not found.')
        }
    }

    const result: FileSystem.FileEntry[] = []

    files.forEach((filename) => {
        const relativePath = path.join(scanPath, filename)
        const stats = fs.statSync(relativePath)

        if (ignoreJunkFiles && junk.is(filename)) {
            return
        }

        if (stats.isDirectory()) {
            if (scanNestedDirectories) {
                result.push(...scanFilesInDirectory(relativePath, basePath, readFileContents, true))
            }
        } else {
            let contents = ''

            if (readFileContents) {
                contents = fs.readFileSync(relativePath, { encoding: 'utf8' })
            }

            const filePath = basePath ? relativePath.replace(basePath + path.sep, '') : relativePath

            const fp = path.parse(filePath)

            result.push({
                scanPath: path.resolve(basePath),
                name: fp.name,
                base: fp.base,
                ext: fp.ext,
                dir: fp.dir,
                path: filePath,
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

export function createFile(filePath: string, contents?: string) {
    fs.ensureFileSync(filePath)
    fs.writeFileSync(filePath, contents || '', { encoding: 'utf8' })
}

export function joinPath(...pathParts: string[]): string {
    return path.join(...pathParts)
}

export function joinAndResolvePath(...pathParts: string[]): string {
    const joinedPath = path.join(...pathParts)

    if (path.isAbsolute(joinedPath)) {
        return joinedPath
    } else {
        return path.join(process.cwd(), joinedPath)
    }
}

export function getNPMFileContents(
    /** @example "bootstrap@5.0.2-beta1/dist/js/bootstrap.bundle.min.js" */
    npmPackageAndFilePath: string
) {
    const parts = npmPackageAndFilePath.split('/')
    const [packageName, packageVersion] = parts[0].split('@')

    if (!packageName) {
        throw new Error(`NPM package name is not provided.`)
    }

    if (packageVersion !== undefined) {
        const packageJSON: { version?: string } = JSON.parse(
            getFileContents(joinAndResolvePath('.', 'node_modules', packageName, 'package.json'))
        )

        if (packageJSON.version !== packageVersion) {
            throw new Error(
                `NPM package version is incompatible. Expected: "${packageName}@${packageVersion}". Actual: "${packageName}@${packageJSON.version}".`
            )
        }
    }

    const pkgScriptPath = parts.slice(1).join('/')
    const absoluteScriptPath = joinAndResolvePath('.', 'node_modules', packageName, pkgScriptPath)

    let fileContents

    try {
        fileContents = getFileContents(absoluteScriptPath)
    } catch (err) {
        throw new Error(`NPM package file "${absoluteScriptPath}" is not found.`)
    }

    return fileContents
}
