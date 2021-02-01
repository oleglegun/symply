![Logo](./assets/logo.png)


A dead-simple **static site generator** with great flexibility and control.

Main advantages:
- Minimum magic - maximum transparency
- Total control of the generation process
- JSX support for generation helper functions
- SASS/SCSS styles compilation support
- Built-in web server with watch mode for instant development preview on every file change

**Symply** is based on well-known fast and reliable [Handlebars.js](https://github.com/wycats/handlebars.js) templating engine.

Great for personal sites, reports, landing pages, and other **small projects** where you **want to be in control of everything**.

> If you have a project with **100+ pages**, better use Hugo (Go) or Gatsby.js (JavaScript) which are more suitable for such use-cases.

## Installation

`npm -g install symply`

## Quick Start

```shell
symply init # generate file structure

symply generate
```

## Basic Commands

### Partial interpolation

Insert content of a `partial` file by its name.

> Use partial name without its `.html` extension, e.g. `myPartial.html` -> `{{> myPartial }}`.

```handlebars
{{> myPartial }} 
```