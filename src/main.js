const fs = require('fs')
const path = require('path')
const logger = require('./logger')
const config = require('./config')
const { loadTemplates } = require('./templates')
const { scanFiles } = require('./fs-helpers')

const CONFIGURATION_FILE_NAME = 'configuration.yaml'

async function main() {
    const configuration = config.getConfiguration(CONFIGURATION_FILE_NAME)
    const templates = loadTemplates(configuration.TEMPLATE_DIR_NAME)
    const sourceFiles = scanFiles(configuration.SOURCE_DIR_NAME, true)
}

module.exports = main

// const templates = getTemplates()
