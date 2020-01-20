const fs = require('fs')
const Handlebars = require('handlebars')
const logger = require('./logger')
const prettier = require('prettier')
const config = require('./config')
const { loadPartials } = require('./partials')
const { loadTemplates } = require('./templates')
const { loadViews } = require('./views')
const {
    scanFiles,
    isFileExtensionValid,
    getFileContents,
    createFileIfNotExists,
    clearDirectoryContents,
    copyFileAsync,
    createDirectoryAsync,
    joinAndResolvePath,
} = require('./fs-helpers')


async function generate() {
    const stats = {
        generatedFilesCount: 0,
        copiedFilesCount: 0
    }

    /*-----------------------------------------------------------------------------
     *  Load configuration
     *----------------------------------------------------------------------------*/

    const configuration = config.getConfiguration()

    /*-----------------------------------------------------------------------------
     *  Load and register partials
     *----------------------------------------------------------------------------*/

    const partials = loadPartials(configuration.PARTIALS_DIR_NAME)

    Object.keys(partials).forEach(name => {
        Handlebars.registerPartial(name, partials[name])
    })

    /*-----------------------------------------------------------------------------
     *  Load views, templates and globals
     *----------------------------------------------------------------------------*/

    const views = loadViews(configuration.VIEWS_DIR_NAME)
    const globals = require(joinAndResolvePath(config.GLOBALS_FILE_NAME))
    const templates = loadTemplates(configuration.TEMPLATES_DIR_NAME)

    /*-----------------------------------------------------------------------------
     *  Load and register helpers; Inject views
     *----------------------------------------------------------------------------*/

    if (fs.existsSync(config.HELPERS_FILE_NAME)) {
        const helpersPath = joinAndResolvePath(config.HELPERS_FILE_NAME)
        const helpers = require(helpersPath)

        Object.keys(helpers).forEach(helperName => {
            Handlebars.registerHelper(helperName, injectHelperContextDecorator(helpers[helperName], views, globals))
        })
    }

    Handlebars.registerHelper('template', injectHelperContextDecorator(templateHelper, views, globals))

    function templateHelper(templateName, data) {
        if (!templates[templateName]) {
            logger.error(`Template '${templateName}' is not found in directory '${configuration.TEMPLATES_DIR_NAME}/'.`)
            process.exit(1)
        }
        return templates[templateName].replace('{{}}', data.fn(this))
    }

    if (!configuration.IGNORE_MISSING_PROPERTIES) {
        Handlebars.registerHelper('helperMissing', missingHelperOrPropertyHandler)
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
     *  Compile templates with passing globals
     *  Format HTML output
     *  Save results to the distribution directory
     *----------------------------------------------------------------------------*/

    clearDirectoryContents(joinAndResolvePath(configuration.DISTRIBUTION_DIR_NAME))

    templateSourceFiles.forEach(file => {
        const templateContents = getFileContents(
            joinAndResolvePath(configuration.SOURCE_DIR_NAME, file.dirname, file.name)
        )

        let formattedHTML = ''

        try {
            const result = Handlebars.compile(templateContents)(globals)
            formattedHTML = prettier.format(result, { parser: 'html' })
            stats.generatedFilesCount++
        } catch (err) {
            if (err instanceof RangeError) {
                logger.error(
                    'Recursive partial structure detected. Check your partials and source files. ' +
                        'Make sure that partials are not calling each other using {{> partialName}}.'
                )
            } else {
                logger.error(err)
            }
            process.exit(1)
        }

        createFileIfNotExists(
            joinAndResolvePath(configuration.DISTRIBUTION_DIR_NAME, file.dirname, file.name),
            formattedHTML
        )
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

    stats.copiedFilesCount += copyPromises.length
    
    await Promise.all(copyPromises)

    return stats
}

/**
 *
 * @param {(...args:Object[])=> {}} helperFunction
 * @param {Object<string, string>} views
 * @param {Object} globals
 */
function injectHelperContextDecorator(helperFunction, views, globals) {
    return function(...args) {
        const passedArgs = args.slice(0, args.length - 1)
        const data = args[args.length - 1]
        const fn = data.fn // if block helper

        const viewName = data.hash && data.hash.view

        return new Handlebars.SafeString(
            viewName
                ? helperFunction(...passedArgs, { globals, params: data.hash, view: views[viewName], fn })
                : helperFunction(...passedArgs, { globals, params: data.hash, fn })
        )
    }
}

function missingHelperOrPropertyHandler(data) {
    Object.keys(data).forEach(item => {
        const message = 'Missing helper or property: ' + data.name
        logger.error(message)
        process.exit(1)
        throw new Error(message)
    })
}

module.exports = generate