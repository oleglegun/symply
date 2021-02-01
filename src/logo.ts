import logger from './logger'
import chalk from 'chalk'

const LOGO = {
    width60: `
███████╗ ████████╗ ███╗     ███╗ ████████╗  ██╗   ████████╗
████▌══╝ ╚██████╔╝ ████╗   ████║ ███╔═══██╗ ██║   ╚██████╔╝
███████╗  ╚████╔╝  █████╗ █████║ ████████╔╝ ██║    ╚████╔╝ 
╚═▐████║   ╚██╔╝   ████████████║ ███╔════╝  ██║     ╚██╔╝  
███████║    ██║    ████████████║ ███║       ███████╗ ██║   
╚══════╝    ╚═╝    ╚═══════════╝ ╚══╝       ╚══════╝ ╚═╝   
      ======= Simple Static Site Generator =======
`,
    width50: `
█████╗ ███████╗ ██╗     ██╗ █████╗  ██╗   ███████╗
██▌══╝  █████╔╝ ███╗   ███║ ██╔═██╗ ██║    █████╔╝
╚═▐██║   ▐█▌╔╝  ████╗ ████║ █████╔╝ ██║     ▐█▌╔╝ 
█████║   ▐█▌║   ██████████║ ██╔══╝  ██████╗ ▐█▌║  
╚════╝    ╚═╝   ╚═════════╝ ╚═╝     ╚═════╝  ╚═╝  
     ==== Simple Static Site Generator ====
`,
    width30: `
╔══════════ SYMPLY ══════════╗
║           Simple           ║
║    Static Site Generator   ║
╚════════════════════════════╝
`,
    width20: `
┌───── SYMPLY ─────┐
│   Simple Static  │
│  Site Generator  │
└──────────────────┘
`,
}

export function printLogo(targetWidth: number): void {
    let logo
    if (targetWidth >= 60) {
        logo = addPaddingToCenterLogo(LOGO.width60, 60, targetWidth)
    } else if (targetWidth >= 50) {
        logo = addPaddingToCenterLogo(LOGO.width50, 50, targetWidth)
    } else if (targetWidth >= 30) {
        logo = addPaddingToCenterLogo(LOGO.width30, 30, targetWidth)
    } else if (targetWidth >= 20) {
        logo = addPaddingToCenterLogo(LOGO.width20, 20, targetWidth)
    } else {
        logo = '=== SYMPLY ==='
    }

    logger.log(chalk.yellow(logo))
}

function addPaddingToCenterLogo(logo: string, logoWidth: number, targetWidth: number): string {
    const padding = ' '.repeat(Math.floor((targetWidth - logoWidth) / 2))
    return logo
        .split('\n')
        .map((line) => padding + line)
        .join('\n')
}
