![Logo](./assets/logo.png)

> CAUTION: This generator is used internally in our systems and its API is constantly changing! Please wait for v1.0.0.

A simple pluggable **static site generator** with great flexibility and control.

**Symply** is based on a well-known, fast and reliable [Handlebars.js](https://github.com/wycats/handlebars.js) templating engine.

## Custom Helpers

### Embedded Styles

```hbs
{{embeddedStyles 'src_dir_relative_path_to_style.css' attributes='media="(min-width: 500px) and (max-width: 1000px)"' }}
```

```html
<style media="(min-width: 500px) and (max-width: 1000px)">
    /* ... */
</style>
```

### Embedded Script

```hbs
{{embeddedScript 'src_dir_relative_path_to_script.js' attributes='async type="module"'}}
```

```html
<script async type="module">
    // ...
</script>
```

### `if_eq`

```hbs
 {{#if_eq var 'value' }}
 var === 'value'
 {{else}}
 var !== 'value'
 {{/if_eq}}
```

### `if_ne`

```hbs
{{#if_ne var 'value' }}
var !== 'value'
{{else}}
var === 'value'
{{/if_ne}}
```

## Tips

### Render partial by its passed path

```hbs
<!-- index.html -->
{{> partials/UserCard iconPath='svg/icons/user-1' }}
```

```hbs
<!-- partials/UserCard.html -->
<div class="UserCard">
    {{> (lookup . 'iconPath' ) }}
</div>
```