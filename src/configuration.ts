import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'

import * as filesystem from './filesystem'
import logger from './logger'
import * as jsoncParser from './tools/jsoncParser'

class Configuration {
    /*-----------------------------------------------------------------------------
     *  Explicitly passed entities to merge with those from files (module mode only)
     *----------------------------------------------------------------------------*/
    private _globals: Symply.Globals = {}
    private _partials: Symply.Partials = {}
    private _helpers: Symply.Helpers = {}
    private _actions: Symply.ActionsConfiguration = {}

    public get globals() {
        return this._globals
    }
    public get partials() {
        return this._partials
    }
    public get helpers() {
        return this._helpers
    }
    public get actions() {
        return this._actions
    }

    /*-----------------------------------------------------------------------------
     *  System configuration (default values)
     *----------------------------------------------------------------------------*/
    private _debugOutput = false
    private _ignoreMissingProperties = false
    private _formatOutputHTML = false
    private _minifyOutputHTML = false
    private _omitWarnings = false
    private _ansiLogging = true
    private _clearDistributionDirectoryOnRecompile = false

    public get debugOutput() {
        return this._debugOutput
    }
    public get ignoreMissingProperties() {
        return this._ignoreMissingProperties
    }
    public get formatOutputHTML() {
        return this._formatOutputHTML
    }
    public get minifyOutputHTML() {
        return this._minifyOutputHTML
    }
    public get omitWarnings() {
        return this._omitWarnings
    }
    public get ansiLogging() {
        return this._ansiLogging
    }
    public get clearDistributionDirectoryOnRecompile() {
        return this._clearDistributionDirectoryOnRecompile
    }

    /*-----------------------------------------------------------------------------
     *  Paths (default values)
     *----------------------------------------------------------------------------*/
    private defaultDirectoriesPrefix = ''

    private _sourceDirectoryPath: Symply.ConfigurableDirectoryPath = { default: 'src', custom: null }
    private _distributionDirectoryPath: Symply.ConfigurableDirectoryPath = { default: 'dist', custom: null }
    private _globalsDirectoryPath: Symply.ConfigurableDirectoryPath = { default: 'globals', custom: null }
    private _partialsDirectoryPath: Symply.ConfigurableDirectoryPath = { default: 'partials', custom: null }
    private _helpersDirectoryPath: Symply.ConfigurableDirectoryPath = { default: 'helpers', custom: null }

    public get sourceDirectoryPath() {
        return this.getPrefixedDirectoryPath(this._sourceDirectoryPath)
    }
    public get distributionDirectoryPath() {
        return this.getPrefixedDirectoryPath(this._distributionDirectoryPath)
    }
    public get globalsDirectoryPath() {
        return this.getPrefixedDirectoryPath(this._globalsDirectoryPath)
    }
    public get partialsDirectoryPath() {
        return this.getPrefixedDirectoryPath(this._partialsDirectoryPath)
    }
    public get helpersDirectoryPath() {
        return this.getPrefixedDirectoryPath(this._helpersDirectoryPath)
    }

    /*-----------------------------------------------------------------------------
     *  Files configuration (default values)
     *----------------------------------------------------------------------------*/
    private configurationFilePathList = ['symply-config.json', 'symply-config.jsonc']

    private _filesConfiguration: Symply.FilesConfiguration = {
        all: {
            include: ['**/*'],
            exclude: [],
        },
        templates: {
            include: ['**/*'],
            exclude: [],
        },
        styles: {
            include: ['**/*'],
            exclude: [],
        },
        js: {
            include: ['**/*'],
            exclude: [],
        },
        ts: {
            include: ['**/*'],
            exclude: [],
            compilerOptions: {},
        },
    }

    public get filesConfiguration() {
        return this._filesConfiguration
    }

    /*-----------------------------------------------------------------------------
     *  Public methods
     *----------------------------------------------------------------------------*/
    public loadConfigurationFromConfigFile(): SymplyConfiguration | null {
        for (let i = 0; i < this.configurationFilePathList.length; i++) {
            const configurationFilePath = this.configurationFilePathList[i]

            try {
                const configuration = jsoncParser.parse<SymplyConfiguration>(
                    filesystem.getFileContents(configurationFilePath)
                )

                logger.info(`Detected ${chalk.blueBright(configurationFilePath)} configuration file.`)

                if (configuration === undefined) {
                    logger.warning(`Cannot parse configuration file.`)
                    break
                }

                return configuration
            } catch (err) {
                if (this.isErrorWithCodeProperty(err)) {
                    if (err.code === 'ENOENT') {
                        continue
                    }
                }

                throw err
            }
        }

        return null
    }

    public mergeConfigurationAndVerify(config: SymplyConfiguration) {
        this._globals = _.defaultsDeep(config.entities?.globals, this._globals)
        this._partials = _.defaultsDeep(config.entities?.partials, this._partials)
        this._helpers = _.defaultsDeep(config.entities?.helpers, this._helpers)
        this._actions = config.actions ?? this._actions

        this._debugOutput = config.debugOutput ?? this._debugOutput
        this._ignoreMissingProperties = config.ignoreMissingProperties ?? this._ignoreMissingProperties
        this._formatOutputHTML = config.formatOutputHTML ?? this._formatOutputHTML
        this._minifyOutputHTML = config.minifyOutputHTML ?? this._minifyOutputHTML
        this._omitWarnings = config.omitWarnings ?? this._omitWarnings
        this._ansiLogging = config.ansiLogging ?? this._ansiLogging
        this._clearDistributionDirectoryOnRecompile =
            config.clearDistributionDirectoryOnRecompile ?? this._clearDistributionDirectoryOnRecompile

        this.defaultDirectoriesPrefix = config.paths?.defaultDirectoriesPrefix ?? this.defaultDirectoriesPrefix

        this._sourceDirectoryPath.custom = config.paths?.sourceDirectoryPath ?? this._sourceDirectoryPath.custom
        this._distributionDirectoryPath.custom =
            config.paths?.distributionDirectoryPath ?? this._distributionDirectoryPath.custom
        this._globalsDirectoryPath.custom = config.paths?.globalsDirectoryPath ?? this._globalsDirectoryPath.custom
        this._partialsDirectoryPath.custom = config.paths?.partialsDirectoryPath ?? this._partialsDirectoryPath.custom
        this._helpersDirectoryPath.custom = config.paths?.helpersDirectoryPath ?? this._helpersDirectoryPath.custom

        this._filesConfiguration = _.defaultsDeep(config.files, this._filesConfiguration)

        this.validateConfiguration()
    }

    private validateConfiguration() {
        const RESTRICTED_DIST_PATHS = ['/', '.', './', '../']

        if (RESTRICTED_DIST_PATHS.indexOf(this.distributionDirectoryPath) !== -1) {
            logger.error(
                `You cannot set distribution directory path to any of the [ ${RESTRICTED_DIST_PATHS.join(' ')} ].` +
                    ` On each generation, SYMPLY deletes all files in the distribution directory (default: ${chalk.blueBright(
                        'dist/'
                    )}), thus your non-SYMPLY related files will be deleted.`
            )
            process.exit(1)
        }
    }

    /*-----------------------------------------------------------------------------
     *  Private methods
     *----------------------------------------------------------------------------*/
    private getPrefixedDirectoryPath(directoryPath: Symply.ConfigurableDirectoryPath) {
        if (directoryPath.custom !== null && directoryPath.custom.length > 0) {
            return directoryPath.custom
        }
        return path.join(this.defaultDirectoriesPrefix, directoryPath.default)
    }

    private isErrorWithCodeProperty(error: unknown): error is Error & { code: string } {
        return error instanceof Error && typeof Reflect.get(error, 'code') === 'string'
    }
}

export default new Configuration()
