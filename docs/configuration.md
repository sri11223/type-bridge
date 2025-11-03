# ⚙️ Configuration Guide

Complete reference for TypeWeaver configuration options.

---

## 📄 Configuration File

TypeWeaver uses a `typeweaver.config.json` file in your project root.

### Creating Config File

```bash
# Interactive setup (recommended)
npx typeweaver init

# Or create manually
touch typeweaver.config.json
```

---

## 🔧 Configuration Options

### Complete Example

```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "modelsPath": "./models",
  "outputPath": "./types",
  "outputMode": "single",
  "includeComments": true,
  "generateIndex": true,
  "backup": true,
  "watchDebounce": 300,
  "exclude": ["**/node_modules/**", "**/*.test.js"]
}
```

---

## 📋 Option Reference

### `orm` (required)

**Type:** `string`  
**Values:** `"prisma"` | `"mongoose"` | `"auto"`  
**Default:** `"auto"`

Specifies which ORM to use.

```json
{
  "orm": "prisma"
}
```

- `"prisma"`: Use Prisma schema parser
- `"mongoose"`: Use Mongoose model parser
- `"auto"`: Auto-detect based on dependencies

**Example:**
```json
// Explicitly use Prisma
{
  "orm": "prisma"
}
```

---

### `schemaPath` (for Prisma)

**Type:** `string`  
**Default:** `"./prisma/schema.prisma"`

Path to your Prisma schema file.

```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma"
}
```

**Examples:**
```json
// Custom location
{
  "schemaPath": "./database/schema.prisma"
}

// Monorepo
{
  "schemaPath": "../../packages/database/prisma/schema.prisma"
}
```

---

### `modelsPath` (for Mongoose)

**Type:** `string`  
**Default:** `"./models"`

Path to directory containing Mongoose models.

```json
{
  "orm": "mongoose",
  "modelsPath": "./models"
}
```

**Examples:**
```json
// Custom location
{
  "modelsPath": "./src/models"
}

// Nested structure
{
  "modelsPath": "./server/database/models"
}
```

---

### `outputPath` (required)

**Type:** `string`  
**Default:** `"./types"`

Where to generate TypeScript types.

```json
{
  "outputPath": "./types"
}
```

**Examples:**
```json
// Frontend in monorepo
{
  "outputPath": "../frontend/src/types"
}

// Specific file
{
  "outputPath": "./src/types/generated.ts"
}

// Multiple levels
{
  "outputPath": "../../shared/types"
}
```

---

### `outputMode`

**Type:** `string`  
**Values:** `"single"` | `"multiple"`  
**Default:** `"single"`

How to organize generated files.

```json
{
  "outputMode": "single"
}
```

**Options:**

**`"single"`** - All types in one file:
```
types/
└── index.ts  (User, Post, Comment interfaces)
```

**`"multiple"`** - One file per model:
```
types/
├── index.ts       (exports all)
├── User.ts        (User interface)
├── Post.ts        (Post interface)
└── Comment.ts     (Comment interface)
```

**When to use:**
- `"single"`: Smaller projects, simpler imports
- `"multiple"`: Large schemas, better organization

---

### `includeComments`

**Type:** `boolean`  
**Default:** `true`

Include JSDoc comments in generated types.

```json
{
  "includeComments": true
}
```

**With comments:**
```typescript
/** Auto-generated from prisma schema */
export interface User {
  id: string;
  email: string;
}
```

**Without comments:**
```typescript
export interface User {
  id: string;
  email: string;
}
```

---

### `generateIndex`

**Type:** `boolean`  
**Default:** `true`

Generate barrel export file (index.ts).

```json
{
  "generateIndex": true
}
```

**Generated index.ts:**
```typescript
export * from './User';
export * from './Post';
export * from './Comment';
```

Only applies when `outputMode` is `"multiple"`.

---

### `backup`

**Type:** `boolean`  
**Default:** `true`

Create backup files before overwriting.

```json
{
  "backup": true
}
```

**Behavior:**
- Before: `types/index.ts`
- Backup: `types/index.ts.backup`
- After: `types/index.ts` (updated)

Useful for recovery if generation fails.

---

### `watchDebounce`

**Type:** `number` (milliseconds)  
**Default:** `300`

Delay before regenerating in watch mode.

```json
{
  "watchDebounce": 300
}
```

**Recommendations:**
- `100-200ms`: Very fast, may regenerate too often
- `300ms`: Default, good balance
- `500-1000ms`: Slower, fewer regenerations

Prevents rapid regeneration during rapid file saves.

---

### `exclude`

**Type:** `string[]`  
**Default:** `["**/node_modules/**", "**/*.test.{js,ts}", "**/*.spec.{js,ts}"]`

Glob patterns for files to exclude (Mongoose only).

```json
{
  "exclude": [
    "**/node_modules/**",
    "**/*.test.js",
    "**/__tests__/**"
  ]
}
```

**Common patterns:**
```json
{
  "exclude": [
    "**/node_modules/**",
    "**/*.test.js",
    "**/*.spec.ts",
    "**/__mocks__/**",
    "**/dist/**",
    "**/build/**"
  ]
}
```

---

## 🎯 Configuration Examples

### Minimal Prisma Config

```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "./types"
}
```

### Minimal Mongoose Config

```json
{
  "orm": "mongoose",
  "modelsPath": "./models",
  "outputPath": "./types"
}
```

### Full Featured Config

```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "./src/types",
  "outputMode": "multiple",
  "includeComments": true,
  "generateIndex": true,
  "backup": true,
  "watchDebounce": 500,
  "exclude": [
    "**/node_modules/**",
    "**/*.test.js"
  ]
}
```

### Monorepo Config (Backend)

```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "../frontend/src/types",
  "outputMode": "single",
  "includeComments": true,
  "backup": false
}
```

### Monorepo Config (Shared Package)

```json
{
  "orm": "prisma",
  "schemaPath": "../../packages/database/prisma/schema.prisma",
  "outputPath": "../../packages/types/src/generated",
  "outputMode": "multiple",
  "generateIndex": true
}
```

### Custom Mongoose Structure

```json
{
  "orm": "mongoose",
  "modelsPath": "./server/database/schemas",
  "outputPath": "./server/types",
  "outputMode": "single",
  "includeComments": false,
  "exclude": [
    "**/node_modules/**",
    "**/*.test.js",
    "**/__mocks__/**"
  ]
}
```

---

## 🔄 Overriding Config via CLI

You can override config options via command-line flags:

```bash
# Override output path
npx typeweaver generate --output ./custom-types

# Override config file location
npx typeweaver generate --config ./custom-config.json
```

See [CLI Reference](./cli-reference.md) for all CLI options.

---

## 🎨 Advanced Patterns

### Separate Configs for Different Environments

**Development:**
```json
// typeweaver.config.dev.json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "./types",
  "includeComments": true,
  "watchDebounce": 300
}
```

**Production:**
```json
// typeweaver.config.prod.json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "./dist/types",
  "includeComments": false,
  "backup": false
}
```

**Usage:**
```bash
# Development
npx typeweaver watch --config typeweaver.config.dev.json

# Production build
npx typeweaver generate --config typeweaver.config.prod.json
```

---

### Multiple Output Locations

Create separate config files:

```json
// typeweaver.frontend.json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "../frontend/src/types"
}
```

```json
// typeweaver.mobile.json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "../mobile-app/types"
}
```

**Usage:**
```bash
npx typeweaver generate --config typeweaver.frontend.json
npx typeweaver generate --config typeweaver.mobile.json
```

---

## 📝 Configuration Validation

TypeWeaver validates your config on startup:

### Valid Config
```bash
✅ Config loaded successfully
✅ Detected: prisma
📖 Parsing schemas...
```

### Invalid Config
```bash
❌ Configuration error:
   - "outputPath" is required
   - "schemaPath" must be a string
```

Common validation errors:
- Missing required fields
- Invalid ORM value
- Invalid path (file doesn't exist)
- Invalid outputMode value

---

## 🔧 Environment Variables

You can use environment variables in config:

```json
{
  "orm": "prisma",
  "schemaPath": "${SCHEMA_PATH}",
  "outputPath": "${OUTPUT_PATH}"
}
```

**Usage:**
```bash
export SCHEMA_PATH=./prisma/schema.prisma
export OUTPUT_PATH=./types
npx typeweaver generate
```

---

## 🎯 Best Practices

### ✅ Do's

1. **Commit config file**
   ```bash
   git add typeweaver.config.json
   ```

2. **Use relative paths**
   ```json
   {
     "schemaPath": "./prisma/schema.prisma"
   }
   ```

3. **Enable comments for development**
   ```json
   {
     "includeComments": true
   }
   ```

4. **Use multiple files for large schemas**
   ```json
   {
     "outputMode": "multiple"
   }
   ```

### ❌ Don'ts

1. **Avoid absolute paths**
   ```json
   {
     "schemaPath": "/Users/me/project/prisma/schema.prisma"
   }
   ```

2. **Don't commit backup files**
   ```bash
   # .gitignore
   *.backup
   ```

3. **Don't set very low debounce**
   ```json
   {
     "watchDebounce": 50  // Too fast!
   }
   ```

---

## 📚 Related Guides

- [Getting Started](./getting-started.md) - Initial setup
- [CLI Reference](./cli-reference.md) - Command-line usage
- [Troubleshooting](./troubleshooting.md) - Common issues

---

## 🆘 Need Help?

- Configuration not working? See [Troubleshooting](./troubleshooting.md)
- Want to contribute? See [Contributing Guide](./contributing.md)
- Have questions? [GitHub Discussions](https://github.com/sri11223/type-bridge/discussions)
