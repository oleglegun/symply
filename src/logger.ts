import chalk from 'chalk'
import configuration from './configuration'
import stripAnsi from 'strip-ansi'
import ProgressBar from './progressBar'

export default {
    log(...strings: string[]): void {
        ProgressBar.isRunning && console.log()
        if (configuration.ansiLogging) {
            console.log(...strings)
        } else {
            console.log(stripAnsi(strings.join(' ')))
        }
    },
    warning(...strings: string[]): void {
        if (configuration.omitWarnings) {
            return
        }

        ProgressBar.isRunning && console.log()
        if (configuration.ansiLogging) {
            console.log(chalk.yellowBright('WARN '), ...strings)
        } else {
            console.log('WARN ', stripAnsi(strings.join(' ')))
        }
    },
    info(...strings: string[]): void {
        ProgressBar.isRunning && console.log()
        if (configuration.ansiLogging) {
            console.log(chalk.greenBright('INFO '), ...strings)
        } else {
            console.log('INFO ', stripAnsi(strings.join(' ')))
        }
    },
    error(...strings: string[]): void {
        ProgressBar.isRunning && console.log()
        if (configuration.ansiLogging) {
            console.log(chalk.redBright('ERR  '), ...strings)
        } else {
            console.log('ERR  ', stripAnsi(strings.join(' ')))
        }
    },
    debug(...strings: string[]): void {
        ProgressBar.isRunning && console.log()
        if (configuration.ansiLogging) {
            console.log(chalk.yellowBright('DEBUG'), ...strings)
        } else {
            console.log('DEBUG', stripAnsi(strings.join(' ')))
        }
    },
}
