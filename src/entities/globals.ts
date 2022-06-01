import chalk from 'chalk'
import flat from 'flat'
import yaml from 'js-yaml'
import _ from 'lodash'
import path from 'path'

import configuration from '../configuration'
import * as filesystem from '../filesystem'
import logger from '../logger'

enum GLOBALS_EXTENSION {
    JSON = '.json',
    YAML = '.yaml',
    JS = '.js',
}

export function load(): Symply.Globals {
    /*-----------------------------------------------------------------------------
     *  Import namespaced globals from `globalsDirectoryPath`
     *----------------------------------------------------------------------------*/
    const globalsPath = configuration.globalsDirectoryPath
    const globalsFileList = filesystem.scanFiles(globalsPath, true, false, true)

    const result = globalsFileList
        // change nested globals files names to include its enclosing folder
        .map((globalsFile) => {
            if (globalsFile.dir !== globalsPath) {
                let enclosingDirName = globalsFile.dir.replace(globalsPath + path.sep, '')

                if (path.sep === '\\') {
                    // Use platform-independent nested globals file name
                    enclosingDirName = enclosingDirName.replace(/\\/g, '/')
                }

                return {
                    ...globalsFile,
                    base: `${enclosingDirName}/${globalsFile.base}`,
                    name: `${enclosingDirName}/${globalsFile.name}`,
                    dir: globalsPath,
                }
            }

            return globalsFile
        })
        .reduce<Symply.Globals>((acc, globalsFile) => {
            let parsedContents

            switch (globalsFile.ext) {
                case GLOBALS_EXTENSION.JSON:
                    parsedContents = JSON.parse(globalsFile.contents)
                    break
                case GLOBALS_EXTENSION.YAML:
                    parsedContents = yaml.load(globalsFile.contents)
                    break
                case GLOBALS_EXTENSION.JS:
                    parsedContents = eval(globalsFile.contents)
                    break
                default:
                    throw new Error('Globals file type is not supported: ' + globalsFile.ext)
            }

            if (acc[globalsFile.name]) {
                throw new Error(
                    `Globals with the same file name, but different extensions are not supported: ${globalsFile.name}`
                )
            }

            acc[globalsFile.name] = parsedContents
            return acc
        }, {})

    /*-----------------------------------------------------------------------------
     *  [Module mode] Add extra globals if there are any available
     *----------------------------------------------------------------------------*/
    const shadowedGlobalsList = _.intersection(Object.keys(result), Object.keys(configuration.globals))

    if (shadowedGlobalsList.length !== 0) {
        logger.error(`Some globals are shadowed by module configuration: ${chalk.blueBright(shadowedGlobalsList)}`)
    }

    Object.assign(result, configuration.globals)

    if (configuration.debugOutput) {
        logger.debug('Registered globals:')
        logger.log(flat.flatten(result, { maxDepth: 1 }))
    }

    return result
}
