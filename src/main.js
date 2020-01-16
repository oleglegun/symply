const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const config = require('./config')
const { loadPartials } = require('./partials')
const { loadViews } = require('./views')
const { loadTemplates } = require('./templates')
const strings = require('./strings')
const { scanFiles, isFileExtensionValid, getFileContents, createFileIfNotExists, createDirectoryIfNotExists } = require('./fs-helpers')

const Handlebars = require('handlebars')

const CONFIGURATION_FILE_NAME = 'configuration.yaml'

async function main(command) {
    command = 'init'
    switch (command) {
        case 'init':
            logger.info('Initializing project...')
            initialize()
            break
        case 'generate':
        case 'start':
            generate()
            break
        default:
            logger.log(strings.help)
    }
}

function generate() {
    /*-----------------------------------------------------------------------------
     *  Load configuration
     *----------------------------------------------------------------------------*/

    const configuration = config.getConfiguration(CONFIGURATION_FILE_NAME)

    /*-----------------------------------------------------------------------------
     *  Register partials
     *----------------------------------------------------------------------------*/

    const partials = loadPartials(configuration.PARTIALS_DIR_NAME)

    Object.keys(partials).forEach(name => {
        Handlebars.registerPartial(name, partials[name])
    })

    /*-----------------------------------------------------------------------------
     *  Load views
     *----------------------------------------------------------------------------*/

    const views = loadViews(configuration.VIEWS_DIR_NAME)
    // console.log(views)

    /*-----------------------------------------------------------------------------
     *  Register helpers
     *----------------------------------------------------------------------------*/

    if (fs.existsSync(configuration.HELPERS_FILE_NAME)) {
        const helpersPath = path.join(process.cwd(), configuration.HELPERS_FILE_NAME)
        const helpers = require(helpersPath)

        Object.keys(helpers).forEach(helperName => {
            Handlebars.registerHelper(helperName, injectViewDataDecorator(helpers[helperName], views))
        })
    }

    const allSourceFiles = scanFiles(configuration.SOURCE_DIR_NAME, false, true, true)

    const templateSourceFiles = allSourceFiles.filter(file => {
        return isFileExtensionValid(file.name, ['html'])
    })

    const otherSourceFiles = allSourceFiles.filter(file => {
        return !isFileExtensionValid(file.name, ['html'])
    })

    templateSourceFiles.forEach(file => {
        const templateContents = getFileContents(path.join(file.dirname, file.name))
        const result = Handlebars.compile(templateContents)({})
        console.log(result)
    })

    // copy other source files to the destination folder
    //

    logger.info('Generation successfully finished.')
}

function initialize() {
    /*-----------------------------------------------------------------------------
     *  Load configuration
     *----------------------------------------------------------------------------*/

    const configuration = config.getConfiguration(CONFIGURATION_FILE_NAME)

    /*-----------------------------------------------------------------------------
     *  Create system files and directories
     *----------------------------------------------------------------------------*/

    config.systemFilesToBeCreated.forEach(file => {
        const fileIsCreated = createFileIfNotExists(path.join(file.dir, file.name), file.contents)

        if (fileIsCreated) {
            logger.info('Created file ' + file.name)
        }
    })

    Object.keys(configuration)
        .filter(key => key.endsWith('DIR_NAME'))
        .forEach(dirNameKey => {
            const dirName = configuration[dirNameKey]
            const dirIsCreated = createDirectoryIfNotExists(dirName)

            if (dirIsCreated) {
                logger.info(`Created directory: ${dirName}/`)
            }
        })
}

function injectViewDataDecorator(helperFunction, views) {
    return function(context) {
        const viewName = context && context.hash && context.hash.view
        if (viewName) {
            return new Handlebars.SafeString(helperFunction(views[viewName]))
        } else {
            return new Handlebars.SafeString(helperFunction(context))
        }
    }
}

function registerHelpers() {}

module.exports = main
