const test = require('tape')
const path = require('path')
const {scanFiles, isFileExtensionValid} = require('../src/fs-helpers')

test('––––––––––––––––––– fs-helpers.js tests ––––––––––––––––––––', function(t) {
    t.test('isFileExtensionValid()', function(st) {
        const testCases = [
            {
                input: ['filename.html', ['html', 'js']],
                expected: true,
                message: '',
            },
            
            {
                input: ['filename.html', ['js', 'md']],
                expected: false,
                message: '',
            },
        ]

        st.plan(testCases.length)

        testCases.forEach(({input, expected, message}) => {
            st.equal(isFileExtensionValid(...input), expected, message)
        })
    })
})