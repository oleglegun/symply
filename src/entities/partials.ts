import chalk from 'chalk'
import Handlebars from 'handlebars'
import _ from 'lodash'
import path from 'path'

import configuration from '../configuration'
import * as filesystem from '../filesystem'
import logger from '../logger'

enum PARTIAL_EXTENSION {
    HTML = '.html',
    HANDLEBARS = '.hbs',
    SVG = '.svg',
    MARKDOWN = '.md',
    TXT = '.txt',
    JS = '.js',
}

const resolvedPartialsSet = new Set()

export function load(): Symply.Partials {
    /*-----------------------------------------------------------------------------
     *  Import partials from `partialsDirectoryPath`
     *----------------------------------------------------------------------------*/
    const partialsPath = configuration.partialsDirectoryPath
    const partials = filesystem.scanFiles(partialsPath, true, false, true)

    const result = partials
        // change nestes partials names to include its enclosing folder
        .map((partial) => {
            if (partial.dir !== partialsPath) {
                let enclosingDirName = partial.dir.replace(partialsPath + path.sep, '')

                if (path.sep === '\\') {
                    // Use platform-independent nested partial file name
                    enclosingDirName = enclosingDirName.replace(/\\/g, '/')
                }

                return {
                    ...partial,
                    base: `${enclosingDirName}/${partial.base}`,
                    name: `${enclosingDirName}/${partial.name}`,
                    dir: partialsPath,
                }
            }

            return partial
        })
        .reduce<Symply.Partials>((acc, partial) => {
            let parsedContents

            switch (partial.ext) {
                case PARTIAL_EXTENSION.HTML:
                case PARTIAL_EXTENSION.HANDLEBARS:
                case PARTIAL_EXTENSION.SVG:
                case PARTIAL_EXTENSION.JS:
                case PARTIAL_EXTENSION.TXT:
                    parsedContents = partial.contents
                    break
                case PARTIAL_EXTENSION.MARKDOWN:
                    //TODO add markdown parser
                    parsedContents = partial.contents
                    break
                default:
                    logger.error(`Partial file ${chalk.blueBright(partial.path)} is not supported.`)
                    process.exit(1)
            }

            if (acc[partial.name] !== undefined) {
                const duplicatePartialPath = `${partial.dir}${path.sep}${partial.name}.*`

                logger.warning(
                    `Detected partials with the same name ${chalk.blueBright(
                        duplicatePartialPath
                    )}, but different extensions.`
                )
            } else {
                acc[partial.name] = parsedContents
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

export function initUnusedPartialsDetector() {
    const resolvePartialFunc = Handlebars.VM.resolvePartial

    // Decorate internal Handlebars function
    Handlebars.VM.resolvePartial = (partial, context, options) => {
        resolvedPartialsSet.add(options.name)
        return resolvePartialFunc(partial, context, options)
    }
}

export function printUnusedPartialsList(allPartialsList: Symply.Partials) {
    const unusedPartialNameList = _.difference(Object.keys(allPartialsList), Array.from(resolvedPartialsSet))
    logger.debug(`Unused ${unusedPartialNameList.length} partial${unusedPartialNameList.length === 1 ? '' : 's'}:`)

    unusedPartialNameList.forEach((key) => {
        logger.logWithPadding(chalk.redBright(key))
    })
}
