import path from 'path'
import * as filesystem from '../filesystem'
import configuration from '../configuration'

// TODO: add support for md and txt formats
const LAYOUT_EXTENSION = '.html'

export function load(): Symply.Layouts {
    const layoutsPath = configuration.getLayoutsDirectoryPath()
    const layouts = filesystem.scanFiles(layoutsPath, true, false, false)

    const result = layouts.reduce<Symply.Layouts>((acc, layout) => {
        acc[getLayoutName(layout.name)] = layout.contents
        return acc
    }, {})

    /* [Module mode] Add extra layouts if there are any available  */
    Object.assign(result, configuration.getLayouts())

    return result
}

function getLayoutName(fileName: string): string {
    return path.basename(fileName, LAYOUT_EXTENSION)
}
