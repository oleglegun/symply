![Logo](./assets/logo.png)

> **Note**: This generator is used internally in our systems. While the API is stable for most use cases, some advanced features may evolve before v1.0.0.

# SYMPLY - A Simple, Pluggable Static Site Generator

- [✨ Features](#-features)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📁 Project Structure](#-project-structure)
- [⚙️ Configuration](#-configuration)
- [🎨 Templates](#-templates)
  - [Basic Template Example](#basic-template-example)
- [🌍 Globals](#-globals)
  - [File-based Globals](#file-based-globals)
- [🧩 Partials](#-partials)
  - [File-based Partials](#file-based-partials)
  - [Dynamic Partials](#dynamic-partials)
- [🛠️ Helpers](#-helpers)
  - [Built-in Helpers](#built-in-helpers)
  - [Custom Helpers](#custom-helpers)
- [📄 File Processing](#-file-processing)
  - [CSS/SCSS/SASS](#cssscsssass)
  - [JavaScript/TypeScript](#javascripttypescript)
- [⚡ Actions System](#-actions-system)
  - [Action Types](#action-types)
- [📚 API Reference](#-api-reference)
  - [Module Usage](#module-usage)
  - [Integration Example](#integration-example)
  - [CLI Usage](#cli-usage)
  - [Configuration Merging](#configuration-merging)
- [🔧 Advanced Usage](#-advanced-usage)
  - [Nested Directories for Organization](#nested-directories-for-organization)
  - [File Filtering](#file-filtering)
  - [TypeScript Configuration](#typescript-configuration)
- [🐛 Troubleshooting](#-troubleshooting)
  - [Common Issues](#common-issues)
  - [Debug Mode](#debug-mode)
- [📝 Complete Example: Blog Site](#-complete-example-blog-site)
  - [Project Structure](#project-structure)
  - [Configuration (symply-config.jsonc)](#configuration-symply-configjsonc)
  - [Globals (src/globals/site.json)](#globals-srcglobalssitejson)
  - [Blog Posts (src/globals/posts.json)](#blog-posts-srcglobalspostsjson)
  - [Date Helper (src/helpers/date.js)](#date-helper-srchelpersdatejs)
  - [Main Template (src/index.html)](#main-template-srcindexhtml)
  - [Partial (src/partials/layout/header.html)](#partial-srcpartialslayoutheaderhtml)
  - [SCSS Styles (src/styles/main.scss)](#scss-styles-srcstylesmainscss)
  - [TypeScript (src/scripts/app.ts)](#typescript-srcscriptsappts)
  - [Generate the Site](#generate-the-site)
- [📝 Test Examples](#-test-examples)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

**Symply** is a flexible, extensible static site generator built on the reliable [Handlebars.js](https://github.com/wycats/handlebars.js) templating engine. It provides fine-grained control over your static site generation process with support for custom helpers, partials, globals, and an extensive action system.

## ✨ Features

- **Handlebars-based Templating**: Leverage the power of Handlebars with custom helpers and partials
- **Flexible Configuration**: JSONC configuration with comprehensive options
- **Built-in File Processing**: CSS, SCSS/SASS, JavaScript, and TypeScript support
- **Custom Helpers System**: Create your own helpers in JavaScript
- **Globals & Partials**: Share data and reusable components across templates
- **Actions System**: Pre- and post-build automation hooks
- **Module & CLI Support**: Use as a Node.js module or command-line tool

## 📦 Installation

```bash
npm install symply
```

## 🚀 Quick Start

1. **Create a basic project structure**:
```bash
mkdir my-site && cd my-site
npm init -y
npm install symply
```

2. **Create a simple configuration file** (`symply-config.jsonc`):
```jsonc
{
    "paths": {
        "defaultDirectoriesPrefix": "src",
        "distributionDirectoryPath": "dist"
    }
}
```

3. **Create your first template** (`src/index.html`):
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Site</title>
</head>
<body>
    <h1>Hello, {{lang.name}}!</h1>
</body>
</html>
```

4. **Create a globals file** (`src/globals/lang.json`):
```json
{
    "name": "World"
}
```

5. **Generate your site**:
```bash
npx symply generate
```

Your generated site will be available in the `dist` directory.

## 📁 Project Structure

Symply follows a convention-over-configuration approach with this default structure:

```
your-project/
├── symply-config.jsonc         # Configuration file
├── src/                        # Source directory (configurable)
│   ├── index.html              # Main template
│   ├── styles/                 # CSS/SCSS files
│   ├── scripts/                # JS/TS files
│   ├── globals/                # Global data files (.json, .yaml, .js)
│   │   └── lang.json
│   ├── partials/               # Reusable template components
│   │   └── header.html
│   └── helpers/                # Custom Handlebars helpers
│       └── text.js
└── dist/                       # Output directory (configurable)
```

## ⚙️ Configuration

Symply uses a `symply-config.jsonc` or `symply-config.json` file for configuration. Here's a comprehensive example:

```jsonc
{
    // System configuration
    "debugOutput": false,
    "ignoreMissingProperties": false,
    "formatOutputHTML": false,
    "minifyOutputHTML": false,
    "omitWarnings": false,
    "ansiLogging": true,
    "clearDistributionDirectoryOnRecompile": false,
    
    // Paths configuration
    "paths": {
        "defaultDirectoriesPrefix": "src",
        "sourceDirectoryPath": "src",
        "distributionDirectoryPath": "dist",
        "globalsDirectoryPath": "globals",
        "partialsDirectoryPath": "partials",
        "helpersDirectoryPath": "helpers"
    },
    
    // File processing configuration
    "files": {
        "all": {
            "include": ["**/*"],
            "exclude": []
        },
        "templates": {
            "include": ["**/*"],
            "exclude": []
        },
        "styles": {
            "include": ["**/*"],
            "exclude": []
        },
        "js": {
            "include": ["**/*"],
            "exclude": []
        },
        "ts": {
            "include": ["**/*"],
            "exclude": [],
            "enableLinter": false,
            "configuration": {
                "noEmitOnError": true,
                "removeComments": true,
                "target": "ES2015"
            }
        }
    },
    
    // Entities (can also be defined in separate files)
    "entities": {
        "globals": {
            "siteTitle": "My Awesome Site",
            "navigation": [
                { "title": "Home", "url": "/" },
                { "title": "About", "url": "/about" }
            ]
        },
        "partials": {
            "header": "<header>Site Header</header>",
            "footer": "<footer>Site Footer</footer>"
        },
        "helpers": {
            "currentYear": "() => new Date().getFullYear()"
        }
    },
    
    // Actions (pre/post build automation)
    "actions": {
        "preBuild": [
            {
                "type": "COPY_FILE",
                "fromFilePath": "assets/favicon.ico",
                "toFilePath": "dist/favicon.ico",
                "info": "Copy favicon to distribution"
            }
        ],
        "postBuild": [
            {
                "type": "RUN_SHELL_CMD",
                "cmd": "echo 'Build completed successfully'",
                "info": "Notification"
            }
        ]
    }
}
```

## 🎨 Templates

Symply supports both `.html` and `.hbs` (Handlebars) files. Templates are compiled with access to all globals, partials, and helpers.

### Basic Template Example

```html
<!DOCTYPE html>
<html lang="{{lang.site}}">
<head>
    <meta charset="UTF-8">
    <title>{{siteTitle}} - {{pageTitle}}</title>
    {{embeddedStyles 'styles/main.css'}}
</head>
<body>
    {{> header}}
    
    <main>
        <h1>{{pageTitle}}</h1>
        <p>Welcome to {{siteTitle}}!</p>
        
        {{#if_eq user.role 'admin'}}
            <p>You have admin privileges.</p>
        {{/if_eq}}
        
        <p>Current year: {{currentYear}}</p>
    </main>
    
    {{> footer}}
    {{embeddedScript 'scripts/main.js' attributes='defer'}}
</body>
</html>
```

## 🌍 Globals

Globals are data available to all templates. They can be defined in:
1. Configuration file (`entities.globals`)
2. Separate files in the `globals/` directory

### File-based Globals

Create files in the `globals/` directory with extensions:
- `.json` - JSON data
- `.yaml` - YAML data
- `.js` - JavaScript module exporting data

**File Naming Rules:**
- Each file's name (without extension) becomes the global variable name
- Example: `site.json` → `{{site}}` in templates
- Multiple files with different names create separate globals: `lang1.json` and `lang2.json` → `{{lang1}}` and `{{lang2}}`
- Files with same name but different extensions are not allowed (e.g., `lang.json` and `lang.yaml`)
- Nested directories create namespaced globals: `globals/navigation/main.json` → `{{navigation/main}}`

**Example** (`globals/site.json`):
```json
{
    "title": "My Site",
    "description": "A simple static site",
    "author": "John Doe"
}
```

**Example** (`globals/navigation.js`):
```javascript
module.exports = {
    items: [
        { title: 'Home', url: '/' },
        { title: 'About', url: '/about' },
        { title: 'Contact', url: '/contact' }
    ]
}
```

**Example** (`globals/lang1.json`):
```json
{
    "greeting": "Hello",
    "farewell": "Goodbye"
}
```

**Example** (`globals/lang2.json`):
```json
{
    "greeting": "Bonjour",
    "farewell": "Au revoir"
}
```

Access globals in templates:
- `{{site.title}}` - From `site.json`
- `{{navigation.items}}` - From `navigation.js`
- `{{lang1.greeting}}` - From `lang1.json`
- `{{lang2.greeting}}` - From `lang2.json`
- `{{navigation/main.items}}` - From nested file `navigation/main.json`

## 🧩 Partials

Partials are reusable template components. They can be defined in:
1. Configuration file (`entities.partials`)
2. Separate `.html` files in the `partials/` directory

### File-based Partials

Create `.html` files in the `partials/` directory:

**Example** (`partials/header.html`):
```html
<header class="site-header">
    <nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
        <a href="/contact">Contact</a>
    </nav>
</header>
```

Use partials in templates: `{{> header}}`

### Dynamic Partials

Partials can accept arguments:

```html
<!-- In template -->
{{> userCard name="John" age=30 }}

<!-- In partials/userCard.html -->
<div class="user-card">
    <h3>{{name}}</h3>
    <p>Age: {{age}}</p>
</div>
```

## 🛠️ Helpers

Helpers are custom Handlebars functions. Symply includes built-in helpers and supports custom helpers.

### Built-in Helpers

#### Embedded Styles Helper
```hbs
{{embeddedStyles 'styles/main.css' attributes='media="(min-width: 768px)"'}}
{{embeddedStyles 'npm:bootstrap@5.2.0/dist/css/bootstrap.min.css'}}
```
Embeds CSS content directly into `<style>` tags. Supports files from `node_modules` using `npm:` prefix.

#### Embedded Script Helper
```hbs
{{embeddedScript 'scripts/app.js' attributes='async type="module"'}}
{{embeddedScript 'npm:lodash@4.17.21/lodash.min.js'}}
```
Embeds JavaScript content directly into `<script>` tags. Supports files from `node_modules`.

#### Comparison Helpers

```hbs
{{#if_eq a b}}...{{/if_eq}}          <!-- a == b -->
{{#if_ne a b}}...{{/if_ne}}          <!-- a != b -->
{{#if_gt a b}}...{{/if_gt}}          <!-- a > b -->
{{#if_ge a b}}...{{/if_ge}}          <!-- a >= b -->
{{#if_lt a b}}...{{/if_lt}}          <!-- a < b -->
{{#if_le a b}}...{{/if_le}}          <!-- a <= b -->
{{#if_and a b c}}...{{/if_and}}      <!-- a && b && c -->
{{#if_or a b c}}...{{/if_or}}        <!-- a || b || c -->
{{#if_xor a b c}}...{{/if_xor}}      <!-- exactly one true -->
```

### Custom Helpers

Create JavaScript files in the `helpers/` directory:

**Example** (`helpers/math.js`):
```javascript
module.exports = {
    add: (ctx, a, b) => a + b,
    multiply: (ctx, a, b) => a * b,
    formatCurrency: (ctx, amount) => `$${amount.toFixed(2)}`
}
```

**Example** (`helpers/text.js`):
```javascript
module.exports = {
    toUpperCase: (ctx, text) => text.toUpperCase(),
    truncate: (ctx, text, length) => text.length > length ? text.substring(0, length) + '...' : text
}
```

Use custom helpers in templates:
```hbs
<p>Total: {{add 5 3}}</p>
<p>Price: {{formatCurrency 19.99}}</p>
<p>{{toUpperCase "hello world"}}</p>
<p>{{truncate "Very long text here" 10}}</p>
```

Helper functions receive a context object with:
- `hash`: Named arguments passed to the helper
- `globals`: All global values
- `renderBlockContent`: Function to render block content (for block helpers)
- `renderTemplate`: Function to compile and render template strings

## 📄 File Processing

### CSS/SCSS/SASS
- `.css` files are copied as-is
- `.scss`/`.sass` files are compiled to CSS
- Use `{{embeddedStyles}}` helper to embed styles

### JavaScript/TypeScript
- `.js` files are copied as-is
- `.ts` files are transpiled to JavaScript
- Use `{{embeddedScript}}` helper to embed scripts
- TypeScript linting available via `files.ts.enableLinter`

### Other Files
All other files are copied directly to the distribution directory.

## ⚡ Actions System

Actions allow automation before and after the build process.

### Action Types

```jsonc
{
    "actions": {
        "preBuild": [
            {
                "type": "COPY_FILE",
                "fromFilePath": "source.txt",
                "toFilePath": "dest.txt"
            },
            {
                "type": "COPY_FILES_TO_DIR",
                "fromDirPath": "assets",
                "toDirPath": "dist/assets",
                "filterFunc": "(type, name, ext) => ext !== '.tmp'"
            },
            {
                "type": "RUN_SHELL_CMD",
                "cmd": "echo 'Starting build...'"
            },
            {
                "type": "RUN_NPM_SCRIPT",
                "scriptName": "prebuild"
            },
            {
                "type": "EMPTY_DIR",
                "dirPath": "temp"
            }
        ],
        "postBuild": [
            {
                "type": "RUN_SHELL_CMD", 
                "cmd": ["echo 'Build complete'", "ls -la dist/"]
            }
        ]
    }
}
```

Available action types:
- `COPY_FILE`, `COPY_FILE_TO_DIR`, `COPY_FILES_TO_DIR`
- `MOVE_FILE`, `MOVE_FILES_TO_DIR`
- `COPY_DIR`, `MOVE_DIR`, `COPY_DIR_TO_DIR`, `MOVE_DIR_TO_DIR`
- `EMPTY_DIR`, `REMOVE_DIR`
- `RENAME_FILE`, `RENAME_DIR`
- `RUN_NPM_SCRIPT`, `RUN_SHELL_CMD`, `RUN_JS_SCRIPT`, `CALL_FUNC`

## 📚 API Reference

Symply can be used both as a CLI tool and as a Node.js module, giving you flexibility to integrate it into your build process.

### Module Usage

You can import Symply into your TypeScript/JavaScript code and call it programmatically:

```javascript
// JavaScript/CommonJS
const { generate } = require('symply');

// TypeScript/ES Modules
import { generate } from 'symply';

// Generate with complete configuration
await generate({
    // System configuration
    debugOutput: true,
    formatOutputHTML: true,
    
    // Paths configuration
    paths: {
        sourceDirectoryPath: 'src',
        distributionDirectoryPath: 'dist'
    },
    
    // Entities (partials, globals, helpers)
    entities: {
        globals: {
            siteTitle: 'My Site',
            navigation: [
                { title: 'Home', url: '/' },
                { title: 'About', url: '/about' }
            ]
        },
        partials: {
            header: '<header>Site Header</header>',
            footer: '<footer>Site Footer</footer>'
        },
        helpers: {
            currentYear: () => new Date().getFullYear()
        }
    },
    
    // File processing configuration
    files: {
        templates: {
            include: ['**/*.html', '**/*.hbs']
        }
    },
    
    // Actions
    actions: {
        preBuild: [
            {
                type: 'COPY_FILE',
                fromFilePath: 'assets/favicon.ico',
                toFilePath: 'dist/favicon.ico'
            }
        ]
    }
});

// Generate using configuration file
// Symply will automatically look for symply-config.jsonc
await generate({});

// Generate with partial configuration (merged with config file)
await generate({
    debugOutput: true,
    entities: {
        globals: {
            environment: 'production'
        }
    }
});
```

### Integration Example

Here's how you might integrate Symply into a larger build system:

```typescript
// build.ts
import { generate } from 'symply';

async function buildSite() {
    console.log('Starting site generation...');
    
    try {
        const stats = await generate({
            debugOutput: process.env.NODE_ENV === 'development',
            formatOutputHTML: true,
            paths: {
                sourceDirectoryPath: 'src',
                distributionDirectoryPath: 'dist'
            }
        });
        
        console.log(`Generated ${stats.generatedFilesCount} files`);
        console.log(`Copied ${stats.copiedFilesCount} files`);
        return stats;
    } catch (error) {
        console.error('Build failed:', error);
        throw error;
    }
}

// Use in your build script
buildSite().then(() => {
    console.log('Build completed successfully');
});
```

### CLI Usage

```bash
# Generate site using configuration file (symply-config.jsonc)
npx symply generate

# Generate with specific configuration file
npx symply generate --config custom-config.jsonc

# Generate with inline configuration (JSON string)
npx symply generate --config '{"debugOutput": true, "formatOutputHTML": true}'

# Show version
npx symply --version

# Show help
npx symply --help
```

### Configuration Merging

When using the module API:
1. Configuration passed to `generate()` takes highest priority
2. Configuration from `symply-config.jsonc` is loaded and merged
3. Default values are used for any unspecified options

This allows you to override specific settings programmatically while keeping most configuration in a file.

## 🔧 Advanced Usage

### Nested Directories for Organization

Organize globals, partials, and helpers in nested directories:

```
src/
├── globals/
│   ├── site.json
│   ├── navigation/
│   │   └── main.json
│   └── content/
│       └── pages.json
├── partials/
│   ├── layout/
│   │   ├── header.html
│   │   └── footer.html
│   └── components/
│       ├── card.html
│       └── button.html
└── helpers/
    ├── text/
    │   └── formatting.js
    └── math/
        └── calculations.js
```

Access nested entities using slash notation:
- `{{site.title}}`
- `{{navigation/main.items}}`
- `{{> layout/header}}`
- `{{text/formatting.uppercase "hello"}}`

### File Filtering

Control which files are processed:

```jsonc
{
    "files": {
        "templates": {
            "include": ["**/*.html", "pages/**/*.hbs"],
            "exclude": ["drafts/**", "*.test.html"]
        },
        "styles": {
            "include": ["styles/*.css", "components/**/*.scss"],
            "exclude": ["styles/vendor/", "*.test.css"]
        }
    }
}
```

### TypeScript Configuration

```jsonc
{
    "files": {
        "ts": {
            "enableLinter": true,
            "configuration": {
                "target": "ES2020",
                "removeComments": false,
                "noEmitOnError": true
            }
        }
    }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **"Missing helper/property" errors**
   - Check that globals/helpers are properly defined
   - Verify file paths and extensions
   - Enable `debugOutput: true` for more information

2. **Partials not found**
   - Ensure partial files are in the `partials/` directory
   - Check file extensions (should be `.html`)
   - Verify partial names match file names

3. **SCSS compilation errors**
   - Check SCSS syntax
   - Ensure all imports are available
   - Verify file paths are correct

4. **TypeScript errors**
   - Enable `files.ts.enableLinter` to see TypeScript errors
   - Check `files.ts.configuration` matches your tsconfig

### Debug Mode

Enable debug output for detailed information:

```jsonc
{
    "debugOutput": true,
    "ansiLogging": true
}
```

## 📝 Complete Example: Blog Site

Here's a complete example of a simple blog site using Symply:

### Project Structure
```
blog-site/
├── symply-config.jsonc
├── src/
│   ├── index.html
│   ├── about.html
│   ├── styles/
│   │   ├── main.scss
│   │   └── variables.scss
│   ├── scripts/
│   │   └── app.ts
│   ├── globals/
│   │   ├── site.json
│   │   └── posts.json
│   ├── partials/
│   │   ├── layout/
│   │   │   ├── header.html
│   │   │   └── footer.html
│   │   └── components/
│   │       ├── post-card.html
│   │       └── navigation.html
│   └── helpers/
│       └── date.js
└── assets/
    └── images/
```

### Configuration (`symply-config.jsonc`)
```jsonc
{
    "debugOutput": false,
    "formatOutputHTML": true,
    "paths": {
        "defaultDirectoriesPrefix": "src",
        "distributionDirectoryPath": "dist"
    },
    "files": {
        "styles": {
            "include": ["**/*.scss", "**/*.css"]
        },
        "ts": {
            "enableLinter": true,
            "configuration": {
                "target": "ES2020"
            }
        }
    },
    "actions": {
        "preBuild": [
            {
                "type": "COPY_FILES_TO_DIR",
                "fromDirPath": "assets",
                "toDirPath": "dist/assets",
                "info": "Copy static assets"
            }
        ]
    }
}
```

### Globals (`src/globals/site.json`)
```json
{
    "title": "My Blog",
    "description": "A simple blog built with Symply",
    "author": "Jane Doe",
    "currentYear": 2025
}
```

### Blog Posts (`src/globals/posts.json`)
```json
{
    "posts": [
        {
            "id": 1,
            "title": "Getting Started with Symply",
            "date": "2025-01-15",
            "excerpt": "Learn how to build static sites with Symply",
            "content": "Full post content here..."
        },
        {
            "id": 2,
            "title": "Advanced Handlebars Helpers",
            "date": "2025-01-20",
            "excerpt": "Creating custom helpers for your templates",
            "content": "Full post content here..."
        }
    ]
}
```

### Date Helper (`src/helpers/date.js`)
```javascript
module.exports = {
    formatDate: (ctx, dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    isRecent: (ctx, dateString, days = 7) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    }
};
```

### Main Template (`src/index.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{site.title}} - Home</title>
    {{embeddedStyles 'styles/main.css'}}
</head>
<body>
    {{> layout/header}}
    
    <main class="container">
        <h1>Welcome to {{site.title}}</h1>
        <p class="lead">{{site.description}}</p>
        
        <section class="posts">
            <h2>Recent Posts</h2>
            {{#each posts}}
                <article class="post">
                    <h3>{{title}}</h3>
                    <div class="post-meta">
                        <time datetime="{{date}}">{{formatDate date}}</time>
                        {{#if isRecent date}}
                            <span class="new-badge">NEW</span>
                        {{/if}}
                    </div>
                    <p>{{excerpt}}</p>
                    <a href="/post/{{id}}.html">Read more</a>
                </article>
            {{/each}}
        </section>
    </main>
    
    {{> layout/footer}}
    {{embeddedScript 'scripts/app.js' attributes='defer'}}
</body>
</html>
```

### Partial (`src/partials/layout/header.html`)
```html
<header class="site-header">
    <div class="container">
        <a href="/" class="logo">{{site.title}}</a>
        <nav>
            <a href="/">Home</a>
            <a href="/about.html">About</a>
            <a href="/contact.html">Contact</a>
        </nav>
    </div>
</header>
```

### SCSS Styles (`src/styles/main.scss`)
```scss
@import 'variables';

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.site-header {
    background: $primary-color;
    color: white;
    padding: 1rem 0;
    
    .logo {
        font-size: 1.5rem;
        font-weight: bold;
        color: white;
        text-decoration: none;
    }
}

.post {
    border: 1px solid #ddd;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    
    .new-badge {
        background: #4CAF50;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        margin-left: 10px;
    }
}
```

### TypeScript (`src/scripts/app.ts`)
```typescript
// Simple TypeScript example
interface Post {
    id: number;
    title: string;
}

function highlightNewPosts(): void {
    const newPosts = document.querySelectorAll('.new-badge');
    newPosts.forEach(badge => {
        const parent = badge.closest('.post');
        if (parent) {
            parent.classList.add('highlight-new');
        }
    });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', highlightNewPosts);
```

### Generate the Site
```bash
npx symply generate
```

This will create a fully functional blog site in the `dist/` directory with:
- Compiled SCSS to CSS
- Transpiled TypeScript to JavaScript
- Processed HTML templates with data
- Copied assets
- Formatted HTML output

## 📝 Test Examples

Check the `test/e2e/generate/tests/` directory for complete working examples:

1. **Basic execution** - Minimal configuration
2. **Globals and partials** - Using entities
3. **Helpers** - Custom helper functions

## 🤝 Contributing

While Symply is primarily used internally, contributions are welcome. Please ensure all tests pass before submitting changes.

```bash
# Run tests
npm test

# Run unit tests only
npm run test:unit

# Run end-to-end tests
npm run test:e2e

# Lint code
npm run lint
```

## 📄 License

MIT © Oleg Legun