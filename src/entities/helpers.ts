import path from 'path'
import * as filesystem from '../filesystem'
import configuration from '../configuration'
import * as babel from '@babel/core'
// @ts-ignore
import babelPresetReact from '@babel/preset-react'
import React from 'react' // needed for Babel eval()
import ReactDOMServer from 'react-dom/server'
import _ from 'lodash'

export function load(): Symply.Helpers {
    const helpersPath = filesystem.joinAndResolvePath(configuration.getHelpersFilePath())

    let result: Symply.Helpers = {}

    if (!filesystem.existsSync(helpersPath)) {
        return result
    }

    const helpersCode = filesystem.getFileContents(helpersPath)

    if (configuration.jsxSupportInHelpers) {
        const transpileResult = babel.transformSync(helpersCode, {
            presets: [babelPresetReact],
        })
        const transpiledHelpers: Symply.Helpers = eval(_.defaultTo(transpileResult?.code, '{}'))

        Object.keys(transpiledHelpers).forEach((helperName) => {
            result[helperName] = renderJsxOutputToStringDecorator(transpiledHelpers[helperName])
        })
    } else {
        result = eval(helpersCode)
    }

    /* [Module mode] Add extra helpers if there are any available (no JSX support)  */
    Object.assign(result, configuration.getHelpers())

    return result
}

function renderJsxOutputToStringDecorator(fn: (...args: any[]) => any) {
    return function (...args: any[]) {
        let result = fn(...args)

        if (result && typeof result !== 'string' && result.$$typeof === Symbol.for('react.element')) {
            result = ReactDOMServer.renderToStaticMarkup(result)
        }

        return result
    }
}
