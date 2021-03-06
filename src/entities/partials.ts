import path from 'path'
import * as filesystem from '../filesystem'
import configuration from '../configuration'

// TODO: add support for .md and .txt formats
const PARTIAL_EXTENTION = '.html'

export function load(): Symply.Partials {
    const partialsPath = configuration.getPartialsDirectoryPath()
    const partials = filesystem.scanFiles(partialsPath, true, false, true)
    
    // change nestes partials names to include its enclosing folder
    partials.map((partial) => {
        if (partial.dirname !== partialsPath) {
            const enclosingDirName = partial.dirname.replace(partialsPath + path.sep, '')
            partial.name = enclosingDirName + path.sep + partial.name
            partial.dirname = partialsPath
        }
        return partial
    })

    const result = partials.reduce<Symply.Partials>((acc, partial) => {
        acc[getPartialName(partial.name)] = partial.contents
        return acc
    }, {})

    /* [Module mode] Add extra partials if there are any available  */
    Object.assign(result, configuration.getPartials())

    return result
}

function getPartialName(fileName: string): string {
    return fileName.replace(new RegExp(PARTIAL_EXTENTION + '$'), '')
}
