const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const config = require('./config')

//scan all files .html

// parse configuration

const CONFIGURATION_FILE_NAME = 'configuration.yaml'

async function main() {
    const configuration = config.getConfiguration(CONFIGURATION_FILE_NAME)
}

module.exports = main
