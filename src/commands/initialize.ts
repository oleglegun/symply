// import path from 'path'
// import logger from '../logger'
// import config from '../configuration'
// import * as filesystem  from '../filesystem'

// function initialize() {
//     /*-----------------------------------------------------------------------------
//      *  Load configuration
//      *----------------------------------------------------------------------------*/

//     const configuration = config.getConfiguration()

//     /*-----------------------------------------------------------------------------
//      *  Create system files and directories
//      *----------------------------------------------------------------------------*/

//     config.systemFilesToBeCreated.forEach(file => {
//         const fileIsCreated = createFileIfNotExists(path.join(file.dir, file.name), file.contents)

//         if (fileIsCreated) {
//             logger.info('Created file ' + file.name)
//         }
//     })

//     Object.keys(configuration)
//         .filter(key => key.endsWith('DIR_NAME'))
//         .forEach(dirNameKey => {
//             const dirName = configuration[dirNameKey]
//             const dirIsCreated = createDirectoryIfNotExists(dirName)

//             if (dirIsCreated) {
//                 logger.info(`Created directory: ${dirName}/`)
//             }
//         })
// }

// module.exports = initialize
