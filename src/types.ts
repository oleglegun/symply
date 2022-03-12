/* eslint-disable */
interface SymplyConfiguration extends Partial<Symply.SystemConfiguration> {
    paths?: Partial<Symply.PathConfiguration>
    entities?: Partial<Symply.EntitiesConfiguration>
    actions?: Partial<Symply.ActionsConfiguration>
}

namespace Symply {
    type HelperArgument = any
    type NamedHelperArgument = any

    interface HelperDataObject {
        /**
         * Explicitly passed named arguments.
         * @example {{ helperFunc namedArg1=hello namedArg2=world }}
         **/
        hash: { [namedArgumentName: string]: NamedHelperArgument }
        /** Map of global values, specified in `symply-globals.js` or explicitly passed via `globals` key */
        globals: Globals
        /**
         * Returns `block content` for block helper function.
         * @example {{ #blockHelperFunc }} block content {{ /blockHelperFunction }}
         **/
        renderBlockContent?: () => string
        /**
         * Compile input template string and render result content
         * @example
         * compile('{{> myPartial}}')
         **/
        renderTemplate: (template: string, input?: Record<string, unknown>) => string
    }

    /** @example { article: '<article>{{}}</article>' } */
    export type Globals = { [globalPropertyName: string]: any }
    export type Partials = { [partialName: string]: string }
    export type Helper = (data: HelperDataObject, ...args: HelperArgument[]) => string
    export type Helpers = { [helperName: string]: Helper }

    export interface SystemConfiguration {
        /**
         * Log debug information to the console.
         * @default false
         **/
        debugOutput: boolean
        /**
         * Force compile templates even if some properties/helpers are missing.
         * @default false
         **/
        ignoreMissingProperties: boolean
        /**
         * Format output html files using Prettier (significantly slows down the generation process).
         * @default false
         */
        formatOutputHTML: boolean
        /**
         * Minify output html files.
         * @default false
         */
        minifyOutputHTML: boolean
        /**
         * Omit all warning log messages.
         * @default false
         */
        omitWarnings: boolean
        /**
         * Use ANSI escape sequences to add colors to logs.
         * @default true
         */
        ansiLogging: boolean
        /**
         * Clear all files in distribution directory before each compilation. Use with caution - your files can be deleted if `distributionDirectoryPath` is set incorrectly.
         * @default false
         */
        clearDistributionDirectoryOnRecompile: boolean
    }

    export interface PathConfiguration {
        /**
         * Set a path to prefix all __default__ SYMPLY directories (relative to your NPM project's root dir).
         * @default ''
         * @example 'symply' -> 'symply/dist', 'symply/src', 'symply/helpers', 'symply/globals', 'symply/partials'
         **/
        defaultDirectoriesPrefix: string
        /**
         * Override default __source__ directory path.
         * @default 'src'
         **/
        sourceDirectoryPath: string
        /**
         * Override default __distribution__ directory path.
         * @default 'dist'
         **/
        distributionDirectoryPath: string
        /**
         * Override default __globals__ directory path.
         * @default 'globals'
         **/
        globalsDirectoryPath: string
        /**
         * Override default __partials__ directory path.
         * @default 'partials'
         **/
        partialsDirectoryPath: string
        /**
         * Override default __helpers__ directory path.
         * @default 'helpers'
         **/
        helpersDirectoryPath: string
    }

    export interface EntitiesConfiguration {
        /** Explicitly passed partials */
        partials: Symply.Partials
        /** Explicitly passed helpers */
        helpers: Symply.Helpers
        /** Explicitly passed globals */
        globals: Symply.Globals
    }

    export interface ActionsConfiguration {
        preBuild?: Action[]
        postBuild?: Action[]
    }

    export type Action = ActionBase &
        (
            | CopyFileAction
            | CopyFileToDirectoryAction
            | CopyFilesToDirectoryAction
            | MoveFileAction
            | MoveFilesToDirectoryAction
            | CopyDirectoryAction
            | MoveDirectoryAction
            | CopyDirectoryToDirectoryAction
            | MoveDirectoryToDirectoryAction
            | RemoveDirectoryAction
            | EmptyDirectoryAction
            | RenameFileAction
            | RenameDirectoryAction
            | RunNPMScriptAction
            | RunShellCommandAction
            | RunJSScriptAction
            | CallFunctionAction
        )

    interface ActionBase {
        /**
         * Skip execution of current action
         *  @default false
         * */
        skip?: boolean
        /**
         * Optional action description
         */
        info?: string | string[]
    }
    export interface CopyFileAction {
        type: 'COPY_FILE'
        fromFilePath: string | string[]
        toFilePath: string | string[]
    }

    export interface CopyFileToDirectoryAction {
        type: 'COPY_FILE_TO_DIR'
        fromFilePath: string | string[]
        toDirPath: string | string[]
    }

    export type FileFilterFunc = (type: 'DIR' | 'FILE', name: string, extension: string) => boolean

    export interface CopyFilesToDirectoryAction {
        type: 'COPY_FILES_TO_DIR'
        fromDirPath: string | string[]
        toDirPath: string | string[]
        /** @default () => true */
        filterFunc?: FileFilterFunc
    }

    export interface MoveFileAction {
        type: 'MOVE_FILE'
        fromFilePath: string | string[]
        /** Non-existent directories will be automatically created. */
        toFilePath: string | string[]
    }

    export interface MoveFilesToDirectoryAction {
        type: 'MOVE_FILES_TO_DIR'
        fromDirPath: string | string[]
        /** Non-existent directories will be automatically created. */
        toDirPath: string | string[]
        /** @default () => true */
        filterFunc?: FileFilterFunc
    }

    export interface CopyDirectoryAction {
        type: 'COPY_DIR'
        fromDirPath: string | string[]
        /** Must have the same final directory name as `fromDirPath` */
        toDirPath: string | string[]
    }

    export interface MoveDirectoryAction {
        type: 'MOVE_DIR'
        fromDirPath: string | string[]
        /** Must have the same final directory name as `fromDirPath` */
        toDirPath: string | string[]
    }

    export interface CopyDirectoryToDirectoryAction {
        type: 'COPY_DIR_TO_DIR'
        fromDirPath: string | string[]
        toParentDirPath: string | string[]
    }

    export interface MoveDirectoryToDirectoryAction {
        type: 'MOVE_DIR_TO_DIR'
        fromDirPath: string | string[]
        toParentDirPath: string | string[]
    }

    export interface EmptyDirectoryAction {
        type: 'EMPTY_DIR'
        dirPath: string | string[]
    }

    export interface RemoveDirectoryAction {
        type: 'REMOVE_DIR'
        dirPath: string | string[]
    }

    export interface RenameFileAction {
        type: 'RENAME_FILE'
        filePath: string | string[]
        newName: string
    }

    export interface RenameDirectoryAction {
        type: 'RENAME_DIR'
        dirPath: string | string[]
        newName: string
    }

    export interface RunNPMScriptAction {
        type: 'RUN_NPM_SCRIPT'
        scriptName: string
    }

    export interface RunShellCommandAction {
        type: 'RUN_SHELL_CMD'
        cmd: string | string[]
    }

    export interface RunJSScriptAction {
        type: 'RUN_JS_SCRIPT'
        scriptPath: string | string[]
    }

    export interface CallFunctionAction {
        type: 'CALL_FUNC'
        func: () => void | Promise<void>
    }

    export type DefaultConfiguration = Symply.PathConfiguration & Symply.CommandLineModeConfiguration
    export type ModuleModeConfiguration = PathConfiguration & EntitiesConfiguration

    export type CommandLineModeConfiguration = SystemConfiguration & {
        /** @default 3000 */
        developmentServerPort: number
    }

    export interface GenerationStats {
        generatedFilesCount: number
        copiedFilesCount: number
    }
}

namespace FileSystem {
    export interface FileEntry {
        name: string
        dirname: string
        contents: string
    }
}
