import ConfigurationError from './ConfigurationError'

export class MissingRequiredConfigurationOptionError extends ConfigurationError {
    constructor(requiredOptionName: string, requiredOptionNames: string[]) {
        super(
            `Required configuration option '${requiredOptionName}' is missing. Required options are ${requiredOptionNames.join(
                ', '
            )}`
        )
    }
}
