import chalk from 'chalk'
import Handlebars from 'handlebars'
import { minify } from 'html-minifier'
import _ from 'lodash'
import minimatch from 'minimatch'
import path from 'path'
import prettier from 'prettier'
import sass from 'sass'

import * as blockHelpers from '../blockHelpers'
import configuration from '../configuration'
import * as Actions from '../entities/actions'
import * as Globals from '../entities/globals'
import * as Helpers from '../entities/helpers'
import * as Partials from '../entities/partials'
import * as filesystem from '../filesystem'
import logger from '../logger'
import ProgressBar from '../progressBar'

export async function generate(): Promise<Symply.GenerationStats> {
    const stats: Symply.GenerationStats = {
        generatedFilesCount: 0,
        copiedFilesCount: 0,
    }

    await Actions.runPreBuildAsync(configuration.getActions().preBuild?.filter((action) => !action.skip))
    const globals = Globals.load()
    const partials = Partials.load()

    const { scssSourceFiles, cssSourceFiles, htmlSourceFiles, hbsSourceFiles, jsSourceFiles, otherSourceFiles } =
        scanSourceFiles()

    registerPartials(partials)

    registerMissingPropertyHelper()

    // Block helpers registration
    blockHelpers.if_eq()
    blockHelpers.if_ne()
    blockHelpers.if_gt()
    blockHelpers.if_ge()
    blockHelpers.if_lt()
    blockHelpers.if_le()
    blockHelpers.if_and()
    blockHelpers.if_or()
    blockHelpers.if_xor()

    injectGlobalsToHelpers(globals)

    clearDistributionDirectoryIfNeeded()

    const compiledSassSourceFiles = compileSassAndCopyToDistributionDirectory(scssSourceFiles, stats)

    const cssSourceFilesWithContents = loadSourceFilesContents(cssSourceFiles)
    const jsSourceFilesWithContents = loadSourceFilesContents(jsSourceFiles)

    registerEmbeddedStylesInjectorHelper([...compiledSassSourceFiles, ...cssSourceFilesWithContents])

    registerEmbeddedScriptInjectorHelper(jsSourceFilesWithContents)

    compileSourceFilesAndCopyToDistributionDirectory(htmlSourceFiles, hbsSourceFiles, globals, stats)

    const copiedFilesCount = await copySourceFilesToDistributionDirectory(
        cssSourceFiles,
        jsSourceFiles,
        otherSourceFiles
    )

    stats.copiedFilesCount += copiedFilesCount

    logger.info(`Copied ${stats.copiedFilesCount} files to the distribution directory.`)
    await Actions.runPostBuildAsync(configuration.getActions().postBuild?.filter((action) => !action.skip))

    return stats
}

function loadSourceFilesContents(sourceFiles: FileSystem.FileEntry[]): FileSystem.FileEntry[] {
    return sourceFiles.map((file) => {
        const absolutePath = filesystem.joinAndResolvePath(
            configuration.getSourceDirectoryPath(),
            file.dirname,
            file.name
        )
        return { ...file, contents: filesystem.getFileContents(absolutePath) }
    })
}

async function copySourceFilesToDistributionDirectory(...sourceFilesGroups: FileSystem.FileEntry[][]): Promise<number> {
    const copyPromises: Promise<void>[] = []

    sourceFilesGroups.forEach((group) => {
        group.forEach((file) => {
            const srcFilePath = filesystem.joinAndResolvePath(
                configuration.getSourceDirectoryPath(),
                file.dirname,
                file.name
            )
            const fileDir = filesystem.joinAndResolvePath(configuration.getDistributionDirectoryPath(), file.dirname)
            const distFilePath = filesystem.joinAndResolvePath(
                configuration.getDistributionDirectoryPath(),
                file.dirname,
                file.name
            )
            copyPromises.push(
                filesystem.createDirectoryAsync(fileDir).then(() => {
                    return filesystem.copyFileAsync(srcFilePath, distFilePath)
                })
            )
        })
    })

    await Promise.all(copyPromises)
    return copyPromises.length
}

function compileSourceFilesAndCopyToDistributionDirectory(
    htmlTemplateSourceFiles: FileSystem.FileEntry[],
    hbsTemplateSourceFiles: FileSystem.FileEntry[],
    globals: Symply.Globals,
    stats: Symply.GenerationStats
) {
    const allTemplateSourceFiles = htmlTemplateSourceFiles.concat(hbsTemplateSourceFiles)
    const templateCompilationProgress = new ProgressBar(allTemplateSourceFiles.length)
    const createdFileSet = new Set()

    /*-----------------------------------------------------------------------------
     *  Compile templates with passing globals
     *  Format/Minify HTML output
     *  Save results to the distribution directory
     *----------------------------------------------------------------------------*/
    allTemplateSourceFiles.forEach((file, idx) => {
        const absoluteTemplatePath = filesystem.joinAndResolvePath(
            configuration.getSourceDirectoryPath(),
            file.dirname,
            file.name
        )
        const templateContents = filesystem.getFileContents(absoluteTemplatePath)

        let resultHTML = ''

        try {
            templateCompilationProgress.tick(
                absoluteTemplatePath,
                `Compiling HTML/HBS files:`,
                `${idx + 1}/${allTemplateSourceFiles.length}`
            )
            resultHTML = Handlebars.compile(templateContents)(globals)

            if (configuration.minifyOutputHTML) {
                resultHTML = minify(resultHTML, {
                    minifyJS: {
                        mangle: true,
                        compress: {
                            sequences: true,
                            dead_code: true,
                            conditionals: true,
                            booleans: true,
                            unused: true,
                            if_return: true,
                            join_vars: true,
                            drop_console: true,
                        },
                    },
                    minifyCSS: true,
                    collapseWhitespace: true,
                    removeComments: true,
                })
            } else if (configuration.formatOutputHTML) {
                resultHTML = prettier.format(resultHTML, { parser: 'html' })
            }

            stats.generatedFilesCount++
        } catch (err) {
            if (err instanceof RangeError) {
                logger.error(
                    'Recursive partial structure detected. Check your partials and source files. ' +
                        'Make sure that partials are not calling each other using {{> partialName }}.'
                )
            } else if (err instanceof Error) {
                const message = err.message
                let result

                if ((result = /^The partial (.+) could not be found/.exec(message)?.[1])) {
                    logger.error(
                        `Missing partial ${chalk.red(`{{> ${result} }}`)}. Check render tree in ${chalk.blueBright(
                            absoluteTemplatePath
                        )}`
                    )
                } else {
                    logger.error(
                        `${chalk.red(err.message)} (thrown while processing ${chalk.blueBright(absoluteTemplatePath)})`
                    )
                }
            }
            process.exit(1)
        }

        const outputHTMLFileName = file.name.endsWith('.html') ? file.name : file.name.replace(/(\.hbs)$/, '.html')

        const sourceFilePath = path.join(file.dirname, outputHTMLFileName)

        if (createdFileSet.has(sourceFilePath)) {
            logger.warning(
                `Detected HTML/HBS source files with the same name ${chalk.blueBright(
                    sourceFilePath.replace(/\.html$/, '.*')
                )}, but different extensions. File creation skipped.`
            )
        } else {
            createdFileSet.add(sourceFilePath)

            filesystem.createFile(
                filesystem.joinAndResolvePath(
                    configuration.getDistributionDirectoryPath(),
                    file.dirname,
                    outputHTMLFileName
                ),
                resultHTML
            )
        }
    })
}

function registerEmbeddedStylesInjectorHelper(compiledSassSourceFiles: FileSystem.FileEntry[]) {
    Handlebars.registerHelper('embeddedStyles', embeddedStylesHelper)

    function embeddedStylesHelper(cssFilePath: string, data: Handlebars.HelperOptions) {
        const cssStyles = compiledSassSourceFiles.find((file) => {
            return path.join(file.dirname, file.name) === cssFilePath
        })

        if (!cssStyles) {
            logger.error(
                `CSS file ${filesystem.joinAndResolvePath(
                    configuration.getDistributionDirectoryPath(),
                    cssFilePath
                )} is not found.`
            )
            process.exit(1)
        }

        return new Handlebars.SafeString(
            (data.hash.attributes ? `<style ${data.hash.attributes}>` : `<style>`) + cssStyles.contents + '</style>'
        )
    }
}

function registerEmbeddedScriptInjectorHelper(scriptSourceFiles: FileSystem.FileEntry[]) {
    Handlebars.registerHelper('embeddedScript', embeddedScriptHelper)

    function embeddedScriptHelper(scriptFilePath: string, data: Handlebars.HelperOptions) {
        const scriptFile = scriptSourceFiles.find((file) => {
            return path.join(file.dirname, file.name) === scriptFilePath
        })

        if (!scriptFile) {
            logger.error(
                `Script file ${filesystem.joinAndResolvePath(
                    configuration.getDistributionDirectoryPath(),
                    scriptFilePath
                )} is not found.`
            )
            process.exit(1)
        }

        return new Handlebars.SafeString(
            (data.hash.attributes ? `<script ${data.hash.attributes}>` : '<script>') + scriptFile.contents + '</script>'
        )
    }
}

function compileSassAndCopyToDistributionDirectory(
    sassSourceFiles: FileSystem.FileEntry[],
    stats: Symply.GenerationStats
) {
    const sassStylesCompilationProgress = new ProgressBar(sassSourceFiles.length)

    const compiledSassSourceFiles: FileSystem.FileEntry[] = sassSourceFiles.map((file, idx) => {
        const absoluteFileDirectoryName = filesystem.joinAndResolvePath(
            configuration.getSourceDirectoryPath(),
            file.dirname
        )
        const absoluteFilePath = filesystem.joinAndResolvePath(
            configuration.getSourceDirectoryPath(),
            file.dirname,
            file.name
        )
        const fileContents = filesystem.getFileContents(absoluteFilePath)

        sassStylesCompilationProgress.tick(
            absoluteFilePath,
            'Compiling SASS files:',
            `${idx + 1}/${sassSourceFiles.length}`
        )

        let compiledSassSourceFile: FileSystem.FileEntry

        try {
            compiledSassSourceFile = {
                name: file.name.replace(/(\.scss|\.sass)$/, '.css'),
                dirname: file.dirname,
                path: file.path,
                contents: fileContents
                    ? sass.compileString(fileContents, { loadPaths: [absoluteFileDirectoryName] }).css
                    : '',
            }
        } catch (err) {
            if (err instanceof Error) {
                logger.error(
                    `${chalk.red(err.message)} (thrown while processing ${chalk.blueBright(absoluteFilePath)})`
                )
            }

            process.exit(1)
        }

        filesystem.createFile(
            filesystem.joinAndResolvePath(
                configuration.getDistributionDirectoryPath(),
                compiledSassSourceFile.dirname,
                compiledSassSourceFile.name
            ),
            compiledSassSourceFile.contents
        )
        stats.generatedFilesCount++

        return compiledSassSourceFile
    })

    return compiledSassSourceFiles
}

function clearDistributionDirectoryIfNeeded() {
    if (configuration.clearDistributionDirectoryOnRecompile) {
        const absoluteDistDirectoryPath = filesystem.joinAndResolvePath(configuration.getDistributionDirectoryPath())
        logger.info(`Clearing distribution directory: ${chalk.blueBright(absoluteDistDirectoryPath)}`)
        filesystem.clearDirectoryContents(absoluteDistDirectoryPath)
    }
}

function registerPartials(partials: Symply.Partials) {
    Object.keys(partials).forEach((name) => {
        Handlebars.registerPartial(name, partials[name])
    })
}

function injectGlobalsToHelpers(globals: Symply.Globals) {
    const helpers = Helpers.load()

    Object.keys(helpers).forEach((helperName) => {
        Handlebars.registerHelper(helperName, injectHelperContextDecorator(helpers[helperName], globals))
    })
}

function registerMissingPropertyHelper() {
    if (!configuration.ignoreMissingProperties) {
        Handlebars.registerHelper('helperMissing', function (...passedArgs) {
            const options = passedArgs[arguments.length - 1]
            const args = Array.prototype.slice.call(passedArgs, 0, arguments.length - 1)
            const helperName = options.name

            const lineNumber = options.loc.start.line
            const hashArgsObj: { [arg: string]: string | number } = options.hash

            const argsStringified = args.length !== 0 ? ' ' + args.map((arg) => `"${arg}"`).join(' ') : ''
            const hashArgsStringified = _(hashArgsObj)
                .toPairs()
                .map(([key, value]) => {
                    if (typeof value === 'number') {
                        return `${key}=${value}`
                    } else {
                        return `${key}="${value}"`
                    }
                })
                .thru((value) => {
                    return value.length !== 0 ? ' ' + value.join(' ') : ''
                })
                .value()

            const processingEntityPath = ProgressBar.processingEntityInfo

            const missingHelperType =
                !argsStringified.length && !hashArgsStringified.length ? 'helper/property' : 'helper'
            const missingHelperExpression = `{{ ${helperName}${argsStringified}${hashArgsStringified} }}`

            logger.error(
                `Missing ${missingHelperType} ${chalk.red(
                    missingHelperExpression
                )}. Check render tree in ${chalk.blueBright(processingEntityPath)} (line number: ${lineNumber}).`
            )
            return new Handlebars.SafeString(
                `<div style="color: red !important">Missing ${missingHelperType} ${missingHelperExpression}</div>`
            )
        })
    }
}

function scanSourceFiles() {
    const filesConfiguration = configuration.getFilesConfiguration()

    const allSourceFiles = filesystem
        .scanFiles(configuration.getSourceDirectoryPath(), false, true, true)
        .filter((file) => shouldProcessFile(file, filesConfiguration.all))

    const htmlSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['html']) && shouldProcessFile(file, filesConfiguration.templates)
    })

    const hbsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['hbs']) && shouldProcessFile(file, filesConfiguration.templates)
    })

    const scssSourceFiles = allSourceFiles.filter((file) => {
        return (
            filesystem.hasFileExtension(file.name, ['scss', 'sass']) &&
            !file.name.startsWith('_') &&
            shouldProcessFile(file, filesConfiguration.styles)
        )
    })

    const cssSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['css']) && shouldProcessFile(file, filesConfiguration.styles)
    })

    const jsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['js']) && shouldProcessFile(file, filesConfiguration.js)
    })

    const otherSourceFiles = allSourceFiles.filter((file) => {
        return !filesystem.hasFileExtension(file.name, ['html', 'hbs', 'scss', 'sass', 'css', 'js'])
    })

    return { scssSourceFiles, cssSourceFiles, htmlSourceFiles, hbsSourceFiles, jsSourceFiles, otherSourceFiles }
}

function shouldProcessFile(
    file: FileSystem.FileEntry,
    regexes: {
        include: string[]
        exclude: string[]
    }
): boolean {
    return (
        !regexes.exclude.some((pattern) => minimatch(file.path, pattern)) &&
        regexes.include.some((pattern) => minimatch(file.path, pattern))
    )
}

function injectHelperContextDecorator(
    helperFunction: Symply.Helper,
    globals: Symply.Globals
): Handlebars.HelperDelegate {
    return function (...args) {
        const passedArgs = args.slice(0, args.length - 1)
        const data = args[args.length - 1]
        const renderBlockContentFn = data.fn // if block helper

        const compileAndRenderTemplateDecorator = (template: string, input?: Record<string, unknown>) => {
            return Handlebars.compile(template)(input ?? {})
        }

        return new Handlebars.SafeString(
            helperFunction(
                {
                    hash: data.hash,
                    globals,
                    renderBlockContent: renderBlockContentFn,
                    renderTemplate: compileAndRenderTemplateDecorator,
                },
                ...passedArgs
            )
        )
    }
}
