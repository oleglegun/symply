import path from 'path'
import yaml from 'js-yaml'
import * as filesystem from '../filesystem'
import configuration from '../configuration'
import logger from '../logger'
import chalk from 'chalk'

// TODO add support for nested dir structure
enum VIEW_EXTENSION {
    JSON = '.json',
    YAML = '.yaml',
    JS = '.js',
}

export function load(): Symply.Views {
    const viewsPath = configuration.getViewsDirectoryPath()
    const views = filesystem.scanFiles(viewsPath, true, false, true)

    let parsedContents
    let viewName

    // change nestes views names to include its enclosing folder
    views.forEach((view) => {
        if (view.dirname !== viewsPath) {
            const enclosingDirName = view.dirname.replace(viewsPath + path.sep, '')
            view.name = enclosingDirName + path.sep + view.name
            view.dirname = viewsPath
        }
        return view
    })

    const result = views.reduce<Symply.Views>((acc, view) => {
        const fileName = view.name

        switch (path.extname(fileName)) {
            case VIEW_EXTENSION.JSON:
                parsedContents = JSON.parse(view.contents)
                viewName = getViewName(fileName, VIEW_EXTENSION.JSON)
                break
            case VIEW_EXTENSION.YAML:
                parsedContents = yaml.load(view.contents)
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
    
    if (configuration.debugOutput) {
        logger.debug('Registered views:')
        Object.keys(result).forEach((key) => {
            logger.log(chalk.green(key))
        })
        logger.log()
    }

    return result
}

function getViewName(fileName: string, extension: string): string {
    return fileName.replace(new RegExp(extension + '$'), '')
}
