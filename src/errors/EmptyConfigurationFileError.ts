import ConfigurationError from './ConfigurationError'

export class EmptyConfigurationFileError extends ConfigurationError {
    constructor(configurationFileName: string) {
        super(`Configuration file (${configurationFileName}) is found, but it is empty.`)
    }
}

