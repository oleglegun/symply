import chalk from 'chalk'
import path from 'path'

import configuration from '../configuration'
import * as filesystem from '../filesystem'
import logger from '../logger'

export function load(): Symply.Helpers {
    /*-----------------------------------------------------------------------------
     *  Import namespaced helpers from `helpersDirectoryPath`
     *----------------------------------------------------------------------------*/
    const helpersPath = configuration.helpersDirectoryPath
    const helpersFileList = filesystem.scanFiles(helpersPath, true, false, true)

    const result = helpersFileList
        // change each nested helpers' file name to include its enclosing folder
        .map((fileWithHelpers) => {
            if (fileWithHelpers.dir !== helpersPath) {
                let enclosingDirName = fileWithHelpers.dir.replace(helpersPath + path.sep, '')

                if (path.sep === '\\') {
                    // Use platform-independent nested helpers file name
                    enclosingDirName = enclosingDirName.replace(/\\/g, '/')
                }

                return {
                    ...fileWithHelpers,
                    base: `${enclosingDirName}/${fileWithHelpers.base}`,
                    name: `${enclosingDirName}/${fileWithHelpers.name}`,
                    dir: helpersPath,
                }
            }

            return fileWithHelpers
        })
        .reduce<Symply.Helpers>((acc, helpersFile) => {
            if (helpersFile.name === null) {
                logger.error(`Helpers file ${chalk.blueBright(helpersFile.path)} is not supported.`)
                process.exit(1)
            }

            const helpersObj = eval(helpersFile.contents)

            for (const helperName of Object.keys(helpersObj)) {
                const helperHashKey = `${helpersFile.name}.${helperName}`
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
