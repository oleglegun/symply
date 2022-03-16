import chalk from 'chalk'
import Progress from 'progress'
import type PB from 'progress'

import configuration from './configuration'

export default class ProgressBar {
    public static isRunning = false
    public static processingEntityInfo = ''

    private progressBar: PB

    constructor(tasksNumber: number) {
        ProgressBar.isRunning = true

        this.progressBar = new Progress(
            (configuration.ansiLogging ? chalk.greenBright('INFO  ') : 'INFO  ') + ':prefix :bar :postfix',
            {
                total: tasksNumber,
                complete: configuration.ansiLogging ? chalk.greenBright('▮') : '▮',
                width: 15,
                incomplete: configuration.ansiLogging ? chalk.gray('▯') : '▯',
                callback: () => {
                    ProgressBar.isRunning = false
                },
            }
        )
    }

    public tick(processingEntityName: string, barPrefix?: string, barPostfix?: string): void {
        ProgressBar.processingEntityInfo = processingEntityName

        this.progressBar.tick({
            prefix: barPrefix || '',
            postfix: barPostfix || '',
        })
    }
}
