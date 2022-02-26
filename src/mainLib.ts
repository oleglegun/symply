import { generate as generateCommand } from './commands/generate'
import config from './configuration'
import logger from './logger'
import chalk from 'chalk'

async function generate(configuration: SymplyConfiguration) {
    const start = Date.now()
    config.setModuleModeConfiguration(configuration)
    logger.info(chalk.magentaBright('SYMPLY::GENERATE'), chalk.greenBright('[START]'))
    await generateCommand()
    logger.info(chalk.magentaBright('SYMPLY::GENERATE'), chalk.greenBright(`[DONE in ${(Date.now() - start) / 1000}s]`))
}

module.exports = generate
