import chalk from 'chalk'
import Progress from 'progress'
import configuration from './configuration'
import type PB from 'progress'

export default class ProgressBar {
    private progressBar: PB

    constructor(tasksNumber: number) {
        this.progressBar = new Progress(
            (configuration.ansiLogging ? chalk.greenBright('INFO  ') : 'INFO  ') + ':prefix :bar :postfix',
            {
                total: tasksNumber,
                complete: configuration.ansiLogging ? chalk.greenBright('▮') : '▮',
                width: 15,
                incomplete: configuration.ansiLogging ? chalk.gray('▯') : '▯',
            }
        )
    }

    public tick(barPrefix?: string, barPostfix?: string): void {
        this.progressBar.tick({
            prefix: barPrefix || '',
            postfix: barPostfix || '',
        })
    }
}
