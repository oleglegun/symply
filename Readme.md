![Logo](./assets/logo.png)

> CAUTION: This generator is used internally in our systems and its API is constantly changing! Please wait for v1.0.0.

A simple pluggable **static site generator** with great flexibility and control.

**Symply** is based on well-known fast and reliable [Handlebars.js](https://github.com/wycats/handlebars.js) templating engine.

<!-- 
# Partials

```html

```

# Block partials 

```html

```

# Helpers

```js

``` -->


## Render partial by passed path as a parameter

```hbs
<!-- index.html -->
{{> partials/userCard iconPath='svg/icons/user-1' }}
```

```hbs
<!-- partials/userCard.html -->
<div class="UserCard">
    {{> (lookup . 'iconPath' ) }}
</div>
```

