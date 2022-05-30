import chalk from 'chalk'

import { generate as generateCommand } from './commands/generate'
import config from './configuration'
import logger from './logger'

async function generate(configuration: SymplyConfiguration) {
    const start = Date.now()
    logger.info(chalk.magentaBright('SYMPLY::GENERATE'), chalk.greenBright('[START]'))

    if (Object.keys(configuration).length > 0) {
        config.mergeConfigurationAndVerify(configuration)
        logger.info(`Configuration object verified and merged.`)
    }

    const configurationFromFile = config.loadConfigurationFromConfigFile()

    if (configurationFromFile) {
        config.mergeConfigurationAndVerify(configurationFromFile)
        logger.info(`Configuration file verified and merged.`)
    }

    await generateCommand()
    
    logger.info(chalk.magentaBright('SYMPLY::GENERATE'), chalk.greenBright(`[DONE in ${(Date.now() - start) / 1000}s]`))
}

module.exports = generate
