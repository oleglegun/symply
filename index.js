const logger = require('./src/logger')
const main = require('./src/main')

logger.log('=== Static Site Templating Engine ===')

main()
    .then(() => {
        logger.info('Generation successfully finished.')
    })
    .catch(err => {
        logger.error('Generation finished with error: ', err)
    })
