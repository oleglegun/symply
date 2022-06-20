/* eslint-disable */
type DeepPartial<T> = {
    [P in keyof T]?: DeepPartial<T[P]>
}

interface SymplyConfiguration extends Partial<Symply.SystemConfiguration> {
    paths?: Partial<Symply.PathsConfiguration>
    files?: DeepPartial<Symply.FilesConfiguration>
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
         *
         * Default value: `false`
         **/
        debugOutput: boolean
        /**
         * Force compile templates even if some properties/helpers are missing.
         *
         * Default value: `false`
         **/
        ignoreMissingProperties: boolean
        /**
         * Format output html files using Prettier (significantly slows down the generation process).
         *
         * Default value: `false`
         */
        formatOutputHTML: boolean
        /**
         * Minify output html files.
         *
         * Default value: `false`
         */
        minifyOutputHTML: boolean
        /**
         * Omit all warning log messages.
         *
         * Default value: `false`
         */
        omitWarnings: boolean
        /**
         * Use ANSI escape sequences to add colors to logs.
         *
         * Default value: `true`
         */
        ansiLogging: boolean
        /**
         * Clear all files in distribution directory before each compilation. Use with caution - your files can be deleted if `distributionDirectoryPath` is set incorrectly.
         *
         * Default value: `false`
         */
        clearDistributionDirectoryOnRecompile: boolean
        /**
         * Change default `console` logger to any custom one.
         */
        customLogger: CustomLogger
    }

    export interface CustomLogger {
        log(message?: string): void
    }

    export interface ConfigurableDirectoryPath {
        default: string
        custom: string | null
    }

    export interface PathsConfiguration {
        /**
         * Set a path to prefix all __default__ SYMPLY directories (relative to your NPM project's root dir).
         *
         * Default value: `''`
         * @example 'symply' -> 'symply/dist', 'symply/src', 'symply/helpers', 'symply/globals', 'symply/partials'
         **/
        defaultDirectoriesPrefix: string
        /**
         * Override default __source__ directory path. `defaultDirectoriesPrefix` will NOT be applied.
         *
         * Default value: `'src'`
         **/
        sourceDirectoryPath: string
        /**
         * Override default __distribution__ directory path. `defaultDirectoriesPrefix` will NOT be applied.
         *
         * Default value: `'dist'`
         **/
        distributionDirectoryPath: string
        /**
         * Override default __globals__ directory path. `defaultDirectoriesPrefix` will NOT be applied.
         *
         * Default value: `'globals'`
         **/
        globalsDirectoryPath: string
        /**
         * Override default __partials__ directory path. `defaultDirectoriesPrefix` will NOT be applied.
         *
         * Default value: `'partials'`
         **/
        partialsDirectoryPath: string
        /**
         * Override default __helpers__ directory path. `defaultDirectoriesPrefix` will NOT be applied.
         *
         * Default value: `'helpers'`
         **/
        helpersDirectoryPath: string
    }

    export interface FilesConfiguration {
        /** Global settings for all processed files in the `sourceDirectoryPath`. */
        all: {
            /**
             * Define global patterns for all files in the `sourceDirectoryPath` that must be included in the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `['**\/*']` - Process all files, except dotfiles
             * @example ['*.html', '*.css'] - Process only files that match these patterns
             */
            include: string[]
            /**
             * Define global patterns for all files in the `sourceDirectoryPath` that must be excluded from the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `[]`
             * @example ['test.hbs', 'temp/*'] - Exclude files that match these patterns
             */
            exclude: string[]
        }
        /** Settings for `.hbs` and `.html` template files compilation in the `sourceDirectoryPath`. */
        templates: {
            /**
             * Define patterns for `.hbs` and `.html` template files in the `sourceDirectoryPath` that must be included in the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `['**\/*']` - Process all `.hbs` and `.html` files
             * @example ['index.hbs', 'articles/*.html'] - Process only files that match these patterns
             */
            include: string[]
            /**
             * Define patterns for `.hbs` and `.html` template files in the `sourceDirectoryPath` that must be excluded from the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `[]`
             * @example ['index.hbs', 'articles/*.html'] - Exclude files that match these patterns
             */
            exclude: string[]
        }
        /** Settings for `.css`, `.scss` and `.sass` style files compilation in the `sourceDirectoryPath`. */
        styles: {
            /**
             * Define patterns for `.css`, `.scss` and `.sass` style files in the `sourceDirectoryPath` that must be included in the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `['**\/*']` - Process all `.css`, `.scss` and `.sass` style files
             * @example ['styles.css', 'styles/*.scss'] - Process only files that match these patterns
             */
            include: string[]
            /**
             * Define patterns for `.css`, `.scss` and `.sass` style files in the `sourceDirectoryPath` that must be excluded from the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `[]`
             * @example ['styles.test.css', 'styles/test.scss'] - Exclude files that match these patterns
             */
            exclude: string[]
        }
        /** Settings for `.js` script files compilation in the `sourceDirectoryPath`. */
        js: {
            /**
             * Define patterns for `.js` script files in the `sourceDirectoryPath` that must be included in the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `['**\/*']` - Process all `.js` script files
             * @example ['main.js', 'js/*.js'] - Process only files that match these patterns
             */
            include: string[]
            /**
             * Define patterns for `.js` script files in the `sourceDirectoryPath` that must be excluded from the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `[]`
             * @example ['analytics.js', 'js/*.test.js'] - Exclude files that match these patterns
             */
            exclude: string[]
        }
        /** Settings for `.ts` script files transpilation in the `sourceDirectoryPath`. */
        ts: {
            /**
             * Define patterns for `.ts` script files in the `sourceDirectoryPath` that must be included in the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `['**\/*']` - Process all `.ts` script files
             * @example ['main.ts', 'ts/*.ts'] - Process only files that match these patterns
             */
            include: string[]
            /**
             * Define patterns for `.ts` script files in the `sourceDirectoryPath` that must be excluded from the compilation process.
             * Use forward slash `/` as a path separator on any platform.
             *
             * Default value: `[]`
             * @example ['analytics.ts', 'ts/*.test.ts'] - Exclude files that match these patterns
             */
            exclude: string[]
            /**
             * Check TypeScript code for errors. Significantly slows down the transpile process.
             *
             * Default value: `false`
             */
            enableLinter: boolean
            /**
             * Define TypeScript configuration options like you do in `tsconfig.json`.
             * @example {"target": "ES2017", ...}
             */
            configuration: {
                /**
                 * Do not emit any JS files on lint error. Setting is considered only when linter is enabled.
                 *
                 * Default value: `true`
                 */
                noEmitOnError: boolean
                /**
                 * Strips all comments from TypeScript files when converting into JavaScript.
                 *
                 * Default value: `true`
                 */
                removeComments: boolean
                /**
                 * Default value: `'ES2015'`
                 */
                target:
                    | 'ES3'
                    | 'ES5'
                    | 'ES2015'
                    | 'ES2016'
                    | 'ES2017'
                    | 'ES2018'
                    | 'ES2019'
                    | 'ES2020'
                    | 'ES2021'
                    | 'ES2022'
                    | 'ESNext'
            }
        }
    }

    export interface EntitiesConfiguration {
        /** Explicitly passed globals */
        globals: Symply.Globals
        /** Explicitly passed partials */
        partials: Symply.Partials
        /** Explicitly passed helpers */
        helpers: Symply.Helpers
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
         * Skip execution of current action.
         *
         * Default value: `false`
         */
        skip?: boolean
        /**
         * Optional action description.
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
        /** Default value: `() => true` */
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
        /** Default value: `() => true` */
        filterFunc?: FileFilterFunc
    }

    export interface CopyDirectoryAction {
        type: 'COPY_DIR'
        fromDirPath: string | string[]
        /** Must have the same final directory name as `fromDirPath`. */
        toDirPath: string | string[]
    }

    export interface MoveDirectoryAction {
        type: 'MOVE_DIR'
        fromDirPath: string | string[]
        /** Must have the same final directory name as `fromDirPath`. */
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

    export interface GenerationStats {
        generatedFilesCount: number
        copiedFilesCount: number
    }
}

namespace FileSystem {
    export interface FileEntry {
        /**
         * Contains path that this file path is relative to.
         * @example
         * '/' - means relative to root (absolute path)
         * '/lib' - means relative to '/lib' (relative path)
         */
        scanPath: string
        /** File name without extension. */
        name: string
        /**
         * File extension.
         * @example '.html'
         */
        ext: string
        /** File name with extension. */
        base: string
        /** File path (without base) relative to `scanPath`. */
        dir: string
        /** File path (with base) relative to `scanPath`. */
        path: string
        /** File contents if file read was performed. */
        contents: string
    }
}
