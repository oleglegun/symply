import chalk from 'chalk'
import Handlebars from 'handlebars'
import { minify } from 'html-minifier'
import path from 'path'
import prettier from 'prettier'
import sass from 'sass'
import configuration from '../configuration'
import * as Globals from '../entities/globals'
import * as Helpers from '../entities/helpers'
import * as Partials from '../entities/partials'
import * as Actions from '../entities/actions'
import * as filesystem from '../filesystem'
import logger from '../logger'
import ProgressBar from '../progressBar'

export async function generate(): Promise<Symply.GenerationStats> {
    const stats: Symply.GenerationStats = {
        generatedFilesCount: 0,
        copiedFilesCount: 0,
    }

    await Actions.runPreBuildAsync(configuration.getActions().preBuild)
    const globals = Globals.load()
    const partials = Partials.load()

    const { scssSourceFiles, cssSourceFiles, htmlSourceFiles, hbsSourceFiles, jsSourceFiles, otherSourceFiles } =
        scanSourceFiles()

    registerPartials(partials)

    registerMissingPropertyHelper()

    registerIfEqHelper()

    registerIfNeHelper()

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
    await Actions.runPostBuildAsync(configuration.getActions().postBuild)

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

            templateCompilationProgress.tick(`Compiling HTML/HBS files:`, `${idx + 1}/${allTemplateSourceFiles.length}`)
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

                    logger.error(
                        'Partial ' +
                            chalk.red(`{{> ${result} }}`) +
                            ` cannot be found (used in ${chalk.blueBright(targetTemplateFilePath)})`
                    )
                } else {
                    logger.error(err.message)
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

/** If not equals Block helper
 * @example
 * {{#if_ne var 'value' }}
 * var !== 'value'
 * {{else}}
 * var === 'value'
 * {{/if_ne}}
 */
function registerIfNeHelper() {
    Handlebars.registerHelper('if_ne', function (this: Symply.Globals, a, b, options) {
        if (a != b) {
            return options.fn(this)
        } else {
            return options.inverse(this)
        }
    })
}

function scanSourceFiles() {
    const allSourceFiles = filesystem.scanFiles(configuration.getSourceDirectoryPath(), false, true, true)

    const htmlSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['html'])
    })

    const hbsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['hbs'])
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
        return !filesystem.hasFileExtension(file.name, ['html', 'hbs', 'sass', 'scss', 'css', 'js'])
    })

    return { scssSourceFiles, cssSourceFiles, htmlSourceFiles, hbsSourceFiles, jsSourceFiles, otherSourceFiles }
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
