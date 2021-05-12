import chalk from 'chalk'
import Handlebars from 'handlebars'
import { minify } from 'html-minifier'
import path from 'path'
import prettier from 'prettier'
import sass from 'sass'
import configuration from '../configuration'
import * as Globals from '../entities/globals'
import * as Helpers from '../entities/helpers'
import * as Layouts from '../entities/layouts'
import * as Partials from '../entities/partials'
import * as Views from '../entities/views'
import * as filesystem from '../filesystem'
import logger from '../logger'
import ProgressBar from '../progressBar'
import string from '../strings'

export async function generate(): Promise<Symply.GenerationStats> {
    const stats: Symply.GenerationStats = {
        generatedFilesCount: 0,
        copiedFilesCount: 0,
    }

    const views = Views.load()
    const globals = Globals.load()
    const partials = Partials.load()
    const layouts = Layouts.load()

    const { scssSourceFiles, cssSourceFiles, htmlSourceFiles, jsSourceFiles, otherSourceFiles } = scanSourceFiles()

    registerPartials(partials)

    registerMissingPropertyHelper()

    registerIfEqHelper()

    injectViews(views, globals)

    registerLayoutHelperAndCompileLayouts(layouts, globals)

    clearDistributionDirectoryIfNeeded()

    const compiledSassSourceFiles = compileSassAndCopyToDistributionDirectory(scssSourceFiles, stats)

    const cssSourceFilesWithContents = loadSourceFilesContents(cssSourceFiles)
    const jsSourceFilesWithContents = loadSourceFilesContents(jsSourceFiles)

    registerInternalStylesInjectorHelper([...compiledSassSourceFiles, ...cssSourceFilesWithContents])

    registerInternalScriptInjectorHelper(jsSourceFilesWithContents)

    compileSourceFilesAndCopyToDistributionDirectory(htmlSourceFiles, globals, stats, partials)

    const copiedFilesCount = await copySourceFilesToDistributionDirectory(
        cssSourceFiles,
        jsSourceFiles,
        otherSourceFiles
    )

    stats.copiedFilesCount += copiedFilesCount

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
    return sourceFilesGroups.length
}

function compileSourceFilesAndCopyToDistributionDirectory(
    htmlTemplateSourceFiles: FileSystem.FileEntry[],
    globals: Symply.Globals,
    stats: Symply.GenerationStats,
    partials: Symply.Partials
) {
    const htmlTemplateCompilationProgress = new ProgressBar(htmlTemplateSourceFiles.length)

    /*-----------------------------------------------------------------------------
     *  Compile templates with passing globals
     *  Format/Minify HTML output
     *  Save results to the distribution directory
     *----------------------------------------------------------------------------*/
    htmlTemplateSourceFiles.forEach((file, idx) => {
        const templateContents = filesystem.getFileContents(
            filesystem.joinAndResolvePath(configuration.getSourceDirectoryPath(), file.dirname, file.name)
        )

        let resultHTML = ''

        try {
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
                        // compress: {},
                    },
                    minifyCSS: true,
                    collapseWhitespace: true,
                    removeComments: true,
                })
            } else if (configuration.formatOutputHTML) {
                resultHTML = prettier.format(resultHTML, { parser: 'html' })
            }

            htmlTemplateCompilationProgress.tick(
                `Compiling HTML files:`,
                `${idx + 1}/${htmlTemplateSourceFiles.length}`
            )
            stats.generatedFilesCount++
        } catch (err) {
            if (err instanceof RangeError) {
                logger.error(
                    'Recursive partial structure detected. Check your partials and source files. ' +
                        'Make sure that partials are not calling each other using {{> partialName}}.'
                )
            } else if (err instanceof Error) {
                const message = err.message
                let result
                if ((result = /^The partial (.+) could not be found/.exec(message)?.[1])) {
                    const targetTemplateFilePath = filesystem.joinAndResolvePath(
                        configuration.getSourceDirectoryPath(),
                        file.dirname,
                        file.name
                    )
                    const missingPartialMessage =
                        'Partial ' +
                        chalk.red(`{{> ${result} }}`) +
                        ` cannot be found (used in ${chalk.blueBright(targetTemplateFilePath)})`

                    const registeredPartialsMessage =
                        Object.keys(partials).length > 0
                            ? `\n${' '.repeat(6)}Registered partials:\n${' '.repeat(8)}${Object.keys(partials)
                                  .map((p) => chalk.green(p))
                                  .join('\n' + ' '.repeat(8))}`
                            : `\n${' '.repeat(6)}No registered partials found`

                    logger.error(missingPartialMessage + registeredPartialsMessage)
                } else {
                    logger.error(err.message)
                }
            }
            process.exit(1)
        }

        filesystem.createFile(
            filesystem.joinAndResolvePath(configuration.getDistributionDirectoryPath(), file.dirname, file.name),
            resultHTML
        )
    })
}

function registerInternalStylesInjectorHelper(compiledSassSourceFiles: FileSystem.FileEntry[]) {
    Handlebars.registerHelper('internalStyles', internalStylesHelper)

    function internalStylesHelper(cssFilePath: string, data: Handlebars.HelperOptions) {
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

        let extraAttributes = ''
        for (const [key, value] of Object.entries(data.hash)) {
            extraAttributes += ` ${key}="${value}"`
            // console.log(`${key}: ${value}`);
        }

        // .entries((key: string, value: string) => {})
        return new Handlebars.SafeString(`<style${extraAttributes}>` + cssStyles.contents + '</style>')
    }
}

function registerInternalScriptInjectorHelper(scriptSourceFiles: FileSystem.FileEntry[]) {
    Handlebars.registerHelper('internalScript', internalScriptHelper)

    function internalScriptHelper(scriptFilePath: string) {
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
        return new Handlebars.SafeString('<script>' + scriptFile.contents + '</script>')
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

        const compiledSassSourceFile: FileSystem.FileEntry = {
            name: file.name.replace(/(\.scss|\.sass)$/, '.css'),
            dirname: file.dirname,
            contents: fileContents
                ? sass
                      .renderSync({
                          data: fileContents,
                          includePaths: [absoluteFileDirectoryName],
                      })
                      .css.toString()
                : '',
        }
        sassStylesCompilationProgress.tick('Compiling SASS files:', `${idx + 1}/${sassSourceFiles.length}`)

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
        logger.warning('Clearing distribution directory ' + chalk.blueBright(absoluteDistDirectoryPath))
        filesystem.clearDirectoryContents(absoluteDistDirectoryPath)
    }
}

function registerPartials(partials: Symply.Partials) {
    Object.keys(partials).forEach((name) => {
        Handlebars.registerPartial(name, partials[name])
    })
}

function injectViews(views: Symply.Views, globals: Symply.Globals) {
    const helpers = Helpers.load()

    Object.keys(helpers).forEach((helperName) => {
        Handlebars.registerHelper(helperName, injectHelperContextDecorator(helpers[helperName], views, globals))
    })
}

function registerMissingPropertyHelper() {
    if (!configuration.ignoreMissingProperties) {
        Handlebars.registerHelper('helperMissing', function (...passedArgs) {
            const options = passedArgs[arguments.length - 1]
            const args = Array.prototype.slice.call(passedArgs, 0, arguments.length - 1)
            logger.error('Missing helper/property: ' + chalk.red(`{{ ${options.name} ${args} }}`))
            return new Handlebars.SafeString('Missing: ' + options.name + '(' + args + ')')
        })
    }
}

/** If equals Block helper
 * @example
 * {{#if_eq var 'value' }}
 * var === 'value'
 * {{else}}
 * var !== 'value'
 * {{/if_eq}}
 */
function registerIfEqHelper() {
    Handlebars.registerHelper('if_eq', function (this: Symply.Globals, a, b, options) {
        if (a == b) {
            return options.fn(this)
        } else {
            return options.inverse(this)
        }
    })
}

function registerLayoutHelperAndCompileLayouts(layouts: Symply.Layouts, globals: Symply.Globals) {
    Handlebars.registerHelper('layout', layoutHelper)

    function layoutHelper(layoutName: string, data: Handlebars.HelperOptions) {
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
            logger.error(
                `Layout '${layoutName}' is not found in directory '${configuration.getLayoutsDirectoryPath()}/'.`
            )
            process.exit(1)
        }

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        return Handlebars.compile(layouts[layoutName].replace('{{}}', data.fn(this)))(
            Object.assign({}, globals, data.hash)
        )
    }
}

function scanSourceFiles() {
    const allSourceFiles = filesystem.scanFiles(configuration.getSourceDirectoryPath(), false, true, true)

    const htmlSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['html'])
    })

    const scssSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['sass', 'scss']) && !file.name.startsWith('_')
    })

    const cssSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['css'])
    })

    const jsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['js'])
    })

    const otherSourceFiles = allSourceFiles.filter((file) => {
        return !filesystem.hasFileExtension(file.name, ['html', 'sass', 'scss', 'css', 'js'])
    })
    return { scssSourceFiles, cssSourceFiles, htmlSourceFiles, jsSourceFiles, otherSourceFiles }
}

function injectHelperContextDecorator(
    helperFunction: Symply.Helper,
    views: Symply.Views,
    globals: Symply.Globals
): Handlebars.HelperDelegate {
    return function (...args) {
        const passedArgs = args.slice(0, args.length - 1)
        const data = args[args.length - 1]
        const renderBlockContentFn = data.fn // if block helper

        const viewName: string | undefined = data.hash?.view

        return new Handlebars.SafeString(
            viewName
                ? helperFunction(
                      { hash: data.hash, globals, view: views[viewName], renderBlockContent: renderBlockContentFn },
                      ...passedArgs
                  )
                : helperFunction({ hash: data.hash, globals, renderBlockContent: renderBlockContentFn }, ...passedArgs)
        )
    }
}
