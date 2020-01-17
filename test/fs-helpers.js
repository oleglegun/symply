const test = require('tape')
const path = require('path')
const { scanFiles, isFileExtensionValid, joinAndResolvePath } = require('../src/fs-helpers')

test('––––––––––––––––––– fs-helpers.js tests ––––––––––––––––––––', function(t) {
    t.test('isFileExtensionValid(fileName, validExtensionsList)', function(st) {
        const testCases = [
            {
                input: ['filename.html', ['html', 'js']],
                expected: true,
                message: 'correctly detect valid file extension',
            },

            {
                input: ['filename.html', ['js', 'md']],
                expected: false,
                message: 'correctly detect invalid file extension',
            },
        ]

        st.plan(testCases.length)

        testCases.forEach(({ input, expected, message }) => {
            st.equal(isFileExtensionValid(...input), expected, message)
        })
    })

    t.test('joinAndResolvePath(...pathParts)', function(st) {
        const testCases = [
            {
                inputArgs: ['/path1', 'path2'],
                expected: '/path1/path2',
                message: 'correctly resolve absolute path',
            },

            {
                inputArgs: ['path1', 'path2'],
                expected: process.cwd() + '/path1/path2',
                message: 'correctly resolve relative path',
            },

            {
                inputArgs: ['path1', '.', 'path2', 'path3'],
                expected: process.cwd() + '/path1/path2/path3',
                message: 'correctly resolve relative path with dot character',
            },
        ]

        st.plan(testCases.length)

        testCases.forEach(({ inputArgs, expected, message }) => {
            st.equal(joinAndResolvePath(...inputArgs), expected, message)
        })
    })
})
