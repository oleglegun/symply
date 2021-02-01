export const Commands = {
    INIT: {
        name: 'init',
        description: 'Initialize project creating necessary files and directories',
    },
    GENERATE: {
        name: 'generate',
        description: 'Compile and generate static site files',
        alias: 'start',
    },
    CONFIGURATION: {
        name: 'config',
        description: 'Print current generator configuration',
    },
    SERVE: {
        name: 'serve',
        description: 'Start development server in distribution folder',
    },
    BOOTSTRAP: {
        name: 'bootstrap',
        description: 'Generate simple test Bootstrap project in current directory',
    },
    HELP: {
        name: 'help',
        description: 'Show help information',
        alias: 'h',
    },
}
