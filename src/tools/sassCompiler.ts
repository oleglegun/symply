import sass from 'sass'

export function compile(sassInputText: string, absolutePathToLoadImports: string) {
    return sass.compileString(sassInputText, { loadPaths: [absolutePathToLoadImports] }).css
}
