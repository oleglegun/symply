![Logo](./assets/logo.png)

A dead-simple **Bootstrap static site generator** with minimum dependencies.

Great for personal sites, landing pages and other small projects where you **want to be in control of everything**.


## Installation

`npm -g install symply`

## Quick Start

```shell
symply init # generate file structure
```



### Partials

Parts that are meant to be used in many pages.

`partials/menu.html`

```html
<div>
    <ul>
        <li>Page 1</li>
        <li>Page 2</li>
    </ul>
</div>
```

`source/index.html`

```html
<body>
    {{> menu }}
</body>
```

Result
`dist/index.html`

```html
<body>
    <div>
        <ul>
            <li>Page 1</li>
            <li>Page 2</li>
        </ul>
    </div>
</body>
```

### Helper functions

Custom functions that are used to generate html data. Can make HTTP requests to get any data needed.