import path from 'path'
import yaml from 'js-yaml'
import * as filesystem from '../filesystem'
import configuration from '../configuration'

// TODO add support for nested dir structure
enum VIEW_EXTENSION {
    JSON = '.json',
    YAML = '.yaml',
    JS = '.js',
}

export function load(): Symply.Views {
    const viewsPath = configuration.getViewsDirectoryPath()
    const views = filesystem.scanFiles(viewsPath, true, false, false)

    let parsedContents
    let viewName

    const result = views.reduce<Symply.Views>((acc, view) => {
        const fileName = view.name

        switch (path.extname(fileName)) {
            case VIEW_EXTENSION.JSON:
                parsedContents = JSON.parse(view.contents)
                viewName = getViewName(fileName, VIEW_EXTENSION.JSON)
                break
            case VIEW_EXTENSION.YAML:
                parsedContents = yaml.safeLoad(view.contents)
                viewName = getViewName(fileName, VIEW_EXTENSION.YAML)
                break
            case VIEW_EXTENSION.JS:
                parsedContents = eval(view.contents)
                viewName = getViewName(fileName, VIEW_EXTENSION.JS)
                break
            default:
                throw new Error('View file type is not supported: ' + path.extname(fileName))
        }
        if (acc[viewName]) {
            throw new Error('Views with the same file name, but different extensions are not supported.')
        }

        acc[viewName] = parsedContents

        return acc
    }, {})

    /* [Module mode] Add extra views if there are any available  */
    Object.assign(result, configuration.getViews())

    return result
}

function getViewName(fileName: string, extension: string): string {
    return path.basename(fileName, extension)
}
