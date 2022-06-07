module.exports = function (ctx, text) {
    let textToProcess

    if (ctx.renderBlockContent) {
        textToProcess = ctx.renderBlockContent()
    } else {
        textToProcess = text
    }

    return textToProcess.toLowerCase().split(' ').join('_')
}
