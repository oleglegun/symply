import chalk from 'chalk'
import yaml from 'js-yaml'
import _ from 'lodash'
import path from 'path'
import logger from './logger'

class Configuration {
    /*-----------------------------------------------------------------------------
     *  Explicitly passed entities to merge with those from files (module mode only)
     *----------------------------------------------------------------------------*/
    private partials: Symply.Partials = {}
    private layouts: Symply.Layouts = {}
    private globals: Symply.Globals = {}
    private views: Symply.Views = {}
    private helpers: Symply.Helpers = {}

    /*-----------------------------------------------------------------------------
     *  System configuration (default values)
     *----------------------------------------------------------------------------*/
    private debugOutput = false
    private _ignoreMissingProperties = false
    private _formatOutputHTML = false
    private _minifyOutputHTML = false
    private _omitWarnings = false
    private _ansiLogging = true
    private _clearDistributionDirectoryOnRecompile = false

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
    private partialsDirectoryPath = 'partials'
    private viewsDirectoryPath = 'views'
    private layoutsDirectoryPath = 'layouts'

    private helpersFilePath = 'symply-helpers.js'
    private globalsFilePath = 'symply-globals.js'
    private configurationFilePath = 'symply-config.yaml'

    /*-----------------------------------------------------------------------------
     *  Public methods
     *----------------------------------------------------------------------------*/

    /** Explicitly set configuration (module mode only) */
    public setModuleModeConfiguration(config: SymplyConfiguration) {
        this.partials = _.defaultTo(config.entities?.partials, this.partials)
        this.layouts = _.defaultTo(config.entities?.layouts, this.layouts)
        this.globals = _.defaultTo(config.entities?.globals, this.globals)
        this.views = _.defaultTo(config.entities?.views, this.views)
        this.helpers = _.defaultTo(config.entities?.helpers, this.helpers)

        this.debugOutput = _.defaultTo(config.debugOutput, this.debugOutput)
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
        this.partialsDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.partialsDirectoryPath,
            this.partialsDirectoryPath
        )
        this.viewsDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.viewsDirectoryPath,
            this.viewsDirectoryPath
        )
        this.layoutsDirectoryPath = this.getDirectoryPathAndAddPrefixIfNeeded(
            config.paths?.layoutsDirectoryPath,
            this.layoutsDirectoryPath
        )
        this.globalsFilePath = this.getDirectoryPathAndAddPrefixIfNeeded(undefined, this.globalsFilePath)
        this.helpersFilePath = this.getDirectoryPathAndAddPrefixIfNeeded(undefined, this.helpersFilePath)
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
    public getPartials() {
        return this.partials
    }
    public getLayouts() {
        return this.layouts
    }
    public getGlobals() {
        return this.globals
    }
    public getViews() {
        return this.views
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
    public getPartialsDirectoryPath() {
        return this.partialsDirectoryPath
    }
    public getViewsDirectoryPath() {
        return this.viewsDirectoryPath
    }
    public getLayoutsDirectoryPath() {
        return this.layoutsDirectoryPath
    }
    public getHelpersFilePath() {
        return this.helpersFilePath
    }
    public getGlobalsFilePath() {
        return this.globalsFilePath
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

    private getFilesToBeCreated(): FileSystem.FileEntry[] {
        return [
            {
                name: this.getGlobalsFilePath(),
                dirname: '.',
                contents: "module.exports = {\n\tsiteName: 'My new site',\n}",
            },
            {
                name: this.getHelpersFilePath(),
                dirname: '.',
                contents: 'module.exports = {\n\tmyCustomHelper: (data) => { return data }\n}',
            },
            {
                name: this.getConfigurationFilePath(),
                dirname: '.',
                // @ts-ignore
                contents: '# Here you can change the default configuration\n' + yaml.dump(DEFAULT_CONFIGURATION),
            },
        ]
    }
}

export default new Configuration()
