import * as ts from 'typescript'

import configuration from '../configuration'

export function transpile(tsInputText: string) {
    return ts.transpileModule(tsInputText, {
        compilerOptions: Object.assign(
            {},
            { module: ts.ModuleKind.CommonJS },
            configuration.filesConfiguration.ts.compilerOptions
        ),
    }).outputText
}
