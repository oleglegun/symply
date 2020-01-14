const ConfigurationError = require('./ConfigurationError')

class MissingRequiredConfigurationOptionError extends ConfigurationError {
    /**
     *
     * @param {string} requiredOptionName
     * @param {string[]} requiredOptionNames
     */
    constructor(requiredOptionName, requiredOptionNames) {
        super(
            `Required configuration option '${requiredOptionName}' is missing. Required options are ${requiredOptionNames.join(
                ', '
            )}`
        )
    }
}

module.exports = MissingRequiredConfigurationOptionError
