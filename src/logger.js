module.exports = {
    log(...strings) {
        console.log(...strings, '\n')
    },
    info(...strings) {
        console.log('INFO: ', ...strings, '\n')
    },
    error(...strings) {
        console.log('ERROR: ', ...strings, '\n')
    },
}
