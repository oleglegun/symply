const ConfigurationError = require('./ConfigurationError')

class UnsupportedConfigurationOptionError extends ConfigurationError {
    /**
     *
     * @param {string} unsupportedOptionName
     * @param {string[]} supportedOptionsNames
     */
    constructor(unsupportedOptionName, supportedOptionsNames) {
        super(
            `Configuration option '${unsupportedOptionName}' is not supported. Supported options: ${supportedOptionsNames.join(
                ', '
            )}`
        )
    }
}

module.exports = UnsupportedConfigurationOptionError