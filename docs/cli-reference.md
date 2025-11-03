# 💻 CLI Reference

Complete command-line reference for TypeWeaver.

---

## 📖 Overview

TypeWeaver provides several commands to manage type generation:

```bash
npx typeweaver <command> [options]
```

### Quick Reference

| Command | Description |
|---------|-------------|
| `init` | Initialize configuration |
| `generate` | Generate types once |
| `watch` | Watch and auto-regenerate |
| `verify` | Verify types are in sync |
| `info` | Show configuration |
| `clean` | Remove generated files |
| `--help` | Show help |
| `--version` | Show version |

---

## 🚀 Commands

### `init`

Initialize TypeWeaver configuration with interactive prompts.

```bash
npx typeweaver init [options]
```

**What it does:**
1. Detects your ORM (Prisma/Mongoose)
2. Asks for schema locations
3. Asks for output preferences
4. Creates `typeweaver.config.json`

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `--force` | boolean | Overwrite existing config |

**Examples:**

```bash
# Interactive setup
npx typeweaver init

# Force overwrite existing config
npx typeweaver init --force
```

**Output:**
```
🌉 TypeWeaver Setup

Detecting ORM...
✓ Which ORM are you using? › Prisma
✓ Where is your schema file? › ./prisma/schema.prisma
✓ Where should types be generated? › ./types
✓ Output mode? › Single file

✅ Created typeweaver.config.json
```

---

### `generate`

Generate TypeScript types from your schemas.

```bash
npx typeweaver generate [options]
```

**What it does:**
1. Detects ORM
2. Parses schemas
3. Generates TypeScript interfaces
4. Writes to output files

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `--config <path>` | string | Custom config file path |
| `--output <path>` | string | Override output path |
| `--dry-run` | boolean | Preview without writing |
| `--verbose` | boolean | Show detailed output |

**Examples:**

```bash
# Generate with default config
npx typeweaver generate

# Use custom config
npx typeweaver generate --config ./custom-config.json

# Override output path
npx typeweaver generate --output ./custom-types

# Dry run (preview only)
npx typeweaver generate --dry-run

# Verbose output
npx typeweaver generate --verbose
```

**Output:**
```
🔍 Detecting ORM...
✅ Detected: prisma
📖 Parsing schemas...
✅ Found 5 models and 2 enums
✔️  Validating schemas...
⚙️  Generating TypeScript...
💾 Writing files...
✅ Generation complete!
```

---

### `watch`

Watch schemas and auto-regenerate types on changes.

```bash
npx typeweaver watch [options]
```

**What it does:**
1. Performs initial generation
2. Watches schema files for changes
3. Auto-regenerates on file changes
4. Runs until stopped (Ctrl+C)

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `--config <path>` | string | Custom config file path |
| `--output <path>` | string | Override output path |

**Examples:**

```bash
# Start watching
npx typeweaver watch

# Watch with custom config
npx typeweaver watch --config ./custom-config.json

# Watch with custom output
npx typeweaver watch --output ../frontend/types
```

**Output:**
```
🚀 Initial generation...
✅ Found 5 models and 2 enums
✅ Initial generation complete!

👀 Watching for changes...
Watching: ./prisma/schema.prisma

🔄 Change detected: schema.prisma
Regenerating types...
✅ Types updated successfully!
```

**Stopping:**
- Press `Ctrl+C` to stop watching
- Graceful shutdown with cleanup

---

### `verify`

Verify that generated types match current schemas.

```bash
npx typeweaver verify [options]
```

**What it does:**
1. Reads existing generated types
2. Generates types from current schema
3. Compares them
4. Exits with code 0 (match) or 1 (mismatch)

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `--config <path>` | string | Custom config file path |

**Examples:**

```bash
# Verify types
npx typeweaver verify

# With custom config
npx typeweaver verify --config ./custom-config.json
```

**Output (in sync):**
```
🔍 Verifying type synchronization...

Generating types from current schema...
✅ Types are in sync with schemas!
```

**Output (out of sync):**
```
🔍 Verifying type synchronization...

Generating types from current schema...
⚠️  Types are OUT OF SYNC with schemas!

   Schema has changed since types were last generated.

💡 Run: typeweaver generate
```

**Exit Codes:**
- `0`: Types are in sync ✅
- `1`: Types are out of sync or error ❌

**Use in CI/CD:**
```yaml
# .github/workflows/ci.yml
- name: Verify types
  run: npx typeweaver verify
```

```bash
# Pre-commit hook
npx typeweaver verify || exit 1
```

---

### `info`

Show current configuration and status.

```bash
npx typeweaver info [options]
```

**What it does:**
- Displays loaded configuration
- Shows detected ORM
- Lists schema paths
- Shows output settings

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `--config <path>` | string | Custom config file path |

**Examples:**

```bash
# Show info
npx typeweaver info

# With custom config
npx typeweaver info --config ./custom-config.json
```

**Output:**
```
📊 TypeWeaver Configuration

ORM: prisma
Schema: ./prisma/schema.prisma
Output: ./types
Mode: single
Comments: enabled
Backup: enabled
Watch debounce: 300ms
```

---

### `clean`

Remove all generated type files.

```bash
npx typeweaver clean [options]
```

**What it does:**
- Finds generated files based on config
- Deletes them (with confirmation)
- Cleans up backup files

**Options:**

| Option | Type | Description |
|--------|------|-------------|
| `--config <path>` | string | Custom config file path |
| `--dry-run` | boolean | Preview files to delete |
| `--force` | boolean | Skip confirmation |

**Examples:**

```bash
# Clean with confirmation
npx typeweaver clean

# Dry run (preview only)
npx typeweaver clean --dry-run

# Force clean (no confirmation)
npx typeweaver clean --force

# With custom config
npx typeweaver clean --config ./custom-config.json
```

**Output:**
```
🗑️  Cleaning generated files...

Files to delete:
  - ./types/index.ts
  - ./types/index.ts.backup

⚠️  Delete 2 files? (y/N): y

✅ Cleaned 2 files
```

---

### `--help`

Show help information.

```bash
npx typeweaver --help
npx typeweaver <command> --help
```

**Examples:**

```bash
# General help
npx typeweaver --help

# Command-specific help
npx typeweaver generate --help
npx typeweaver watch --help
```

**Output:**
```
TypeWeaver v1.0.0

Auto-generate TypeScript types from your ORM schemas

Usage: typeweaver <command> [options]

Commands:
  init        Initialize configuration
  generate    Generate types once
  watch       Watch and auto-regenerate
  verify      Verify types are in sync
  info        Show configuration
  clean       Remove generated files

Options:
  -V, --version     Show version number
  -h, --help        Show help
```

---

### `--version`

Show TypeWeaver version.

```bash
npx typeweaver --version
```

**Output:**
```
1.0.0
```

---

## 🎯 Common Workflows

### Development Workflow

```bash
# 1. Initial setup
npx typeweaver init

# 2. Start development with watch mode
npx typeweaver watch

# Your types auto-update as you develop!
```

### CI/CD Workflow

```bash
# 1. Generate types
npx typeweaver generate

# 2. Verify they're in sync
npx typeweaver verify

# 3. Run tests
npm test

# 4. Build
npm run build
```

### Pre-commit Workflow

```bash
# .husky/pre-commit
#!/bin/sh

# Verify types are in sync
npx typeweaver verify || {
  echo "⚠️  Types are out of sync!"
  echo "Run: npx typeweaver generate"
  exit 1
}

# Continue with other checks
npm run lint
npm test
```

---

## 🔧 Global Options

These options work with all commands:

| Option | Description |
|--------|-------------|
| `--config <path>` | Use custom config file |
| `--help` | Show command help |
| `--version` | Show version |

**Examples:**

```bash
# Any command with custom config
npx typeweaver generate --config ./prod-config.json
npx typeweaver watch --config ./dev-config.json
npx typeweaver verify --config ./ci-config.json
```

---

## 📝 Output Formats

### Standard Output

```
🔍 Detecting ORM...
✅ Detected: prisma
📖 Parsing schemas...
✅ Found 5 models
✔️  Validating schemas...
⚙️  Generating TypeScript...
💾 Writing files...
✅ Generation complete!
```

### Verbose Output

```bash
npx typeweaver generate --verbose
```

```
🔍 Detecting ORM...
   Checking package.json...
   Found: prisma
✅ Detected: prisma

📖 Parsing schemas...
   Reading: ./prisma/schema.prisma
   Parsing model: User
   Parsing model: Post
   Parsing model: Comment
   Parsing enum: Role
   Parsing enum: Status
✅ Found 3 models and 2 enums

✔️  Validating schemas...
   Validating User...
   Validating Post...
   Validating Comment...
   All schemas valid

⚙️  Generating TypeScript...
   Generating interface: User
   Generating interface: Post
   Generating interface: Comment
   Generating enum: Role
   Generating enum: Status

💾 Writing files...
   Creating backup: ./types/index.ts.backup
   Writing: ./types/index.ts
   Written: 245 lines

✅ Generation complete!
   Output: ./types/index.ts
   Models: 3
   Enums: 2
   Time: 487ms
```

---

## 🚨 Error Handling

### Common Errors

**Config not found:**
```
❌ Configuration file not found
   Expected: ./typeweaver.config.json

💡 Run: npx typeweaver init
```

**Invalid ORM:**
```
❌ No supported ORM detected
   Please install Prisma or Mongoose

💡 Add to package.json:
   npm install prisma --save-dev
```

**Invalid schema:**
```
❌ Schema validation failed
   Field "email" in User: type is required

Check: ./prisma/schema.prisma
```

**Write permission:**
```
❌ Failed to write file
   Permission denied: ./types/index.ts

💡 Check file permissions or run with sudo
```

---

## 💡 Tips & Tricks

### Quick Generate

Add to `package.json`:
```json
{
  "scripts": {
    "types": "typeweaver generate",
    "types:watch": "typeweaver watch",
    "types:check": "typeweaver verify"
  }
}
```

Then use:
```bash
npm run types
npm run types:watch
npm run types:check
```

### Multiple Configs

Manage different environments:
```bash
# Development
npx typeweaver watch --config typeweaver.dev.json

# Staging
npx typeweaver generate --config typeweaver.staging.json

# Production
npx typeweaver generate --config typeweaver.prod.json
```

### Shell Aliases

Add to `.bashrc` or `.zshrc`:
```bash
alias tw='npx typeweaver'
alias twg='npx typeweaver generate'
alias tww='npx typeweaver watch'
alias twv='npx typeweaver verify'
```

Then use:
```bash
tw init
twg
tww
twv
```

---

## 📚 Related Guides

- [Getting Started](./getting-started.md) - Initial setup
- [Configuration](./configuration.md) - Config file reference
- [Troubleshooting](./troubleshooting.md) - Common issues

---

## 🆘 Need Help?

- Command not working? See [Troubleshooting](./troubleshooting.md)
- Want examples? See [Getting Started](./getting-started.md)
- Have questions? [GitHub Discussions](https://github.com/sri11223/type-bridge/discussions)
