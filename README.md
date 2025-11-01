# 🧵 TypeWeaver

**Stop manually syncing types between your backend and frontend.**

Auto-generate TypeScript interfaces from your ORM schemas in real-time.

[![npm version](https://img.shields.io/npm/v/typeweaver.svg)](https://www.npmjs.com/package/typeweaver)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## 🔥 The Problem

Full-stack TypeScript developers face a daily problem:

```typescript
// Backend: Update User model
const userSchema = new Schema({
  name: String,
  email: String,
  phoneNumber: String  // ← NEW FIELD
});

// Frontend: Types are now OUT OF SYNC ❌
interface User {
  name: string;
  email: string;
  // Missing phoneNumber!
}

// Result: Runtime bugs that TypeScript should have caught
```

**The consequences:**
- ⏰ 30+ minutes per week manually copying types
- 🐛 Type mismatches cause production bugs
- 🔄 Constant context switching between backend/frontend
- 😤 Forgotten updates slip through code reviews

---

## ✨ The Solution

```bash
# One-time setup
npx typeweaver@beta init

# Generate types once
npx typeweaver@beta generate

# Or watch mode (auto-sync on every change)
npx typeweaver@beta watch
```

**That's it.** Your frontend types stay in sync automatically.

---

## 🚀 Quick Start

### Installation

```bash
npm install -D typeweaver@beta
```

### Setup (Interactive)

```bash
npx typeweaver@beta init
```

This creates `typeweaver.config.json`:

```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "./types",
  "outputMode": "single"
}
```

### Generate Types

```bash
# One-time generation
npx typeweaver@beta generate

# Watch mode (auto-regenerate on changes)
npx typeweaver@beta watch
```

---

## 📋 Features

### ✅ Supported ORMs

| ORM | Status | Description |
|-----|--------|-------------|
| **Prisma** | ✅ **Ready** | Parse schema.prisma files |
| **Mongoose** | ✅ **Ready** | Parse Schema definitions |
| **TypeORM** | 🚧 Coming Soon | Parse decorators |
| **Sequelize** | 🚧 Coming Soon | Parse models |

### ✨ Key Features

- **Zero Migration** - Works with your existing code
- **Real-Time Sync** - Watch mode updates types instantly (<500ms)
- **Safe Writes** - Automatic backups before overwriting
- **Multi-ORM** - Prisma, Mongoose, and more
- **Flexible Output** - Single file or one file per model
- **Type-Safe** - Handles complex types, enums, arrays, references
- **Smart Detection** - Auto-detects your ORM

---

## 📖 Usage Examples

### Prisma

```prisma
// schema.prisma
model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
  age   Int?
  posts Post[]
}

model Post {
  id      String @id
  title   String
  content String?
  author  User   @relation(fields: [authorId], references: [id])
  authorId String
}
```

**Generated TypeScript:**

```typescript
// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  age?: number | null;
  posts: string[];
}

export interface Post {
  id: string;
  title: string;
  content?: string | null;
  author: string;
  authorId: string;
}
```

### Mongoose

```javascript
// models/User.js
const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  age: Number,
  role: { type: String, enum: ['user', 'admin'] },
  posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
});
```

**Generated TypeScript:**

```typescript
// types/index.ts
export interface User {
  name: string;
  email: string;
  age?: number | null;
  role: 'user' | 'admin';
  posts: string[];
}
```

---

## ⚙️ Configuration

### Config File (`typeweaver.config.json`)

```json
{
  "orm": "auto",
  "modelsPath": "./models",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "./types",
  "outputMode": "single",
  "watch": false,
  "includeComments": true,
  "exclude": [
    "**/node_modules/**",
    "**/*.test.{js,ts}"
  ]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orm` | string | `"auto"` | ORM to use: `auto`, `prisma`, `mongoose` |
| `modelsPath` | string | `"./models"` | Path to Mongoose models |
| `schemaPath` | string | `"./prisma/schema.prisma"` | Path to Prisma schema |
| `outputPath` | string | `"./types"` | Where to generate types |
| `outputMode` | string | `"single"` | `single` file or `separate` files |
| `watch` | boolean | `false` | Enable watch mode |
| `includeComments` | boolean | `true` | Include JSDoc comments |
| `readonly` | boolean | `false` | Generate readonly properties |
| `exclude` | string[] | `[]` | Files to exclude |

---

## 🖥️ CLI Commands

### `init`

Initialize configuration with interactive prompts.

```bash
npx typeweaver@beta init
```

**Options:**
- `--force` - Overwrite existing config

### `generate`

Generate types once from your schemas.

```bash
npx typeweaver@beta generate
```

**Options:**
- `--config <path>` - Custom config file path
- `--output <path>` - Override output path
- `--dry-run` - Preview without writing
- `--verbose` - Show detailed output

### `watch`

Watch schemas and auto-generate types on changes.

```bash
npx typeweaver@beta watch
```

**Options:**
- `--config <path>` - Custom config file path
- `--output <path>` - Override output path

### `info`

Show current configuration.

```bash
npx typeweaver@beta info
```

### `clean`

Remove all generated type files.

```bash
npx typeweaver@beta clean
```

**Options:**
- `--dry-run` - Preview files to be deleted

---

## 🎯 Use Cases

### 1. MERN Stack Development

```bash
backend/
  models/
    User.js
    Post.js
  typeweaver.config.json

frontend/
  types/  ← Auto-generated
    index.ts
```

### 2. Monorepo with Multiple Frontends

```json
{
  "orm": "prisma",
  "schemaPath": "./backend/schema.prisma",
  "outputPath": [
    "../web-app/src/types",
    "../mobile-app/src/types",
    "../admin-dashboard/src/types"
  ]
}
```

### 3. API Development

Generate types for your TypeScript SDK:

```bash
api/
  schema.prisma
  typeweaver.config.json → outputs to sdk/types/
sdk/
  types/
    index.ts  ← Auto-generated
```

---

## 🔧 Advanced Usage

### Custom Type Mapping

```json
{
  "customTypeMap": {
    "ObjectId": "string",
    "Mixed": "Record<string, any>"
  }
}
```

### Multiple Output Paths

```json
{
  "outputPath": [
    "./frontend/types",
    "./mobile/types"
  ]
}
```

### Exclude Patterns

```json
{
  "exclude": [
    "**/node_modules/**",
    "**/*.test.js",
    "**/deprecated/**"
  ]
}
```

---

## 🆚 Comparison

| Solution | Zero Migration | Real-Time | No Stack Lock-in | Setup Time |
|----------|----------------|-----------|------------------|------------|
| **typeweaver** | ✅ | ✅ (<500ms) | ✅ | <1 min |
| GraphQL Codegen | ❌ (Requires GraphQL) | ⚠️ (Slow) | ❌ | Weeks |
| tRPC | ❌ (Full rewrite) | ✅ | ❌ | Days |
| Manual npm packages | ✅ | ❌ (10+ min) | ✅ | Hours |
| Monorepo sharing | ⚠️ (Complex) | ⚠️ (Requires rebuild) | ✅ | Days |

---

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md).

### Development Setup

```bash
# Clone repo
git clone https://github.com/yourusername/type-bridge.git
cd type-bridge

# Install dependencies
npm install

# Run tests
npm test

# Test CLI locally
node bin/typeweaver.js generate --help
```

---

## 📝 License

MIT © TypeWeaver Contributors

---

## 🙏 Acknowledgments

- Inspired by the pain of manual type synchronization
- Built for the full-stack TypeScript community
- Thanks to all contributors and early adopters

---

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/yourusername/type-bridge/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/yourusername/type-bridge/discussions)
- 📧 **Email**: support@typeweaver.dev

---

## 🗺️ Roadmap

### v0.2.0
- [ ] TypeORM support
- [ ] Sequelize support
- [ ] Reference resolution (`--resolve-refs`)

### v0.3.0
- [ ] Zod schema generation
- [ ] JSON Schema generation
- [ ] Custom transformers

### v1.0.0
- [ ] VS Code extension
- [ ] API client generation
- [ ] Migration tools

---

**Made with ❤️ for full-stack TypeScript developers**

Stop wasting time on type synchronization. Start using **typeweaver** today! 🚀

