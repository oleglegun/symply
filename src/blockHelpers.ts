import Handlebars from 'handlebars'

/** IF EQUALS block helper
 * @example
 * {{#if_eq a b1 b2 ... }}
 * a === b1 || a === b2 || ...
 * {{else}}
 * a !== b1 && a !== b2 && ...
 * {{/if_eq}}
 */
export function if_eq() {
    Handlebars.registerHelper('if_eq', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_eq requires 2 or more arguments: {{#if_eq a b1 ... }} {{/if_eq}}')
        }

        const options = args[args.length - 1]

        if (args.slice(1, args.length - 1).some((arg) => args[0] === arg)) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF NOT EQUALS block helper
 * @example
 * {{#if_ne a b1 b2 ... }}
 * a !== b1 || a !== b2 || ...
 * {{else}}
 * a === b1 && a === b2 && ...
 * {{/if_ne}}
 */
export function if_ne() {
    Handlebars.registerHelper('if_ne', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_ne requires 2 or more arguments: {{#if_ne a b1 ... }} {{/if_ne}}')
        }

        const options = args[args.length - 1]

        if (args.slice(1, args.length - 1).some((arg) => args[0] !== arg)) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF GREATER THAN block helper
 * @example
 * {{#if_gt a b }}
 * a > b
 * {{else}}
 * a <= b
 * {{/if_gt}}
 */
export function if_gt() {
    Handlebars.registerHelper('if_gt', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_gt requires 2 arguments: {{#if_gt a b }} {{/if_gt}}')
        }

        const options = args[args.length - 1]

        if (args[0] > args[1]) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF GREATER THAN OR EQUAL TO block helper
 * @example
 * {{#if_ge a b }}
 * a >= b
 * {{else}}
 * a <= b
 * {{/if_ge}}
 */
export function if_ge() {
    Handlebars.registerHelper('if_ge', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_ge requires 2 arguments: {{#if_ge a b }} {{/if_ge}}')
        }

        const options = args[args.length - 1]

        if (args[0] >= args[1]) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF LESS THAN block helper
 * @example
 * {{#if_lt a b }}
 * a < b
 * {{else}}
 * a >= b
 * {{/if_lt}}
 */
export function if_lt() {
    Handlebars.registerHelper('if_lt', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_lt requires 2 arguments: {{#if_lt a b }} {{/if_lt}}')
        }

        const options = args[args.length - 1]

        if (args[0] < args[1]) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF LESS THAN OR EQUAL TO block helper
 * @example
 * {{#if_le var N }}
 * var <= N
 * {{else}}
 * var >= N
 * {{/if_le}}
 */
export function if_le() {
    Handlebars.registerHelper('if_le', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_le requires 2 arguments: {{#if_le a b }} {{/if_le}}')
        }

        const options = args[args.length - 1]

        if (args[0] <= args[1]) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF AND block helper
 * @example
 * {{#if_and a b c ... }}
 * a && b && c ... === true
 * {{else}}
 * a && b && c ... === false
 * {{/if_and}}
 */
export function if_and() {
    Handlebars.registerHelper('if_and', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_and requires 2 or more arguments: {{#if_and a b ... }} {{/if_and}}')
        }

        const options = args[args.length - 1]

        if (args.slice(0, args.length - 1).every((arg) => arg)) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF OR block helper
 * @example
 * {{#if_or a b c ... }}
 * a || b || c ... === true
 * {{else}}
 * a || b || c ... === false
 * {{/if_or}}
 */
export function if_or() {
    Handlebars.registerHelper('if_or', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_or requires 2 or more arguments: {{#if_or a b ... }} {{/if_or}}')
        }

        const options = args[args.length - 1]

        if (args.slice(0, args.length - 1).some((arg) => arg)) {
            return options.fn(this)
        }

        return options.inverse(this)
    })
}

/** IF XOR block helper
 * @example
 * {{#if_xor a b c ... }}
 * There is at least 1 TRUE value and 1 FALSE value
 * {{else}}
 * All values are TRUE or all values are FALSE
 * {{/if_xor}}
 */
export function if_xor() {
    Handlebars.registerHelper('if_xor', function (this: Symply.Globals, ...args) {
        if (args.length <= 2) {
            throw new Error('Block helper #if_xor requires 2 or more arguments: {{#if_xor a b ... }} {{/if_xor}}')
        }

        const options = args[args.length - 1]
        const values = args.slice(0, args.length - 1)

        if (values.every((value) => value) || values.every((value) => !value)) {
            return options.inverse(this)
        }

        return options.fn(this)
    })
}
