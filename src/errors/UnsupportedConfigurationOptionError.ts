import ConfigurationError from './ConfigurationError'

export class UnsupportedConfigurationOptionError extends ConfigurationError {
    constructor(unsupportedOptionName: string, supportedOptionsNames: string[]) {
        super(
            `Configuration option '${unsupportedOptionName}' is not supported. Supported options: ${supportedOptionsNames.join(
                ', '
            )}`
        )
    }
}
