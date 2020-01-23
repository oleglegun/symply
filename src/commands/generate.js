const fs = require('fs')

const babel = require('@babel/core')
const babelReactPreset = require('@babel/preset-react')
const chalk = require('chalk')
const Handlebars = require('handlebars')
const ProgressBar = require('progress')
const React = require('react') // eslint-disable-line
const ReactDOMServer = require('react-dom/server')

const logger = require('../logger')
const prettier = require('prettier')
const config = require('../config')
const { loadPartials } = require('../partials')
const { loadLayouts } = require('../layouts')
const { loadViews } = require('../views')
const string = require('../strings')

const {
    scanFiles,
    isFileExtensionValid,
    getFileContents,
    createFileIfNotExists,
    clearDirectoryContents,
    copyFileAsync,
    createDirectoryAsync,
    joinAndResolvePath,
} = require('../fs-helpers')

async function generate() {
    const stats = {
        generatedFilesCount: 0,
        copiedFilesCount: 0,
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
     *  Load views, layouts and globals
     *----------------------------------------------------------------------------*/

    const views = loadViews(configuration.VIEWS_DIR_NAME)
    const globals = require(joinAndResolvePath(config.GLOBALS_FILE_NAME))
    const layouts = loadLayouts(configuration.LAYOUTS_DIR_NAME)

    /*-----------------------------------------------------------------------------
     *  Load and register helpers; Inject views
     *----------------------------------------------------------------------------*/

    if (fs.existsSync(config.HELPERS_FILE_NAME)) {
        const helpersPath = joinAndResolvePath(config.HELPERS_FILE_NAME)
        const helpersCode = getFileContents(helpersPath)
        const transpileResult = babel.transformSync(helpersCode, { presets: [babelReactPreset] })
        const transpiledHelpers = eval(transpileResult.code)

        Object.keys(transpiledHelpers).forEach(helperName => {
            const helperFunc = renderJsxToStringDecorator(transpiledHelpers[helperName])
            Handlebars.registerHelper(helperName, injectHelperContextDecorator(helperFunc, views, globals))
        })
    }

    if (!configuration.IGNORE_MISSING_PROPERTIES) {
        Handlebars.registerHelper('helperMissing', missingHelperOrPropertyHandler)
    }

    Handlebars.registerHelper('layout', layoutHelper)

    function layoutHelper(layoutName, data) {
        if (!data) {
            logger.error(`Layout name is not passed.`)
            logger.log(string.layouts.usage)
            process.exit(1)
        }

        if (!data.fn) {
            logger.error(`Layout does not support any non Key-Value parameters.`)
            logger.log(string.layouts.usage)
            process.exit(1)
        }

        if (!layouts[layoutName]) {
            logger.error(`Layout '${layoutName}' is not found in directory '${configuration.LAYOUTS_DIR_NAME}/'.`)
            process.exit(1)
        }

        return Handlebars.compile(layouts[layoutName].replace('{{}}', data.fn(this)))(
            Object.assign({}, globals, data.hash) // pass hash parameters to the layout
        )
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
     *  Initialize Progress Bar
     *----------------------------------------------------------------------------*/

    const compilationProgressBar = new ProgressBar('Compiling files: [:bar] :current/:total', {
        total: templateSourceFiles.length,
        width: 20,
        complete: chalk.yellow('■'),
        incomplete: ' ',
        clear: true,
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
            compilationProgressBar.tick()
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
        copyPromises.push(
            createDirectoryAsync(fileDir).then(() => {
                return copyFileAsync(srcFilePath, distFilePath)
            })
        )
    })

    stats.copiedFilesCount += copyPromises.length

    await Promise.all(copyPromises)

    return stats
}

function injectHelperContextDecorator(helperFunction, views, globals) {
    return function(...args) {
        const passedArgs = args.slice(0, args.length - 1)
        const data = args[args.length - 1]
        const fn = data.fn // if block helper

        const viewName = data.hash && data.hash.view

        return new Handlebars.SafeString(
            viewName
                ? helperFunction(...passedArgs, { globals, hash: data.hash, view: views[viewName], fn })
                : helperFunction(...passedArgs, { globals, hash: data.hash, fn })
        )
    }
}

function renderJsxToStringDecorator(fn) {
    return function(...args) {
        let result = fn(...args)

        if (result && typeof result !== 'string' && result.$$typeof === Symbol.for('react.element')) {
            result = ReactDOMServer.renderToStaticMarkup(result)
        }

        return result
    }
}

function missingHelperOrPropertyHandler(data) {
    Object.keys(data).forEach(item => {
        // logger.log(data)
        const message = 'Missing helper or property: ' + data.name
        logger.error(message)
        process.exit(1)
        // throw new Error(message)
    })
}

module.exports = generate
