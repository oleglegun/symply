import configuration from '../configuration'
import * as filesystem from '../filesystem'

export function load(): Symply.Helpers {
    const helpersPath = filesystem.joinAndResolvePath(configuration.getHelpersFilePath())

    let result: Symply.Helpers = {}

    if (filesystem.existsSync(helpersPath)) {
        const helpersCode = filesystem.getFileContents(helpersPath)
        result = eval(helpersCode)
    }

    /* [Module mode] Add extra helpers if there are any available  */
    Object.assign(result, configuration.getHelpers())

    return result
}
