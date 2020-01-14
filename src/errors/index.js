const InvalidConfigurationError = require('./InvalidConfigurationError')
const UnsupportedConfigurationOptionError = require('./UnsupportedConfigurationOptionError')
const MissingRequiredConfigurationOptionError = require('./MissingRequiredConfigurationOptionError')
const EmptyConfigurationFileError = require('./EmptyConfigurationFileError')

module.exports = {
    InvalidConfigurationError,
    UnsupportedConfigurationOptionError,
    MissingRequiredConfigurationOptionError,
    EmptyConfigurationFileError
}
