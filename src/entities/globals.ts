import * as filesystem from '../filesystem'
import configuration from '../configuration'
import chalk from 'chalk'
import logger from '../logger'

export function load(): Symply.Globals {
    const globalsFilePath = filesystem.joinAndResolvePath(configuration.getGlobalsFilePath())
    if (!filesystem.existsSync(globalsFilePath)) {
        logger.warning('Configuration file', chalk.blueBright(configuration.getGlobalsFilePath()), 'is not found.')
        return configuration.getGlobals()
    }

    const result: Symply.Globals = require(globalsFilePath)

    /* [Module mode] Add extra globals if there are any available  */
    Object.assign(result, configuration.getGlobals())

    return result
}
