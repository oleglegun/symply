import chalk from 'chalk'
import Handlebars from 'handlebars'
import _ from 'lodash'
import minimatch from 'minimatch'
import path from 'path'

import configuration from '../configuration'
import * as Actions from '../entities/actions'
import * as Globals from '../entities/globals'
import * as Helpers from '../entities/helpers'
import * as Partials from '../entities/partials'
import * as filesystem from '../filesystem'
import * as helperRigistration from '../handlebars/helpers'
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

    configuration.debugOutput && Partials.initUnusedPartialsDetector()

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

    const tsTranspiledSourceFilesWithContents = transpileTSFilesAndCopyToDistributionDirectory(
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

    logger.info(
        `Generated ${chalk.greenBright(stats.generatedFilesCount)} file${stats.generatedFilesCount === 1 ? '' : 's'},` +
            ` copied ${chalk.greenBright(stats.copiedFilesCount)} file${stats.copiedFilesCount === 1 ? '' : 's'}.`
    )

    /*-----------------------------------------------------------------------------
     *  Actions
     *----------------------------------------------------------------------------*/
    await Actions.runPostBuildAsync(configuration.actions.postBuild?.filter((action) => !action.skip))

    configuration.debugOutput && Partials.printUnusedPartialsList(partials)

    return stats
}

function loadSourceFilesContents(sourceFiles: FileSystem.FileEntry[]): FileSystem.FileEntry[] {
    return sourceFiles.map((file) => {
        const absolutePath = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.dir, file.base)
        return { ...file, contents: filesystem.getFileContents(absolutePath) }
    })
}

function transpileTSFilesAndCopyToDistributionDirectory(
    tsSourceFiles: FileSystem.FileEntry[],
    /** JS source files to detect possible shadowing by TS files */
    jsSourceFiles: FileSystem.FileEntry[],
    stats: Symply.GenerationStats
): FileSystem.FileEntry[] {
    const duplicateJSFilePathList = _.intersection(
        jsSourceFiles.map((f) => filesystem.joinPath(f.scanPath, f.dir, f.name)),
        tsSourceFiles.map((f) => filesystem.joinPath(f.scanPath, f.dir, f.name))
    )

    if (duplicateJSFilePathList.length !== 0) {
        logger.error(`Detected JS/TS source files with the same name, but different extensions:`)
        duplicateJSFilePathList.forEach((dup) => logger.logWithPadding(chalk.blueBright`${dup}.*`))

        process.exit(1)
    }

    stats.generatedFilesCount += tsSourceFiles.length

    if (configuration.filesConfiguration.ts.enableLinter) {
        return tsTranspiler.lintTranspileAndCopyFilesToDistributionDirectory(tsSourceFiles)
    }

    return tsTranspiler.transpileFilesAndCopyToDistributionDirectory(tsSourceFiles)
}

async function copySourceFilesToDistributionDirectory(...sourceFilesGroups: FileSystem.FileEntry[][]): Promise<number> {
    const copyPromises: Promise<void>[] = []

    sourceFilesGroups.forEach((group) => {
        group.forEach((file) => {
            const srcFilePath = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.dir, file.base)
            const fileDir = filesystem.joinAndResolvePath(configuration.distributionDirectoryPath, file.dir)
            const distFilePath = filesystem.joinAndResolvePath(
                configuration.distributionDirectoryPath,
                file.dir,
                file.base
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
            file.dir,
            file.base
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
            }

            if (configuration.formatOutputHTML) {
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

        const sourceFilePath = path.join(file.dir, file.name + '.html')

        if (createdFileSet.has(sourceFilePath)) {
            logger.warning(
                `Detected HTML/HBS source files with the same name ${chalk.blueBright(
                    path.join(file.dir, file.name + '.*')
                )}, but different extensions. File creation skipped.`
            )
        } else {
            createdFileSet.add(sourceFilePath)

            filesystem.createFile(
                filesystem.joinAndResolvePath(configuration.distributionDirectoryPath, file.dir, file.name + '.html'),
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
        const absoluteFileDirectoryName = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.dir)
        const absoluteFilePath = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.dir, file.base)
        const fileContents = filesystem.getFileContents(absoluteFilePath)

        sassStylesCompilationProgress.tick(
            absoluteFilePath,
            'Compiling SASS files:',
            `${idx + 1}/${sassSourceFiles.length}`
        )

        let compiledSassSourceFile: FileSystem.FileEntry

        try {
            compiledSassSourceFile = {
                scanPath: file.scanPath,
                name: file.name,
                ext: '.css',
                base: file.name + '.css',
                dir: file.dir,
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
                compiledSassSourceFile.dir,
                compiledSassSourceFile.base
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
        return filesystem.hasFileExtension(file.base, ['html']) && shouldProcessFile(file, filesConfiguration.templates)
    })

    const hbsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.base, ['hbs']) && shouldProcessFile(file, filesConfiguration.templates)
    })

    const scssSourceFiles = allSourceFiles.filter((file) => {
        return (
            filesystem.hasFileExtension(file.base, ['scss', 'sass']) &&
            !file.base.startsWith('_') &&
            shouldProcessFile(file, filesConfiguration.styles)
        )
    })

    const cssSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.base, ['css']) && shouldProcessFile(file, filesConfiguration.styles)
    })

    const jsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.base, ['js']) && shouldProcessFile(file, filesConfiguration.js)
    })

    const tsSourceFiles = allSourceFiles.filter((file) => {
        return filesystem.hasFileExtension(file.base, ['ts']) && shouldProcessFile(file, filesConfiguration.ts)
    })

    const otherSourceFiles = allSourceFiles.filter((file) => {
        return !filesystem.hasFileExtension(file.base, ['html', 'hbs', 'scss', 'sass', 'css', 'js', 'ts'])
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
