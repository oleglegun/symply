import chalk from 'chalk'
import path from 'path'

import configuration from '../configuration'
import * as filesystem from '../filesystem'
import logger from '../logger'

const HELPERS_EXTENSION = '.js'

export function load(): Symply.Helpers {
    /*-----------------------------------------------------------------------------
     *  Import namespaced helpers from `helpers` directory
     *----------------------------------------------------------------------------*/
    const helpersPath = configuration.getHelpersDirectoryPath()
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
        const helpersCode = helpersFile.contents

        const helpersObj = eval(helpersCode)

        Object.keys(helpersObj).forEach((helperName) => {
            const helperHashKey = `${getHelpersFileName(helpersFile.name)}.${helperName}`
            acc[helperHashKey] = helpersObj[helperName]
        })
        return acc
    }, {})

    /*-----------------------------------------------------------------------------
     *  [Module mode] Add extra helpers if there are any available
     *----------------------------------------------------------------------------*/
    Object.assign(result, configuration.getHelpers())

    if (configuration.debugOutput) {
        logger.debug('Registered helpers:')
        Object.keys(result).forEach((key) => {
            logger.log(chalk.green(key))
        })
        logger.log()
    }

    return result
}

function getHelpersFileName(fileName: string): string {
    return fileName.replace(new RegExp(`\\${HELPERS_EXTENSION}$`), '')
}
