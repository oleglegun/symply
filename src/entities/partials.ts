import path from 'path'
import * as filesystem from '../filesystem'
import configuration from '../configuration'
import logger from '../logger'
import chalk from 'chalk'
import _ from 'lodash'

// TODO: add support for .md and .txt formats
const SUPPORTED_PARTIAL_EXTENTION_LIST = ['.html', '.hbs']

export function load(): Symply.Partials {
    /*-----------------------------------------------------------------------------
     *  Import partials from /partials
     *----------------------------------------------------------------------------*/
    const partialsPath = configuration.getPartialsDirectoryPath()
    const partials = filesystem.scanFiles(partialsPath, true, false, true)

    // change nestes partials names to include its enclosing folder
    partials.forEach((partial) => {
        if (partial.dirname !== partialsPath) {
            const enclosingDirName = partial.dirname.replace(partialsPath + path.sep, '')
            partial.name = enclosingDirName + path.sep + partial.name
            partial.dirname = partialsPath
        }
        return partial
    })

    const result = partials.reduce<Symply.Partials>((acc, partial) => {
        const partialNameWithoutExtension = getPartialNameWithoutExtension(partial.name)

        if (acc[partialNameWithoutExtension] !== undefined) {
            logger.warning(
                `Detected partials with the same name "${partial.dirname}/${partialNameWithoutExtension}.*", but different extensions.`
            )
        } else {
            acc[partialNameWithoutExtension] = partial.contents
        }

        return acc
    }, {})

    /*-----------------------------------------------------------------------------
     *  [Module mode] Add extra partials if there are any available
     *----------------------------------------------------------------------------*/
    const shadowedPartialsList = _.intersection(Object.keys(result), Object.keys(configuration.getPartials()))
    if (shadowedPartialsList.length !== 0) {
        logger.error(`Some partials are shadowed by module configuration: ${chalk.blueBright(shadowedPartialsList)}`)
    }

    Object.assign(result, configuration.getPartials())

    if (configuration.debugOutput) {
        logger.debug('Registered partials:')
        Object.keys(result).forEach((key) => {
            logger.log(chalk.green(key))
        })
        logger.log()
    }

    return result
}

function getPartialNameWithoutExtension(fileName: string): string {
    const re = `(${SUPPORTED_PARTIAL_EXTENTION_LIST.map((ext) => '\\' + ext).join('|')})$`
    return fileName.replace(new RegExp(re), '')
}
