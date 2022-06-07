import chalk from 'chalk'
import stripAnsi from 'strip-ansi'

import configuration from './configuration'
import ProgressBar from './progressBar'

const LOG_LEVEL_CHAR_LENGTH = 5
const LOG_LEVEL_WARNING = 'WARN'.padEnd(LOG_LEVEL_CHAR_LENGTH)
const LOG_LEVEL_INFO = 'INFO'.padEnd(LOG_LEVEL_CHAR_LENGTH)
const LOG_LEVEL_ERROR = 'ERR'.padEnd(LOG_LEVEL_CHAR_LENGTH)
const LOG_LEVEL_DEBUG = 'DEBUG'.padEnd(LOG_LEVEL_CHAR_LENGTH)
const LOG_LEVEL_PADDING = ''.padEnd(LOG_LEVEL_CHAR_LENGTH)

export default {
    log(...strings: string[]): void {
        let logger

        if (configuration.customLogger) {
            logger = configuration.customLogger
        } else {
            logger = console
            ProgressBar.isRunning && logger.log()
        }

        if (configuration.ansiLogging) {
            logger.log(strings.join(' '))
        } else {
            logger.log(stripAnsi(strings.join(' ')))
        }
    },
    logWithPadding(...strings: string[]) {
        strings
            .join(' ')
            .split('\n')
            .forEach((string) => this.log(LOG_LEVEL_PADDING, string))
    },

    warning(...strings: string[]): void {
        if (configuration.omitWarnings) {
            return
        }
        this.log(chalk.yellowBright(LOG_LEVEL_WARNING), ...strings)
    },
    info(...strings: string[]): void {
        this.log(chalk.greenBright(LOG_LEVEL_INFO), ...strings)
    },
    error(...strings: string[]): void {
        this.log(chalk.redBright(LOG_LEVEL_ERROR), ...strings)
    },
    debug(...strings: string[]): void {
        this.log(chalk.yellowBright(LOG_LEVEL_DEBUG), ...strings)
    },
}
