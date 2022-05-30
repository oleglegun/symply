import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'

import configuration from '../configuration'
import * as filesystem from '../filesystem'
import logger from '../logger'

const SUPPORTED_PARTIAL_EXTENTION_LIST = ['.html', '.hbs', '.svg', '.md', '.txt']

export function load(): Symply.Partials {
    /*-----------------------------------------------------------------------------
     *  Import partials from `partialsDirectoryPath`
     *----------------------------------------------------------------------------*/
    const partialsPath = configuration.partialsDirectoryPath
    const partials = filesystem.scanFiles(partialsPath, true, false, true)

    // change nestes partials names to include its enclosing folder
    partials.forEach((partial) => {
        if (partial.dirname !== partialsPath) {
            let enclosingDirName = partial.dirname.replace(partialsPath + path.sep, '')

            if (path.sep === '\\') {
                // Use platform-independent nested partial file name
                enclosingDirName = enclosingDirName.replace(/\\/g, '/')
            }

            partial.name = `${enclosingDirName}/${partial.name}`
            partial.dirname = partialsPath
        }

        return partial
    })

    const result = partials.reduce<Symply.Partials>((acc, partial) => {
        const partialNameWithoutExtension = getPartialNameWithoutExtension(partial.name)

        if (partialNameWithoutExtension === null) {
            logger.error(`Partial file ${chalk.blueBright(partial.path)} is not supported.`)
            process.exit(1)
        }

        if (acc[partialNameWithoutExtension] !== undefined) {
            const duplicatePartialPath = `${partial.dirname}${path.sep}${partialNameWithoutExtension}.*`

            logger.warning(
                `Detected partials with the same name ${chalk.blueBright(
                    duplicatePartialPath
                )}, but different extensions.`
            )
        } else {
            acc[partialNameWithoutExtension] = partial.contents
        }

        return acc
    }, {})

    /*-----------------------------------------------------------------------------
     *  [Module mode] Add extra partials if there are any available
     *----------------------------------------------------------------------------*/
    const shadowedPartialsList = _.intersection(Object.keys(result), Object.keys(configuration.partials))
    if (shadowedPartialsList.length !== 0) {
        logger.error(`Some partials are shadowed by module configuration: ${chalk.blueBright(shadowedPartialsList)}`)
    }

    Object.assign(result, configuration.partials)

    if (configuration.debugOutput) {
        logger.debug(`Registered ${partials.length} partial${partials.length === 1 ? '' : 's'}:`)
        Object.keys(result).forEach((key) => {
            logger.logWithPadding(chalk.green(key))
        })
    }

    return result
}

function getPartialNameWithoutExtension(fileName: string) {
    if (SUPPORTED_PARTIAL_EXTENTION_LIST.some((supportedExtension) => fileName.endsWith(supportedExtension))) {
        const re = `(${SUPPORTED_PARTIAL_EXTENTION_LIST.map((ext) => '\\' + ext).join('|')})$`
        return fileName.replace(new RegExp(re), '')
    }

    return null
}
