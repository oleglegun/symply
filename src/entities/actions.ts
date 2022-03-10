import ProgressBar from '../progressBar'
import * as filesystem from '../filesystem'
import path from 'path'

export async function runPreBuildAsync(actionList?: Symply.Action[]): Promise<void> {
    if (!actionList || actionList.length === 0) {
        return
    }

    const actionRunProgress = new ProgressBar(actionList.length)

    for (let idx = 0; idx < actionList.length; idx++) {
        const action = actionList[idx]
        await runAction(action)
        actionRunProgress.tick(`Running PRE-BUILD actions:`, `${idx + 1}/${actionList.length}`)
    }
}

export async function runPostBuildAsync(actionList?: Symply.Action[]): Promise<void> {
    if (!actionList || actionList.length === 0) {
        return
    }

    const actionRunProgress = new ProgressBar(actionList.length)

    for (let idx = 0; idx < actionList.length; idx++) {
        const action = actionList[idx]
        await runAction(action)
        actionRunProgress.tick(`Running POST-BUILD actions:`, `${idx + 1}/${actionList.length}`)
    }
}

async function runAction(action: Symply.Action) {
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
            await filesystem.copyFilesToDirectoryAsync(
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
        case 'COPY_DIR': {
            filesystem.copyDirectory(joinPathIfArray(action.fromDirPath), joinPathIfArray(action.toDirPath))
            break
        }
        case 'COPY_DIR_TO_DIR': {
            const fromDirPath = joinPathIfArray(action.fromDirPath)
            const toDirName = path.basename(joinPathIfArray(action.fromDirPath))
            const toDirPath = path.join(joinPathIfArray(action.toParentDirPath), toDirName)
            filesystem.copyDirectory(fromDirPath, toDirPath)
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
    }
}

function joinPathIfArray(pathObject: string | string[]) {
    return Array.isArray(pathObject) ? path.join(...pathObject) : pathObject
}
