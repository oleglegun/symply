const logger = require('./logger')

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
█████╗ ███████╗ ██╗     ██╗ █████╗  ██╗  ███████╗
██▌/═╝  █████╔╝ ███╗   ███║ ██╔═██╗ ██║   █████╔╝
╚/▐██║    █╔═╝  ████╗ ████║ █████╔╝ ██║     █╔═╝ 
█████║    █║    ██████████║ ██╔══╝  ██████╗ █║   
╚════╝    ╚╝    ╚═════════╝ ╚═╝     ╚═════╝ ╚╝   
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
    if (targetWidth >= 60) {
        logger.log(addPaddingToCenterLogo(LOGO.width60, 60, targetWidth))
    } else if (targetWidth >= 50) {
        logger.log(addPaddingToCenterLogo(LOGO.width50, 50, targetWidth))
    } else if (targetWidth >= 40) {
        logger.log(addPaddingToCenterLogo(LOGO.width40, 40, targetWidth))
    } else if (targetWidth >= 30) {
        logger.log(addPaddingToCenterLogo(LOGO.width30, 30, targetWidth))
    } else if (targetWidth >= 20) {
        logger.log(addPaddingToCenterLogo(LOGO.width20, 20, targetWidth))
    } else {
        logger.log('=== SYMPLY ===')
    }
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
