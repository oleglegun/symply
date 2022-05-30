import * as jsoncParser from 'jsonc-parser'

export function parse<T>(textInput: string): T {
    return jsoncParser.parse(textInput)
}
