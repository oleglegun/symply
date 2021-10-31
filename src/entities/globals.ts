import * as filesystem from '../filesystem'
import configuration from '../configuration'
import logger from '../logger'
import flat from 'flat'
import path from 'path'
import yaml from 'js-yaml'
import chalk from 'chalk'
import _ from 'lodash'

enum GLOBALS_EXTENSION {
    JSON = '.json',
    YAML = '.yaml',
    JS = '.js',
}

export function load(): Symply.Globals {
    /*-----------------------------------------------------------------------------
     *  Import namespaced globals from /helpers
     *----------------------------------------------------------------------------*/
    const globalsPath = configuration.getGlobalsDirectoryPath()
    const globalsFileList = filesystem.scanFiles(globalsPath, true, false, true)

    // change nested helpers files names to include its enclosing folder
    globalsFileList.forEach((globalsFile) => {
        if (globalsFile.dirname !== globalsPath) {
            const enclosingDirName = globalsFile.dirname.replace(globalsPath + path.sep, '')
            globalsFile.name = enclosingDirName + path.sep + globalsFile.name
            globalsFile.dirname = globalsPath
        }
        return globalsFile
    })

    const result = globalsFileList.reduce<Symply.Globals>((acc, globalsFile) => {
        const fileNameWithExtension = globalsFile.name

        let parsedContents
        let globalsNameWithoutExtension

        switch (path.extname(fileNameWithExtension)) {
            case GLOBALS_EXTENSION.JSON:
                parsedContents = JSON.parse(globalsFile.contents)
                globalsNameWithoutExtension = getGlobalsFileNameWithoutExtension(
                    fileNameWithExtension,
                    GLOBALS_EXTENSION.JSON
                )
                break
            case GLOBALS_EXTENSION.YAML:
                parsedContents = yaml.load(globalsFile.contents)
                globalsNameWithoutExtension = getGlobalsFileNameWithoutExtension(
                    fileNameWithExtension,
                    GLOBALS_EXTENSION.YAML
                )
                break
            case GLOBALS_EXTENSION.JS:
                parsedContents = eval(globalsFile.contents)
                globalsNameWithoutExtension = getGlobalsFileNameWithoutExtension(
                    fileNameWithExtension,
                    GLOBALS_EXTENSION.JS
                )
                break
            default:
                throw new Error('Globals file type is not supported: ' + path.extname(fileNameWithExtension))
        }

        if (acc[globalsNameWithoutExtension]) {
            throw new Error(
                `Globals with the same file name, but different extensions are not supported: ${globalsNameWithoutExtension}`
            )
        }

        acc[globalsNameWithoutExtension] = parsedContents
        return acc
    }, {})

    /*-----------------------------------------------------------------------------
     *  [Module mode] Add extra globals if there are any available
     *----------------------------------------------------------------------------*/
    const shadowedGlobalsList = _.intersection(Object.keys(result), Object.keys(configuration.getGlobals()))
    if (shadowedGlobalsList.length !== 0) {
        logger.warning(`Some globals are shadowed by module configuration: ${chalk.blueBright(shadowedGlobalsList)}`)
    }

    Object.assign(result, configuration.getGlobals())

    if (configuration.debugOutput) {
        logger.debug('Registered globals:')
        logger.log(flat.flatten(result, { maxDepth: 1 }))
        logger.log()
    }

    return result
}

function getGlobalsFileNameWithoutExtension(fileName: string, extension: string): string {
    return fileName.replace(new RegExp(extension + '$'), '')
}
