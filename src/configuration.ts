import chalk from 'chalk'
import _ from 'lodash'
import path from 'path'
import logger from './logger'

class Configuration {
    /*-----------------------------------------------------------------------------
     *  Explicitly passed entities to merge with those from files (module mode only)
     *----------------------------------------------------------------------------*/
    private globals: Symply.Globals = {}
    private partials: Symply.Partials = {}
    private helpers: Symply.Helpers = {}

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
    public get ignoreMissingProperties() {
        return this._ignoreMissingProperties
    }

    /*-----------------------------------------------------------------------------
     *  Paths (default values)
     *----------------------------------------------------------------------------*/
    private defaultDirectoriesPrefix = ''
    private sourceDirectoryPath = 'src'
    private distributionDirectoryPath = 'dist'
    private globalsDirectoryPath = 'globals'
    private partialsDirectoryPath = 'partials'
    private helpersDirectoryPath = 'helpers'

    private configurationFilePath = 'symply-config.yaml'

    /*-----------------------------------------------------------------------------
     *  Public methods
     *----------------------------------------------------------------------------*/

    /** Explicitly set configuration (module mode only) */
    public setModuleModeConfiguration(config: SymplyConfiguration) {
        this.globals = _.defaultTo(config.entities?.globals, this.globals)
        this.partials = _.defaultTo(config.entities?.partials, this.partials)
        this.helpers = _.defaultTo(config.entities?.helpers, this.helpers)

        this._debugOutput = _.defaultTo(config.debugOutput, this._debugOutput)
        this._ignoreMissingProperties = _.defaultTo(config.ignoreMissingProperties, this.ignoreMissingProperties)
        this._formatOutputHTML = _.defaultTo(config.formatOutputHTML, this._formatOutputHTML)
        this._minifyOutputHTML = _.defaultTo(config.minifyOutputHTML, this._minifyOutputHTML)
        this._omitWarnings = _.defaultTo(config.omitWarnings, this._omitWarnings)
        this._ansiLogging = _.defaultTo(config.ansiLogging, this._ansiLogging)
        this._clearDistributionDirectoryOnRecompile = _.defaultTo(
            config.clearDistributionDirectoryOnRecompile,
            this.clearDistributionDirectoryOnRecompile
        )

        this.defaultDirectoriesPrefix = _.defaultTo(
            config.paths?.defaultDirectoriesPrefix,
            this.defaultDirectoriesPrefix
        )

        /*-----------------------------------------------------------------------------
         *  Initialize all directories and (if needed) add prefixes to all default ones
         *----------------------------------------------------------------------------*/
        this.sourceDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.sourceDirectoryPath,
            this.sourceDirectoryPath
        )
        this.distributionDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.distributionDirectoryPath,
            this.distributionDirectoryPath
        )
        this.globalsDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.globalsDirectoryPath,
            this.globalsDirectoryPath
        )
        this.partialsDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.partialsDirectoryPath,
            this.partialsDirectoryPath
        )
        this.helpersDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.helpersDirectoryPath,
            this.helpersDirectoryPath
        )

        this.configurationFilePath = this.getDirectoryPathAndAddPrefixIfNeeded(undefined, this.configurationFilePath)

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
     *  Public entities getters
     *----------------------------------------------------------------------------*/
    public getGlobals() {
        return this.globals
    }
    public getPartials() {
        return this.partials
    }
    public getHelpers() {
        return this.helpers
    }

    /*-----------------------------------------------------------------------------
     *  Public path getters
     *----------------------------------------------------------------------------*/
    public getSourceDirectoryPath() {
        return this.sourceDirectoryPath
    }
    public getDistributionDirectoryPath() {
        return this.distributionDirectoryPath
    }
    public getGlobalsDirectoryPath() {
        return this.globalsDirectoryPath
    }
    public getPartialsDirectoryPath() {
        return this.partialsDirectoryPath
    }
    public getHelpersDirectoryPath() {
        return this.helpersDirectoryPath
    }
    public getConfigurationFilePath() {
        return this.configurationFilePath
    }

    /*-----------------------------------------------------------------------------
     *  Private methods
     *----------------------------------------------------------------------------*/
    private getDirectoryPathAndAddPrefixIfNeeded(
        newDirectoryPath: string | undefined,
        defaultDirectoryPath: string
    ): string {
        if (this.defaultDirectoriesPrefix.length > 0) {
            if (!newDirectoryPath) {
                return path.join(this.defaultDirectoriesPrefix, defaultDirectoryPath)
            } else {
                return newDirectoryPath
            }
        } else {
            return _.defaultTo(newDirectoryPath, defaultDirectoryPath)
        }
    }
}

export default new Configuration()
