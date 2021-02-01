import ConfigurationError from './ConfigurationError'

export class InvalidConfigurationError extends ConfigurationError {
    constructor(message: string) {
        super(message)
    }
}
