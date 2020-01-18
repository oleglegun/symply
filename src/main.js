const fs = require('fs')
const path = require('path')
const config = require('./config')
const Handlebars = require('handlebars')
const logger = require('./logger')
const strings = require('./strings')
const { loadPartials } = require('./partials')
const { loadViews } = require('./views')
const {
    scanFiles,
    isFileExtensionValid,
    getFileContents,
    createFileIfNotExists,
    createDirectoryIfNotExists,
    clearDirectoryContents,
    copyFileAsync,
    createDirectoryAsync,
    joinAndResolvePath,
} = require('./fs-helpers')

const CONFIGURATION_FILE_NAME = 'configuration.yaml'

async function main(command) {
    command = 'generate'
    switch (command) {
        case 'init':
            logger.info('Initializing project...')
            initialize()
            break
        case 'generate':
        case 'start':
            await generate()
            break
        default:
            logger.log(strings.help)
    }
}

async function generate() {
    /*-----------------------------------------------------------------------------
     *  Load configuration
     *----------------------------------------------------------------------------*/

    const configuration = config.getConfiguration(CONFIGURATION_FILE_NAME)

    /*-----------------------------------------------------------------------------
     *  Load and register partials
     *----------------------------------------------------------------------------*/

    const partials = loadPartials(configuration.PARTIALS_DIR_NAME)

    Object.keys(partials).forEach(name => {
        Handlebars.registerPartial(name, partials[name])
    })

    /*-----------------------------------------------------------------------------
     *  Load views and globals
     *----------------------------------------------------------------------------*/

    const views = loadViews(configuration.VIEWS_DIR_NAME)
    const globals = require(path.join(process.cwd(), config.GLOBALS_FILE_NAME))

    /*-----------------------------------------------------------------------------
     *  Load and register helpers; Inject views
     *----------------------------------------------------------------------------*/

    if (fs.existsSync(config.HELPERS_FILE_NAME)) {
        const helpersPath = path.join(process.cwd(), config.HELPERS_FILE_NAME)
        const helpers = require(helpersPath)

        Object.keys(helpers).forEach(helperName => {
            Handlebars.registerHelper(helperName, injectViewDataDecorator(helpers[helperName], views))
        })
    }

    /*-----------------------------------------------------------------------------
     *  Scan source files, detect template files for processing
     *----------------------------------------------------------------------------*/

    const allSourceFiles = scanFiles(configuration.SOURCE_DIR_NAME, false, true, true)

    const templateSourceFiles = allSourceFiles.filter(file => {
        return isFileExtensionValid(file.name, ['html'])
    })

    const otherSourceFiles = allSourceFiles.filter(file => {
        return !isFileExtensionValid(file.name, ['html'])
    })

    /*-----------------------------------------------------------------------------
     *  Compile templates passing globals and save to the distribution directory
     *----------------------------------------------------------------------------*/

    clearDirectoryContents(path.join(process.cwd(), configuration.DISTRIBUTION_DIR_NAME))

    templateSourceFiles.forEach(file => {
        const templateContents = getFileContents(
            path.join(process.cwd(), configuration.SOURCE_DIR_NAME, file.dirname, file.name)
        )
        const result = Handlebars.compile(templateContents)(globals)
        if (
            !createFileIfNotExists(
                path.join(process.cwd(), configuration.DISTRIBUTION_DIR_NAME, file.dirname, file.name),
                result
            )
        ) {
            throw new Error('File already exists')
        }
    })

    /*-----------------------------------------------------------------------------
     *  Copy other source files to the distribution directory
     *----------------------------------------------------------------------------*/

    const copyPromises = []

    otherSourceFiles.forEach(file => {
        const srcFilePath = joinAndResolvePath(configuration.SOURCE_DIR_NAME, file.dirname, file.name)
        const fileDir = joinAndResolvePath(configuration.DISTRIBUTION_DIR_NAME, file.dirname)
        const distFilePath = joinAndResolvePath(configuration.DISTRIBUTION_DIR_NAME, file.dirname, file.name)
        copyPromises.push(createDirectoryAsync(fileDir).then(() => copyFileAsync(srcFilePath, distFilePath)))
    })

    await Promise.all(copyPromises)

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

module.exports = main
