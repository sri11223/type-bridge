# Changelog

All notable changes to TypeWeaver will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.3] - 2025-11-23

### 🐛 Fixed

- **Prettier Lazy Loading**: Fixed Jest TTY handle issue by lazy-loading Prettier only when needed
  - Prevents test runner from hanging on exit
  - Skips formatting during test runs (via `JEST_WORKER_ID` detection)
  - Added `TYPEBRIDGE_SKIP_FORMAT` environment variable option

### 📝 Documentation

- **CONTRIBUTING.md**: Added comprehensive contributor guide with Windows PowerShell commands
- **.env.example**: Added environment variable documentation
- **README.md**: Improved documentation with Windows-specific setup instructions and better formatting

## [1.1.2] - 2025-11-03

### 🐛 Fixed

- **CLI Branding**: Updated all CLI messages and command names from "type-bridge" to "typeweaver" to match package name
  - Changed program name in help text
  - Updated setup wizard messages  
  - Updated watch mode banner
  - Config filename remains `type-bridge.config.json` for backwards compatibility

## [1.1.1] - 2025-11-03

### 🐛 Fixed - Mongoose Support

- **Enum Detection**: Fixed Mongoose enum fields not being detected when `type` and `enum` are both present
  ```javascript
  // Now correctly generates: role?: 'customer' | 'admin' | 'seller' | null
  role: { type: String, enum: ['customer', 'admin', 'seller'] }
  ```
- **Multiple Models Per File**: Fixed parser to extract all models from single file (was only getting first model)
- **Nested Object Enums**: Enums in nested objects now correctly generate as union types
- **Object Type Imports**: Fixed incorrect `import type { object }` - now uses built-in TypeScript `object` type

### ✨ Added

- **Comprehensive Mongoose Example**: Added full e-commerce example with 6 models
  - User, Product, Cart, Order, Review, Category
  - Demonstrates enums, nested objects (3+ levels), self-referencing, circular refs
  - All models with complex real-world scenarios

### 📝 Changes

- Updated `.gitignore` to exclude generated types in examples
- Improved error handling for parsing failures

## [1.1.0] - 2025-11-03

### 🔧 **MAJOR FIX: Separate File Mode**

Critical improvements to separate file generation mode - now generates perfect, importable TypeScript files!

### ✨ Added

- **Automatic Import Generation**: Separate files now include all necessary imports
  ```typescript
  import { Role, OrderStatus } from './enums';
  import type { Order } from './Order';
  import type { Cart } from './Cart';
  ```
- **Dedicated Enums File**: Enums are now exported in a single `enums.ts` file
- **Smart Dependency Detection**: Automatically detects enum vs model dependencies
- **Type-only Imports**: Uses `import type` for model references to avoid circular issues

### 🐛 Fixed

- **DateTime Type Correction**: `DateTime` fields now generate as `string` (ISO format) instead of `Date`
  - This matches actual JSON serialization behavior
  - Frontend gets proper type checking with date strings
- **Optional ID Fields**: Fields with `@default(uuid())` are now correctly required, not optional
  ```typescript
  // Before: id?: string | null  ❌
  // After:  id: string           ✅
  ```
- **Enum Import Paths**: Enums now correctly import from `'./enums'` instead of individual files
- **Missing newlines**: Fixed formatting issues in generated files

### 📚 Documentation

- **Comprehensive Docs**: Added 5 complete documentation files
  - `docs/getting-started.md` - Step-by-step tutorial
  - `docs/configuration.md` - Complete config reference
  - `docs/cli-reference.md` - All CLI commands with examples
  - `docs/troubleshooting.md` - Common issues and solutions
  - `docs/contributing.md` - Development guide

### ⚡ Improved

- Better enum detection in separate file mode
- More robust type dependency analysis
- Cleaner generated code with proper spacing

### 🧪 Testing

- All 284 tests passing
- Zero ESLint errors
- Verified with complex e-commerce example (8 models, 2 enums)

## [1.0.0] - 2025-11-03

### 🎉 **PRODUCTION RELEASE**

TypeWeaver is now production-ready! This release includes significant improvements in type generation quality, circular reference handling, and new verification capabilities.

### ✨ Added

- **Circular Reference Detection**: Automatically detects and safely handles circular references between models (e.g., `User.friends: User[]`)
- **Nested Object Support**: Full support for MongoDB embedded documents - generates proper nested interfaces
  ```typescript
  address: {
    street: string;
    city: string;
    zip: number;
  }
  ```
- **Verification Command**: New `verify` command to check if generated types match current schemas
  - Perfect for CI/CD pipelines
  - Exit code 0 if in sync, 1 if out of sync
  - Usage: `npx typeweaver verify`
- **Self-Reference Marking**: Models that reference themselves are now properly marked and handled

### 🔧 Fixed

- **Better Type Mappings**:
  - `Prisma.Json` now generates `Record<string, unknown>` instead of `any`
  - `Schema.Types.Mixed` now generates `Record<string, any>` instead of `any`
  - Better type safety for JSON and mixed fields
- **Enum Array Types**: Arrays of enums now generate proper union types
  - Before: `roles: string[]`
  - After: `roles: ('USER' | 'ADMIN')[]`
- **Const Assignment Error**: Fixed bug where models array couldn't be reassigned during processing
- **Watch Mode**: Graceful shutdown handlers already present (SIGINT/SIGTERM)

### 🚀 Improved

- **Type Generation Quality**: More accurate TypeScript types that match your schema intent
- **Error Messages**: Better context in error messages
- **Test Coverage**: All 284 tests passing with comprehensive edge case coverage
- **Documentation**: Updated README with production-ready examples

### 📦 Core Features (Stable)

- ✅ **Prisma Support**: Full model parsing, enums, relationships
- ✅ **Mongoose Support**: Schema parsing with refs, enums, and embedded documents
- ✅ **Watch Mode**: Real-time regeneration on file changes (<500ms)
- ✅ **Auto ORM Detection**: Automatically detects Prisma/Mongoose
- ✅ **Multiple Output Modes**: Single file or one file per model
- ✅ **CLI Commands**: init, generate, watch, verify, info, clean
- ✅ **Backup System**: Creates .backup files before overwriting
- ✅ **Type Safety**: Handles optional fields, arrays, enums, references, nested objects

### 🔄 Changed

- **Version**: Promoted from 0.1.2 (beta) to 1.0.0 (production)
- **Installation**: No longer requires `@beta` tag
  - Old: `npm install -D typeweaver@beta`
  - New: `npm install -D typeweaver`
- **Usage**: All commands work without `@beta`
  - Old: `npx typeweaver@beta generate`
  - New: `npx typeweaver generate`

### 🎯 What's Next (Planned for v1.1.0+)

- Custom type mappings configuration
- Field transformations (removeFields, renameFields)
- DTO generation (CreateDto, UpdateDto, ResponseDto)
- TypeORM support
- Zod schema generation
- GraphQL schema generation

---

## [0.1.2] - 2025-11-01

### Beta Release

- Initial beta release
- Prisma and Mongoose support
- Basic CLI commands
- Watch mode
- Single/multiple file output

---

## Migration Guide: 0.1.2 → 1.0.0

### No Breaking Changes! 🎉

TypeWeaver 1.0.0 is **fully backward compatible** with 0.1.2. Your existing config files and generated types will continue to work.

### How to Upgrade

```bash
# Update package
npm install -D typeweaver@latest

# Regenerate types (optional, but recommended)
npx typeweaver generate
```

### What You Get

After upgrading, your generated types will automatically benefit from:
- Better type mappings (Json → Record<string, unknown>)
- Proper enum arrays with union types
- Circular reference handling
- Nested object support

### New Commands Available

```bash
# Verify types are in sync (new!)
npx typeweaver verify

# All your existing commands still work
npx typeweaver init
npx typeweaver generate
npx typeweaver watch
```

---

## Support

- 📚 [Documentation](https://github.com/sri11223/type-bridge#readme)
- 🐛 [Report Issues](https://github.com/sri11223/type-bridge/issues)
- 💬 [Discussions](https://github.com/sri11223/type-bridge/discussions)

---

**Thank you for using TypeWeaver!** 🎉

If you find this package useful, please consider:
- ⭐ Starring the repo on GitHub
- 📢 Sharing it with your team
- 🐛 Reporting issues you encounter
- 💡 Suggesting features you'd like to see
