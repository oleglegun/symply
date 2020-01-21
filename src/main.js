const yargs = require('yargs')
const logger = require('./logger')
const { printLogo } = require('./logo')
const version = require('../package').version
const initialize = require('./commands/initialize')
const generate = require('./commands/generate')
const { Commands } = require('./cli-commands')

// Check for updates
require('./update-notifier')

function main() {
    printLogo(process.stdout.columns)

    try {
        yargs
            .usage('Usage: $0 <command> [option]')
            .strict()

            /*-----------------------------------------------------------------------------
             *  Init
             *----------------------------------------------------------------------------*/

            .command([Commands.INIT.name], Commands.INIT.description, {}, args => {
                logger.info('Initializing project...')
                initialize()
                logger.info('Initialization successfully done.')
            })

            /*-----------------------------------------------------------------------------
             *  Generate
             *----------------------------------------------------------------------------*/

            .command([Commands.GENERATE.name, Commands.GENERATE.alias], Commands.GENERATE.description, {}, args => {
                const start = Date.now()
                logger.info('Generating static files...')
                generate()
                    .then(stats => {
                        logger.info(
                            `Generated ${stats.generatedFilesCount} files. Copied ${stats.copiedFilesCount} files.`
                        )
                        logger.info(`Generation successfully finished in ${Date.now() - start} ms.`)
                    })
                    .catch(err => {
                        throw err
                    })
            })

            /*-----------------------------------------------------------------------------
             *  Serve
             *----------------------------------------------------------------------------*/

            .command([Commands.SERVE.name], Commands.SERVE.description, {}, args => {
                logger.info('Not implemented yet...')
            })

            /*-----------------------------------------------------------------------------
             *  Configuration
             *----------------------------------------------------------------------------*/

            .command([Commands.CONFIGURATION.name], Commands.CONFIGURATION.description, {}, args => {
                logger.info('Not implemented yet...')
            })

            /*-----------------------------------------------------------------------------
             *  Bootstrap
             *----------------------------------------------------------------------------*/
            .command([Commands.BOOTSTRAP.name], Commands.BOOTSTRAP.description, {}, args => {
                logger.info('Not implemented yet...')
            })

            /*-----------------------------------------------------------------------------
             *  Help
             *----------------------------------------------------------------------------*/

            .command([Commands.HELP.name, Commands.HELP.alias], Commands.HELP.description, {}, args => {
                logger.info('Not implemented yet...')
            })

            // disable default options '--optionName'
            .version(false)
            .help(false)

            // show help if no command is provided
            .showHelpOnFail(true)
            .epilog(`SYMPLY v${version}`)
            .demandCommand().argv
    } catch (err) {
        logger.error('Unhandled Error: ', err)
    }
}

module.exports = main
