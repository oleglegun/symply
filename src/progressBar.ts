import chalk from 'chalk'
import Progress from 'progress'
import type PB from 'progress'

import configuration from './configuration'

export default class ProgressBar {
    public static isRunning = false
    public static processingEntityInfo = ''

    private progressBar: PB
    private total: number | null = null
    private curr = 0

    constructor(tasksNumber: number) {
        ProgressBar.isRunning = true

        if (configuration.customLogger) {
            this.total = tasksNumber

            this.progressBar = {
                get complete() {
                    return this.curr >= this.total
                },
                get total() {
                    return this.total
                },
                get curr() {
                    return this.curr
                },
                interrupt(msg: string) {
                    configuration.customLogger?.log(msg)
                },
                render(tokens?: { prefix?: string; postfix?: string }) {
                    configuration.customLogger?.log(`INFO  ${tokens?.prefix} ${tokens?.postfix}`)
                },
                terminate: () => undefined,
                update: () => undefined,
                tick: (tokens?: any) => {
                    this.curr++
                    configuration.customLogger?.log(`INFO  ${tokens?.prefix} ${tokens?.postfix}`)
                },
            }
            return
        }

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

    public render(barPrefix?: string, barPostfix?: string) {
        this.progressBar.render({ prefix: barPrefix || '', postfix: barPostfix || '' })
    }

    public tick(
        /** Used for logging file path on error */
        processingEntityName: string,
        barPrefix?: string,
        barPostfix?: string
    ): void {
        ProgressBar.processingEntityInfo = processingEntityName

        this.progressBar.tick({
            prefix: barPrefix || '',
            postfix: barPostfix || '',
        })
    }
}
