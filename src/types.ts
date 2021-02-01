/*-----------------------------------------------------------------------------
 *  Module mode configuration
 *----------------------------------------------------------------------------*/

interface SymplyConfiguration extends Partial<Symply.SystemConfiguration> {
    paths?: Partial<Symply.PathConfiguration>
    entities?: Partial<Symply.EntitiesConfiguration>
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
         * Loaded `view` by view name if it was passed to helper function.
         * @example {{ helperFunc view='viewName' }}
         **/
        view?: any
    }

    /** @example { article: '<article>{{}}</article>' } */
    export type Layouts = { [layoutName: string]: string }
    export type Globals = { [globalPropertyName: string]: any }
    export type Partials = { [partialName: string]: string }
    export type Views = { [viewName: string]: any }
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
         * Enable support for JSX tags in helpers file.
         * @default true
         **/
        enableJsxSupportInHelpers: boolean
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
         * @example 'symply' -> 'symply/dist', 'symply/src', 'symply/layouts', 'symply/partials', 'symply/views'
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
         * Override default __partials__ directory path.
         * @default 'partials'
         **/
        partialsDirectoryPath: string
        /**
         * Override default __views__ directory path.
         * @default 'views'
         **/
        viewsDirectoryPath: string
        /**
         * Override default __layouts__ directory path.
         * @default 'layouts'
         **/
        layoutsDirectoryPath: string
    }

    export interface EntitiesConfiguration {
        /** Explicitly passed partials */
        partials: Symply.Partials
        /** Explicitly passed layouts */
        layouts: Symply.Layouts
        /** Explicitly passed views */
        views: Symply.Views
        /** Explicitly passed helpers */
        helpers: Symply.Helpers
        /** Explicitly passed globals */
        globals: Symply.Globals
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
