import * as minifier from 'html-minifier'

export function minify(htmlInputText: string) {
    return minifier.minify(htmlInputText, {
        minifyJS: {
            mangle: true,
            compress: {
                sequences: true,
                dead_code: true,
                conditionals: true,
                booleans: true,
                unused: true,
                if_return: true,
                join_vars: true,
                drop_console: true,
            },
        },
        minifyCSS: true,
        collapseWhitespace: true,
        removeComments: true,
    })
}
