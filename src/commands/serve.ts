import opn from 'better-opn'
import logger from '../logger'


async function serve() {
    logger.info('Starting web-server')

    opn('http://localhost:3000')

}

module.exports = serve