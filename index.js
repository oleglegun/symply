const logger = require('./src/logger')
const main = require('./src/main')
const { logo } = require('./src/strings')

logger.log(logo)

main().catch(err => {
    logger.error('Generation finished with error: ', err)
})
