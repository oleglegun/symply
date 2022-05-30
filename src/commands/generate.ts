import chalk from 'chalk'
import Handlebars from 'handlebars'
import minimatch from 'minimatch'
import path from 'path'

import configuration from '../configuration'
import * as Actions from '../entities/actions'
import * as Globals from '../entities/globals'
import * as Helpers from '../entities/helpers'
import * as Partials from '../entities/partials'
import * as filesystem from '../filesystem'
import * as helperRigistration from '../handlebars/helpers'
import * as unusedPartials from '../handlebars/unusedPartials'
import logger from '../logger'
import ProgressBar from '../progressBar'
import * as htmlFormatter from '../tools/htmlFormatter'
import * as htmlMinifier from '../tools/htmlMinifier'
import * as sassCompiler from '../tools/sassCompiler'
import * as tsTranspiler from '../tools/tsTranspiler'

export async function generate(): Promise<Symply.GenerationStats> {
    const stats: Symply.GenerationStats = {
        generatedFilesCount: 0,
        copiedFilesCount: 0,
    }

    configuration.debugOutput && unusedPartials.initUnusedPartialsDetector()

    await Actions.runPreBuildAsync(configuration.actions.preBuild?.filter((action) => !action.skip))
    const globals = Globals.load()
    const partials = Partials.load()

    registerPartials(partials)

    helperRigistration.helperMissing()

    // Block helpers registration
    helperRigistration.if_eq()
    helperRigistration.if_ne()
    helperRigistration.if_gt()
    helperRigistration.if_ge()
    helperRigistration.if_lt()
    helperRigistration.if_le()
    helperRigistration.if_and()
    helperRigistration.if_or()
    helperRigistration.if_xor()

    injectGlobalsToHelpers(globals)

    clearDistributionDirectoryIfNeeded()

    /*-----------------------------------------------------------------------------
     *  Processing files from `sourceDirectoryPath`
     *----------------------------------------------------------------------------*/
    const {
        scssSourceFiles,
        cssSourceFiles,
        htmlSourceFiles,
        hbsSourceFiles,
        jsSourceFiles,
        tsSourceFiles,
        otherSourceFiles,
    } = scanSourceFiles()

    /*-----------------------------------------------------------------------------
     *  Styles
     *----------------------------------------------------------------------------*/
    const compiledSassSourceFiles = compileSassAndCopyToDistributionDirectory(scssSourceFiles, stats)
    const cssSourceFilesWithContents = loadSourceFilesContents(cssSourceFiles)

    helperRigistration.embeddedStyles([...compiledSassSourceFiles, ...cssSourceFilesWithContents])

    /*-----------------------------------------------------------------------------
     *  Scripts
     *----------------------------------------------------------------------------*/
    const jsSourceFilesWithContents = loadSourceFilesContents(jsSourceFiles)
    const tsSourceFilesWithContents = loadSourceFilesContents(tsSourceFiles)

    const tsTranspiledSourceFilesWithContents = transpileTypescriptFilesAndCopyToDistributionDirectory(
        tsSourceFilesWithContents,
        jsSourceFiles,
        stats
    )

    helperRigistration.embeddedScript([...jsSourceFilesWithContents, ...tsTranspiledSourceFilesWithContents])

    /*-----------------------------------------------------------------------------
     *  Templates
     *----------------------------------------------------------------------------*/
    compileSourceFilesAndCopyToDistributionDirectory(htmlSourceFiles, hbsSourceFiles, globals, stats)

    const copiedFilesCount = await copySourceFilesToDistributionDirectory(
        cssSourceFiles,
        jsSourceFiles,
        otherSourceFiles
    )

    stats.copiedFilesCount += copiedFilesCount

    logger.info(`Copied ${stats.copiedFilesCount} files to the distribution directory.`)

    /*-----------------------------------------------------------------------------
     *  Actions
     *----------------------------------------------------------------------------*/
    await Actions.runPostBuildAsync(configuration.actions.postBuild?.filter((action) => !action.skip))

    configuration.debugOutput && unusedPartials.printUnusedPartialsMessage(partials)

    return stats
}

function loadSourceFilesContents(sourceFiles: FileSystem.FileEntry[]): FileSystem.FileEntry[] {
    return sourceFiles.map((file) => {
        const absolutePath = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.dirname, file.name)
        return { ...file, contents: filesystem.getFileContents(absolutePath) }
    })
}

function transpileTypescriptFilesAndCopyToDistributionDirectory(
    tsSourceFiles: FileSystem.FileEntry[],
    /** JS source files to detect possible shadowing by TS files */
    jsSourceFiles: FileSystem.FileEntry[],
    stats: Symply.GenerationStats
): FileSystem.FileEntry[] {
    const typescriptCompilationProgress = new ProgressBar(tsSourceFiles.length)
    const createdFileSet = new Set()

    jsSourceFiles.forEach((file) => {
        createdFileSet.add(file.path)
    })

    const files: FileSystem.FileEntry[] = []

    tsSourceFiles.forEach((file, idx) => {
        const absoluteTsFilePath = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.path)
        typescriptCompilationProgress.tick(
            absoluteTsFilePath,
            `Compiling TS files:`,
            `${idx + 1}/${tsSourceFiles.length}`
        )

        const tsFileTranspiledContents = tsTranspiler.transpile(file.contents)

        files.push({
            name: file.name,
            dirname: file.dirname,
            path: file.path,
            contents: tsFileTranspiledContents,
        })

        stats.generatedFilesCount++

        const outputJsFileName = file.name.replace(/(\.ts)$/, '.js')
        const sourceFilePath = path.join(file.dirname, outputJsFileName)

        if (createdFileSet.has(sourceFilePath)) {
            logger.warning(
                `Detected JS/TS source files with the same name ${chalk.blueBright(
                    sourceFilePath.replace(/\.js$/, '.*')
                )}, but different extensions. TypeScript file compilation skipped.`
            )
        } else {
            createdFileSet.add(sourceFilePath)

            filesystem.createFile(
                filesystem.joinAndResolvePath(configuration.distributionDirectoryPath, file.dirname, outputJsFileName),
                tsFileTranspiledContents
            )
        }
    })

    return files
}

async function copySourceFilesToDistributionDirectory(...sourceFilesGroups: FileSystem.FileEntry[][]): Promise<number> {
    const copyPromises: Promise<void>[] = []

    sourceFilesGroups.forEach((group) => {
        group.forEach((file) => {
            const srcFilePath = filesystem.joinAndResolvePath(
                configuration.sourceDirectoryPath,
                file.dirname,
                file.name
            )
            const fileDir = filesystem.joinAndResolvePath(configuration.distributionDirectoryPath, file.dirname)
            const distFilePath = filesystem.joinAndResolvePath(
                configuration.distributionDirectoryPath,
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
            configuration.sourceDirectoryPath,
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
                resultHTML = htmlMinifier.minify(resultHTML)
            } else if (configuration.formatOutputHTML) {
                resultHTML = htmlFormatter.format(resultHTML)
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
                    configuration.distributionDirectoryPath,
                    file.dirname,
                    outputHTMLFileName
                ),
                resultHTML
            )
        }
    })
}

function compileSassAndCopyToDistributionDirectory(
    sassSourceFiles: FileSystem.FileEntry[],
    stats: Symply.GenerationStats
) {
    const sassStylesCompilationProgress = new ProgressBar(sassSourceFiles.length)

    const compiledSassSourceFiles: FileSystem.FileEntry[] = sassSourceFiles.map((file, idx) => {
        const absoluteFileDirectoryName = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.dirname)
        const absoluteFilePath = filesystem.joinAndResolvePath(
            configuration.sourceDirectoryPath,
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
                contents: fileContents ? sassCompiler.compile(fileContents, absoluteFileDirectoryName) : '',
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
                configuration.distributionDirectoryPath,
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
        const absoluteDistDirectoryPath = filesystem.joinAndResolvePath(configuration.distributionDirectoryPath)
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

function scanSourceFiles() {
    const filesConfiguration = configuration.filesConfiguration

    const allSourceFiles = filesystem
        .scanFiles(configuration.sourceDirectoryPath, false, true, true)
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

    const tsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.name, ['ts']) && shouldProcessFile(file, filesConfiguration.js)
    })

    const otherSourceFiles = allSourceFiles.filter((file) => {
        return !filesystem.hasFileExtension(file.name, ['html', 'hbs', 'scss', 'sass', 'css', 'js', 'ts'])
    })

    return {
        scssSourceFiles,
        cssSourceFiles,
        htmlSourceFiles,
        hbsSourceFiles,
        jsSourceFiles,
        tsSourceFiles,
        otherSourceFiles,
    }
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
