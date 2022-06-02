import * as ts from 'typescript'

import configuration from '../configuration'
import * as filesystem from '../filesystem'
import logger from '../logger'
import ProgressBar from '../progressBar'

export function lintTranspileAndCopyFilesToDistributionDirectory(
    tsFileList: FileSystem.FileEntry[]
): FileSystem.FileEntry[] {
    const transpileProgress = new ProgressBar(tsFileList.length)
    let emittedFileCount = 0
    transpileProgress.render(`Transpiling TS files:`, `${emittedFileCount}/${tsFileList.length}`)

    const transpiledFiles: FileSystem.FileEntry[] = []

    const program = ts.createProgram(
        tsFileList.map((file) => filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.path)),
        parseTsConfiguration()
    )

    const emitResult = program.emit(undefined, (emittedFileAbsolutePath, text) => {
        transpileProgress.tick(
            emittedFileAbsolutePath,
            `Transpiling TS files:`,
            `${++emittedFileCount}/${tsFileList.length}`
        )

        const jsOutputDistFilePath = emittedFileAbsolutePath.replace(
            filesystem.joinAndResolvePath(configuration.sourceDirectoryPath),
            filesystem.joinAndResolvePath(configuration.distributionDirectoryPath)
        )

        const transpiledFile = tsFileList.find((file) => {
            const outputJsFilePath = filesystem.joinPath(file.scanPath, file.dir, file.name + '.js')
            return emittedFileAbsolutePath === outputJsFilePath
        })

        if (!transpiledFile) {
            throw new Error('Emitted file is not found in `fileList`.')
        }

        transpiledFiles.push({
            ...transpiledFile,
            contents: text,
        })

        filesystem.createFile(jsOutputDistFilePath, text)
    })

    // const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics)

    emitResult.diagnostics.forEach((diagnostic) => {
        if (diagnostic.file) {
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!)
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
            logger.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`)
        } else {
            logger.warning(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
        }
    })

    emitResult.emitSkipped && process.exit(1)

    return transpiledFiles
}

export function transpileFilesAndCopyToDistributionDirectory(
    tsFileList: FileSystem.FileEntry[]
): FileSystem.FileEntry[] {
    const transpileProgress = new ProgressBar(tsFileList.length)
    const transpiledFiles: FileSystem.FileEntry[] = []

    tsFileList.forEach((file, idx) => {
        const absoluteTsFilePath = filesystem.joinAndResolvePath(configuration.sourceDirectoryPath, file.path)
        transpileProgress.tick(absoluteTsFilePath, `Transpiling TS files:`, `${idx + 1}/${tsFileList.length}`)

        const tsFileTranspiledContents = ts.transpileModule(file.contents, {
            compilerOptions: parseTsConfiguration(),
        }).outputText

        transpiledFiles.push({
            ...file,
            contents: tsFileTranspiledContents,
        })

        filesystem.createFile(
            filesystem.joinAndResolvePath(configuration.distributionDirectoryPath, file.dir, file.name + '.js'),
            tsFileTranspiledContents
        )
    })

    return transpiledFiles
}

function parseTsConfiguration(): ts.CompilerOptions {
    const config = configuration.filesConfiguration.ts.configuration

    return {
        module: ts.ModuleKind.CommonJS,
        noEmitOnError: config.noEmitOnError,
        removeComments: config.removeComments,
        target: ts.ScriptTarget[config.target],
    }
}
