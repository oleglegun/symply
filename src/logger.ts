import chalk from 'chalk'
import stripAnsi from 'strip-ansi'

import configuration from './configuration'
import ProgressBar from './progressBar'

export default {
    log(...strings: string[]): void {
        const logger = configuration.customLogger ?? console
        ProgressBar.isRunning && logger.log()

        if (configuration.ansiLogging) {
            logger.log(strings.join(' '))
        } else {
            logger.log(stripAnsi(strings.join(' ')))
        }
    },
    logWithPadding(...strings: string[]) {
        this.log('     ', ...strings)
    },
    warning(...strings: string[]): void {
        if (configuration.omitWarnings) {
            return
        }
        this.log(chalk.yellowBright('WARN '), ...strings)
    },
    info(...strings: string[]): void {
        this.log(chalk.greenBright('INFO '), ...strings)
    },
    error(...strings: string[]): void {
        this.log(chalk.redBright('ERR  '), ...strings)
    },
    debug(...strings: string[]): void {
        this.log(chalk.yellowBright('DEBUG'), ...strings)
    },
}
