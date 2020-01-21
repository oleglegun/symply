const fs = require('fs')
const path = require('path')
const yaml = require('js-yaml')
const logger = require('./logger')
const {
    UnsupportedConfigurationOptionError,
    EmptyConfigurationFileError,
} = require('./errors')


const DEFAULT_CONFIGURATION = {
    // directories
    SOURCE_DIR_NAME: 'src',
    DISTRIBUTION_DIR_NAME: 'dist',
    PARTIALS_DIR_NAME: 'partials',
    VIEWS_DIR_NAME: 'views',
    LAYOUTS_DIR_NAME: 'layouts',

    // other options
    IGNORE_MISSING_PROPERTIES: false,
}

const HELPERS_FILE_NAME = 'symply-helpers.js'
const GLOBALS_FILE_NAME = 'symply-globals.js'
const CONFIGURATION_FILE_NAME = 'symply-config.yaml'

const systemFilesToBeCreated = [
    {
        name: GLOBALS_FILE_NAME,
        dir: '.',
        contents: "module.exports = {\n\tsiteName: 'My new site',\n}",
    },
    {
        name: HELPERS_FILE_NAME,
        dir: '.',
        contents: 'module.exports = {\n\tmyCustomHelper: (data) => { return data }\n}',
    },
    {
        name: CONFIGURATION_FILE_NAME,
        dir: '.',
        contents:
            '# Here you can change the default configuration\n' + yaml.dump(DEFAULT_CONFIGURATION),
    },
]

/**
 * @return {DEFAULT_CONFIGURATION}
 */
function getConfiguration() {
    try {
        const configuration = yaml.safeLoad(
            fs.readFileSync(path.join(process.cwd(), CONFIGURATION_FILE_NAME), { encoding: 'utf8' })
        )

        if (!configuration) {
            throw new EmptyConfigurationFileError(CONFIGURATION_FILE_NAME)
        }

        verifyConfiguration(configuration)

        return { ...DEFAULT_CONFIGURATION, ...configuration }
    } catch (err) {
        if (err.code === 'ENOENT') {
            logger.info(`Configuration file (${CONFIGURATION_FILE_NAME}) is not found. Using default configuration.`)
            return DEFAULT_CONFIGURATION
        } else if (err instanceof UnsupportedConfigurationOptionError) {
            logger.error(err.message)
            process.exit(0)
            // } else if (err instanceof MissingRequiredConfigurationOptionError) {
            //     logger.error(err.message)
            //     process.exit(0)
        } else if (err instanceof EmptyConfigurationFileError) {
            logger.info(err.message)
            logger.info(
                `Using default configuration:\n`,
                getPrintableConfigurationRepresentation(DEFAULT_CONFIGURATION)
            )
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

    // defaultConfigurationKeys.forEach(key => {
    //     if (customConfigurationKeys.indexOf(key) === -1) {
    //         throw new MissingRequiredConfigurationOptionError(key, defaultConfigurationKeys)
    //     }
    // })
}

/**
 * @param {Object<string, any>} configObject
 * @return {string}
 */
function getPrintableConfigurationRepresentation(configObject) {
    let result = ''
    const paddingChars = '   '

    Object.keys(configObject).forEach(key => {
        const value = typeof configObject[key] === 'string' ? `'${configObject[key]}'` : configObject[key]

        result += `${paddingChars}${key}: ${value}\n`
    })

    return result
}

module.exports = {
    getConfiguration,
    systemFilesToBeCreated,
    GLOBALS_FILE_NAME,
    HELPERS_FILE_NAME,
    CONFIGURATION_FILE_NAME,
}
