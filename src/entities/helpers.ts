import chalk from 'chalk'
import path from 'path'

import configuration from '../configuration'
import * as filesystem from '../filesystem'
import logger from '../logger'

const HELPERS_EXTENSION = '.js'

export function load(): Symply.Helpers {
    /*-----------------------------------------------------------------------------
     *  Import namespaced helpers from `helpersDirectoryPath`
     *----------------------------------------------------------------------------*/
    const helpersPath = configuration.helpersDirectoryPath
    const helpersFileList = filesystem.scanFiles(helpersPath, true, false, true)

    // change each nested helpers' file name to include its enclosing folder
    helpersFileList.forEach((fileWithHelpers) => {
        if (fileWithHelpers.dirname !== helpersPath) {
            let enclosingDirName = fileWithHelpers.dirname.replace(helpersPath + path.sep, '')

            if (path.sep === '\\') {
                // Use platform-independent nested helpers file name
                enclosingDirName = enclosingDirName.replace(/\\/g, '/')
            }

            fileWithHelpers.name = `${enclosingDirName}/${fileWithHelpers.name}`
            fileWithHelpers.dirname = helpersPath
        }
        return fileWithHelpers
    })

    const result = helpersFileList.reduce<Symply.Helpers>((acc, helpersFile) => {
        const helpersFileNameWithoutExtension = getHelpersFileNameWithoutExtension(helpersFile.name)

        if (helpersFileNameWithoutExtension === null) {
            logger.error(`Helpers file ${chalk.blueBright(helpersFile.path)} is not supported.`)
            process.exit(1)
        }
        const helpersCode = helpersFile.contents

        const helpersObj = eval(helpersCode)

        for (const helperName of Object.keys(helpersObj)) {
            const helperHashKey = `${helpersFileNameWithoutExtension}.${helperName}`
            acc[helperHashKey] = helpersObj[helperName]
        }

        return acc
    }, {})

    /*-----------------------------------------------------------------------------
     *  [Module mode] Add extra helpers if there are any available
     *----------------------------------------------------------------------------*/
    Object.assign(result, configuration.helpers)

    if (configuration.debugOutput) {
        logger.debug('Registered helpers:')
        Object.keys(result).forEach((key) => {
            logger.logWithPadding(chalk.green(key))
        })
    }

    return result
}

function getHelpersFileNameWithoutExtension(fileName: string) {
    if (fileName.endsWith(HELPERS_EXTENSION)) {
        return fileName.replace(new RegExp(`\\${HELPERS_EXTENSION}$`), '')
    }

    return null
}
