const dirCompare = require('dir-compare')
const test = require('tape')
const path = require('path')
const fs = require('fs-extra')

const symply = require('../../../index.js')

const CURRENT_PATH = path.join('test', 'e2e', 'generate')
const TEST_CASES_PATH = path.join(CURRENT_PATH, 'tests')

const SYMPLY_OUTPUT_DIRECTORY_NAME = 'output'
const REFERENCE_OUTPUT_DIRECTORY_NAME = 'reference-output'

const CWD = process.cwd()

test('––––––––––––––––––– symply.generate() tests ––––––––––––––––––––', function (t) {
    const testCaseDirectoryNameList = getTestCaseDirectoryNameList()

    testCaseDirectoryNameList.forEach((testCaseDirectoryName) => {
        const symplyWorkingDirectoryPath = path.join(CWD, TEST_CASES_PATH, testCaseDirectoryName)
        const symplyLogList = []
        const customLogger = {
            log(message) {
                symplyLogList.push(message)
            },
        }

        t.test(testCaseDirectoryName, function (st) {
            // Change CWD to test case directory
            process.chdir(symplyWorkingDirectoryPath)
            st.plan(1)

            symply.generate({ customLogger: customLogger }).then(() => {
                const { isValid, errDetails } = validateSymplyOutput(
                    REFERENCE_OUTPUT_DIRECTORY_NAME,
                    SYMPLY_OUTPUT_DIRECTORY_NAME
                )
                if (isValid) {
                    fs.emptyDirSync(SYMPLY_OUTPUT_DIRECTORY_NAME)
                    st.pass('generated symply output is valid')
                } else {
                    st.fail(errDetails)
                    console.log('SYMPLY LOG:')
                    console.log(symplyLogList.join('\n'))
                }
            })
        })
    })
})

/*-----------------------------------------------------------------------------
 *  Helpers
 *----------------------------------------------------------------------------*/
function getTestCaseDirectoryNameList() {
    /** @type {string[]} */
    const testNameList = []

    fs.readdirSync(TEST_CASES_PATH).filter((entityName) => {
        if (fs.statSync(path.join(TEST_CASES_PATH, entityName)).isDirectory()) {
            testNameList.push(entityName)
        }
    })

    return testNameList
}

function validateSymplyOutput(referenceOutputPath, testOutputPath) {
    const compareResult = dirCompare.compareSync(referenceOutputPath, testOutputPath, { compareContent: true })

    if (compareResult.same) {
        return { isValid: true }
    }

    const errDetailsList = []

    compareResult.diffSet.forEach((dif) =>
        errDetailsList.push(
            `State: "${dif.state}". File A: "${path.join(dif.path1, dif.name1)}". File B: "${path.join(
                dif.path2,
                dif.name2
            )}".`
        )
    )

    return {
        isValid: false,
        errDetails: errDetailsList.join('\n'),
    }
}
