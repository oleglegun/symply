const ConfigurationError = require('./ConfigurationError')

class InvalidConfigurationError extends ConfigurationError {
    /**
     * 
     * @param {string} message 
     */
    constructor(message) {
        super(message)
    }
}

module.exports = InvalidConfigurationError
