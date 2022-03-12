import ProgressBar from '../progressBar'
import * as filesystem from '../filesystem'
import path from 'path'
import { exec } from 'child_process'
import logger from '../logger'

export async function runPreBuildAsync(actionList?: Symply.Action[]): Promise<void> {
    if (!actionList || actionList.length === 0) {
        return
    }

    const actionRunProgress = new ProgressBar(actionList.length)

    for (let idx = 0; idx < actionList.length; idx++) {
        const action = actionList[idx]
        actionRunProgress.tick(`Running PRE-BUILD actions:`, `${idx + 1}/${actionList.length}`)
        await runAction(action)
    }
}

export async function runPostBuildAsync(actionList?: Symply.Action[]): Promise<void> {
    if (!actionList || actionList.length === 0) {
        return
    }

    const actionRunProgress = new ProgressBar(actionList.length)

    for (let idx = 0; idx < actionList.length; idx++) {
        const action = actionList[idx]
        actionRunProgress.tick(`Running POST-BUILD actions:`, `${idx + 1}/${actionList.length}`)
        await runAction(action)
    }
}

async function runAction(action: Symply.Action): Promise<void> {
    switch (action.type) {
        case 'COPY_FILE': {
            await filesystem.copyFileAsync(joinPathIfArray(action.fromFilePath), joinPathIfArray(action.toFilePath))
            break
        }
        case 'COPY_FILE_TO_DIR': {
            await filesystem.copyFileToDirectoryAsync(
                joinPathIfArray(action.fromFilePath),
                joinPathIfArray(action.toDirPath)
            )
            break
        }
        case 'COPY_FILES_TO_DIR': {
            filesystem.copyOrMoveFilesToDirectory(
                'COPY',
                joinPathIfArray(action.fromDirPath),
                joinPathIfArray(action.toDirPath),
                action.filterFunc
            )
            break
        }
        case 'MOVE_FILE': {
            filesystem.moveFile(joinPathIfArray(action.fromFilePath), joinPathIfArray(action.toFilePath))
            break
        }
        case 'MOVE_FILES_TO_DIR': {
            filesystem.copyOrMoveFilesToDirectory(
                'MOVE',
                joinPathIfArray(action.fromDirPath),
                joinPathIfArray(action.toDirPath),
                action.filterFunc
            )
            break
        }
        case 'COPY_DIR': {
            filesystem.copyDirectory(joinPathIfArray(action.fromDirPath), joinPathIfArray(action.toDirPath))
            break
        }
        case 'MOVE_DIR': {
            filesystem.moveDirectory(joinPathIfArray(action.fromDirPath), joinPathIfArray(action.toDirPath))
            break
        }
        case 'COPY_DIR_TO_DIR': {
            const fromDirPath = joinPathIfArray(action.fromDirPath)
            const toDirPath = path.join(joinPathIfArray(action.toParentDirPath), path.basename(fromDirPath))
            filesystem.copyDirectory(fromDirPath, toDirPath)
            break
        }
        case 'MOVE_DIR_TO_DIR': {
            const fromDirPath = joinPathIfArray(action.fromDirPath)
            const toDirPath = path.join(joinPathIfArray(action.toParentDirPath), path.basename(fromDirPath))
            filesystem.moveDirectory(fromDirPath, toDirPath)
            break
        }
        case 'REMOVE_DIR': {
            filesystem.removeDirectory(joinPathIfArray(action.dirPath))
            break
        }
        case 'EMPTY_DIR': {
            filesystem.clearDirectoryContents(joinPathIfArray(action.dirPath))
            break
        }
        case 'RENAME_FILE': {
            filesystem.renameFile(joinPathIfArray(action.filePath), action.newName)
            break
        }
        case 'RENAME_DIR': {
            filesystem.renameDirectory(joinPathIfArray(action.dirPath), action.newName)
            break
        }
        case 'RUN_NPM_SCRIPT': {
            await runShellCmd(`npm run ${action.scriptName}`)
            break
        }
        case 'RUN_SHELL_CMD': {
            await runShellCmd(joinTokensIfArray(action.cmd))
            break
        }
        case 'RUN_JS_SCRIPT': {
            await runShellCmd(`node '${joinPathIfArray(action.scriptPath)}'`)
            break
        }
        case 'CALL_FUNC': {
            await action.func()
            break
        }
    }
}

function joinPathIfArray(pathObject: string | string[]) {
    return Array.isArray(pathObject) ? path.join(...pathObject) : pathObject
}

function joinTokensIfArray(tokenObject: string | string[]) {
    return Array.isArray(tokenObject) ? tokenObject.join(' ') : tokenObject
}

async function runShellCmd(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                logger.error(error.message)
                reject(error)
                return
            }
            if (stderr) {
                logger.error(stderr)
            }

            if (stdout.length) {
                logger.log(stdout)
            }
            resolve()
        })
    })
}
