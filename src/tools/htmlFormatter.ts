import prettier from 'prettier'

export function format(htmlInputText: string) {
    return prettier.format(htmlInputText, { parser: 'html' })
}
