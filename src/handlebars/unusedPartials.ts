import chalk from 'chalk'
import Handlebars from 'handlebars'
import _ from 'lodash'

import logger from '../logger'

const resolvedPartialsSet = new Set()

export function initUnusedPartialsDetector() {
    const resolvePartialFunc = Handlebars.VM.resolvePartial

    // Add decorator to internal Handlebars function
    Handlebars.VM.resolvePartial = (partial, context, options) => {
        resolvedPartialsSet.add(options.name)
        return resolvePartialFunc(partial, context, options)
    }
}

export function printUnusedPartialsMessage(allPartialsList: Symply.Partials) {
    const unusedPartialNameList = _.difference(Object.keys(allPartialsList), Array.from(resolvedPartialsSet))
    logger.debug(`Unused ${unusedPartialNameList.length} partial${unusedPartialNameList.length === 1 ? '' : 's'}:`)

    unusedPartialNameList.forEach((key) => {
        logger.logWithPadding(chalk.redBright(key))
    })
}
