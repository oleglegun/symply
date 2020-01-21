const logger = require('./logger')
const chalk = require('chalk')

const LOGO_COLOR = '#af00ff'

const LOGO = {
    width60: `
███████╗ ████████╗ ███╗     ███╗ ████████╗  ██╗   ████████╗
████▌/═╝ ╚██████╔╝ ████╗   ████║ ███╔═══██╗ ██║   ╚██████╔╝
███████╗  ╚████╔╝  █████╗ █████║ ████████╔╝ ██║    ╚████╔╝ 
╚/▐████║   ╚██╔╝   ████████████║ ███╔════╝  ██║     ╚██╔╝  
███████║    ██║    ████████████║ ███║       ███████╗ ██║   
╚══════╝    ╚═╝    ╚═══════════╝ ╚══╝       ╚══════╝ ╚═╝   
    ======= Bootstrap Static Site Generator =======
`,
    width50: `
█████╗ ███████╗ ██╗     ██╗ █████╗  ██╗   ███████╗
██▌/═╝  █████╔╝ ███╗   ███║ ██╔═██╗ ██║    █████╔╝
╚/▐██║   ▐█▌╔╝  ████╗ ████║ █████╔╝ ██║     ▐█▌╔╝ 
█████║   ▐█▌║   ██████████║ ██╔══╝  ██████╗ ▐█▌║  
╚════╝    ╚═╝   ╚═════════╝ ╚═╝     ╚═════╝  ╚═╝  
   ==== Bootstrap Static Site Generator ====
`,
    width40: `
█████╗ █████╗ █▌   ▐█╗ ███╗   █╗  █████╗
███/═╝  ███╔╝ ██▌ ▐██║ █╔═██╗ █║   ███╔╝
╚/▐██║   █╔╝  ███ ███║ ███╔═╝ █║    █╔╝ 
█████║   █║   ███████║ █╔═╝   ████╗ █║  
╚════╝   ╚╝   ╚══════╝ ╚╝     ╚═══╝ ╚╝  
 == Bootstrap Static Site Generator ==
`,
    width30: `
╔══════════ SYMPLY ══════════╗
║      Bootstrap Static      ║
║       Site Generator       ║
╚════════════════════════════╝
`,
    width20: `
┌───── SYMPLY ─────┐
│ Bootstrap Static │
│  Site Generator  │
└──────────────────┘
`,
}

function printLogo(targetWidth) {
    let logo
    if (targetWidth >= 60) {
        logo = addPaddingToCenterLogo(LOGO.width60, 60, targetWidth)
    } else if (targetWidth >= 50) {
        logo = addPaddingToCenterLogo(LOGO.width50, 50, targetWidth)
    } else if (targetWidth >= 40) {
        logo = addPaddingToCenterLogo(LOGO.width40, 40, targetWidth)
    } else if (targetWidth >= 30) {
        logo = addPaddingToCenterLogo(LOGO.width30, 30, targetWidth)
    } else if (targetWidth >= 20) {
        logo = addPaddingToCenterLogo(LOGO.width20, 20, targetWidth)
    } else {
        logo = '=== SYMPLY ==='
    }

    logger.log(chalk.hex(LOGO_COLOR)(logo))
}

/**
 *
 * @param {string} logo
 * @param {number} logoWidth
 * @param {number} targetWidth
 * @return {string}
 */
function addPaddingToCenterLogo(logo, logoWidth, targetWidth) {
    const padding = ' '.repeat(Math.floor((targetWidth - logoWidth) / 2))
    return logo
        .split('\n')
        .map(line => padding + line)
        .join('\n')
}

module.exports = {
    printLogo,
}
