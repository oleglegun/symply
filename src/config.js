const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const logger = require('./logger')
const {
    UnsupportedConfigurationOptionError,
    EmptyConfigurationFileError,
    InvalidConfigurationError,
    MissingRequiredConfigurationOptionError,
} = require('./errors')

// Mandatory configuration keys
const DEFAULT_CONFIGURATION = {
    SOURCE_DIR_NAME: 'source',
    TEMPLATE_DIR_NAME: 'templates',
    VIEWS_DIR_NAME: 'views',
    DISTRIBUTION_DIR_NAME: 'dist',
    PARTIALS_DIR_NAME: 'partials',
}

const HELPERS_FILE_NAME = 'symply-helpers.js'
const GLOBALS_FILE_NAME = 'symply-globals.js'

const systemFilesToBeCreated = [
    {
        name: HELPERS_FILE_NAME,
        dir: '.',
        contents: 'module.exports = {\n\t\n}'
    },
    {
        name: GLOBALS_FILE_NAME,
        dir: '.',
        contents: 'module.exports = {\n\tsiteName: \'My new site\',\n}'
    }
]



 function getConfiguration(configurationFilename) {
    try {
        const configuration = yaml.safeLoad(
            fs.readFileSync(path.join(process.cwd(), configurationFilename), { encoding: 'utf8' })
        )

        if (!configuration) {
            throw new EmptyConfigurationFileError(configurationFilename)
        }

        verifyConfiguration(configuration)

        return configuration
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.info(
                `Configuration file (${configurationFilename}) is not found. Using default configuration:\n`,
                JSON.stringify(DEFAULT_CONFIGURATION, null, 2)
            )
            return DEFAULT_CONFIGURATION
        } else if (err instanceof UnsupportedConfigurationOptionError) {
            logger.error(err.message)
            process.exit(0)
        } else if (err instanceof MissingRequiredConfigurationOptionError) {
            logger.error(err.message)
            process.exit(0)
        } else if (err instanceof EmptyConfigurationFileError) {
            logger.info(err.message)
            logger.info(`Using default configuration:\n`, JSON.stringify(DEFAULT_CONFIGURATION, null, 2))
            return DEFAULT_CONFIGURATION
        } else {
            logger.error(err)
            process.exit(0)
        }
    }
}

function verifyConfiguration(configurationObject) {
    const defaultConfigurationKeys = Object.keys(DEFAULT_CONFIGURATION)
    const customConfigurationKeys = Object.keys(configurationObject)

    customConfigurationKeys.forEach(key => {
        if (defaultConfigurationKeys.indexOf(key) === -1) {
            throw new UnsupportedConfigurationOptionError(key, defaultConfigurationKeys)
        }
    })

    defaultConfigurationKeys.forEach(key => {
        if (customConfigurationKeys.indexOf(key) === -1) {
            throw new MissingRequiredConfigurationOptionError(key, defaultConfigurationKeys)
        }
    })
}

module.exports = {
    getConfiguration,
    systemFilesToBeCreated,
    GLOBALS_FILE_NAME,
    HELPERS_FILE_NAME
}