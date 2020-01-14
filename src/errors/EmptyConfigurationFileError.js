const ConfigurationError = require('./ConfigurationError')

class EmptyConfigurationFileError extends ConfigurationError {
    /**
     *
     * @param {string} configurationFileName
     */
    constructor(configurationFileName) {
        super(`Configuration file (${configurationFileName}) is found, but it is empty.`)
    }
}

module.exports = EmptyConfigurationFileError
