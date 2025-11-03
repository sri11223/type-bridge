# 🔧 Troubleshooting Guide

Solutions to common issues and errors with TypeWeaver.

---

## 📖 Quick Navigation

- [Installation Issues](#-installation-issues)
- [Configuration Issues](#-configuration-issues)
- [Generation Issues](#-generation-issues)
- [Watch Mode Issues](#-watch-mode-issues)
- [Type Issues](#-type-issues)
- [ORM-Specific Issues](#-orm-specific-issues)
- [CI/CD Issues](#-cicd-issues)
- [Performance Issues](#-performance-issues)

---

## 🚨 Installation Issues

### Cannot find module 'typeweaver'

**Error:**
```
Error: Cannot find module 'typeweaver'
```

**Solutions:**

1. **Install as dev dependency:**
   ```bash
   npm install --save-dev typeweaver
   ```

2. **Use npx (no install needed):**
   ```bash
   npx typeweaver generate
   ```

3. **Check node_modules:**
   ```bash
   ls node_modules/typeweaver
   ```

4. **Clear cache and reinstall:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

---

### Node version compatibility

**Error:**
```
Error: The engine "node" is incompatible
```

**Requirement:** Node.js >= 16.0.0

**Check version:**
```bash
node --version
```

**Solutions:**

1. **Update Node.js:**
   - Use [nvm](https://github.com/nvm-sh/nvm):
     ```bash
     nvm install 18
     nvm use 18
     ```
   - Or download from [nodejs.org](https://nodejs.org/)

2. **Use compatible version:**
   ```bash
   nvm install 16
   nvm use 16
   ```

---

## ⚙️ Configuration Issues

### Configuration file not found

**Error:**
```
❌ Configuration file not found
   Expected: ./typeweaver.config.json
```

**Solutions:**

1. **Initialize config:**
   ```bash
   npx typeweaver init
   ```

2. **Create manually:**
   ```json
   {
     "orm": "prisma",
     "input": "./prisma/schema.prisma",
     "output": "./types"
   }
   ```

3. **Use custom path:**
   ```bash
   npx typeweaver generate --config ./custom-config.json
   ```

---

### Invalid configuration

**Error:**
```
❌ Invalid configuration
   Field "orm" must be "prisma" or "mongoose"
```

**Solutions:**

1. **Check required fields:**
   ```json
   {
     "orm": "prisma",      // Required
     "input": "./schema",  // Required
     "output": "./types"   // Required
   }
   ```

2. **Validate JSON syntax:**
   - Use [jsonlint.com](https://jsonlint.com/)
   - Check for trailing commas
   - Check for missing quotes

3. **Re-initialize:**
   ```bash
   npx typeweaver init --force
   ```

---

### Schema path not found

**Error:**
```
❌ Schema file not found
   Path: ./prisma/schema.prisma
```

**Solutions:**

1. **Check file exists:**
   ```bash
   ls ./prisma/schema.prisma
   ```

2. **Use correct path:**
   ```json
   {
     "input": "./prisma/schema.prisma"  // For Prisma
   }
   ```
   ```json
   {
     "input": "./models"  // For Mongoose
   }
   ```

3. **Use absolute path:**
   ```json
   {
     "input": "/Users/you/project/prisma/schema.prisma"
   }
   ```

---

## 🔨 Generation Issues

### No ORM detected

**Error:**
```
❌ No supported ORM detected
   Please install Prisma or Mongoose
```

**Solutions:**

1. **Install Prisma:**
   ```bash
   npm install --save-dev prisma
   npm install @prisma/client
   ```

2. **Install Mongoose:**
   ```bash
   npm install mongoose
   ```

3. **Check package.json:**
   ```json
   {
     "devDependencies": {
       "prisma": "^5.0.0"
     },
     "dependencies": {
       "@prisma/client": "^5.0.0"
     }
   }
   ```

---

### Schema parsing failed

**Error:**
```
❌ Schema validation failed
   Field "email" in User: type is required
```

**Solutions:**

1. **Fix schema syntax:**
   ```prisma
   // ❌ Wrong
   model User {
     email  // Missing type
   }

   // ✅ Correct
   model User {
     email String
   }
   ```

2. **Check for typos:**
   ```prisma
   // ❌ Wrong
   model User {
     name Strign  // Typo
   }

   // ✅ Correct
   model User {
     name String
   }
   ```

3. **Validate Prisma schema:**
   ```bash
   npx prisma validate
   ```

---

### Permission denied writing files

**Error:**
```
❌ Failed to write file
   Permission denied: ./types/index.ts
```

**Solutions:**

1. **Check directory permissions:**
   ```bash
   ls -la ./types
   ```

2. **Create directory:**
   ```bash
   mkdir -p ./types
   ```

3. **Fix permissions:**
   ```bash
   chmod 755 ./types
   ```

4. **Use different output path:**
   ```json
   {
     "output": "./src/types"
   }
   ```

---

### Circular reference warnings

**Warning:**
```
⚠️  Circular reference detected: User ↔ Post
```

**This is informational, not an error!**

**What it means:**
- Two models reference each other
- Example: User has posts[], Post has author

**Generated code:**
```typescript
export interface User {
  id: string;
  posts: Post[];  // Forward reference
}

export interface Post {
  id: string;
  author: User;   // Circular reference
}
```

**No action needed** - TypeScript handles this fine!

---

## 👀 Watch Mode Issues

### Watch not detecting changes

**Problem:** Files change but types don't regenerate

**Solutions:**

1. **Check watched path:**
   ```json
   {
     "input": "./prisma/schema.prisma",  // Exact file
     "watch": {
       "enabled": true
     }
   }
   ```

2. **Increase debounce:**
   ```json
   {
     "watch": {
       "debounce": 1000  // Wait 1 second
     }
   }
   ```

3. **Check file system limits:**
   ```bash
   # macOS/Linux
   echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
   sudo sysctl -p
   ```

4. **Restart watch:**
   ```bash
   # Stop (Ctrl+C)
   # Start again
   npx typeweaver watch
   ```

---

### Watch using too much CPU

**Problem:** High CPU usage in watch mode

**Solutions:**

1. **Increase debounce:**
   ```json
   {
     "watch": {
       "debounce": 1000  // Longer delay
     }
   }
   ```

2. **Exclude files:**
   ```json
   {
     "watch": {
       "ignored": [
         "**/node_modules/**",
         "**/*.test.js"
       ]
     }
   }
   ```

3. **Use polling:**
   ```json
   {
     "watch": {
       "usePolling": true,
       "interval": 1000
     }
   }
   ```

---

### Watch won't stop

**Problem:** Watch continues after Ctrl+C

**Solutions:**

1. **Force kill:**
   ```bash
   # Find process
   ps aux | grep typeweaver
   
   # Kill it
   kill -9 <PID>
   ```

2. **Kill all Node processes:**
   ```bash
   # macOS/Linux
   killall node
   
   # Windows
   taskkill /F /IM node.exe
   ```

---

## 📝 Type Issues

### Generated types are wrong

**Problem:** Types don't match schema

**Solutions:**

1. **Regenerate:**
   ```bash
   npx typeweaver generate
   ```

2. **Check schema is saved:**
   - Make sure you saved your schema file
   - Check file contents

3. **Clear cache:**
   ```bash
   npx typeweaver clean
   npx typeweaver generate
   ```

4. **Verify:**
   ```bash
   npx typeweaver verify
   ```

---

### Optional fields not marked optional

**Problem:**
```typescript
// Got:
interface User {
  email: string;  // Not optional
}

// Want:
interface User {
  email?: string;  // Optional
}
```

**Solutions:**

1. **Prisma - Use `?` or `@default`:**
   ```prisma
   model User {
     email String?           // Optional
     name  String @default("")  // Has default
   }
   ```

2. **Mongoose - Set required:**
   ```javascript
   const userSchema = new Schema({
     email: { type: String, required: false },  // Optional
     name: { type: String, required: true }     // Required
   });
   ```

---

### Enum values are wrong

**Problem:**
```typescript
// Got:
export type Role = 'ADMIN' | 'USER';

// Want specific values
```

**Solutions:**

1. **Prisma - Define enum:**
   ```prisma
   enum Role {
     ADMIN
     USER
     MODERATOR
   }

   model User {
     role Role
   }
   ```

2. **Mongoose - Use enum:**
   ```javascript
   const userSchema = new Schema({
     role: {
       type: String,
       enum: ['ADMIN', 'USER', 'MODERATOR']
     }
   });
   ```

---

### Date types are strings

**This is correct!**

**Explanation:**
- JSON doesn't have a Date type
- Dates are serialized as ISO strings
- This matches runtime behavior

**Generated:**
```typescript
interface User {
  createdAt: string;  // ISO date string
}
```

**Usage:**
```typescript
const user = await fetchUser();
const date = new Date(user.createdAt);  // Convert to Date
```

---

## 🗄️ ORM-Specific Issues

### Prisma Issues

#### Prisma schema not found

**Error:**
```
❌ Prisma schema not found
```

**Solutions:**

1. **Check location:**
   ```bash
   ls ./prisma/schema.prisma
   ```

2. **Initialize Prisma:**
   ```bash
   npx prisma init
   ```

3. **Set correct path:**
   ```json
   {
     "input": "./prisma/schema.prisma"
   }
   ```

---

#### Unsupported Prisma type

**Warning:**
```
⚠️  Unknown type: Decimal
   Using: any
```

**Solutions:**

1. **Use supported types:**
   - String, Int, Float, Boolean, DateTime
   - Json, Bytes

2. **Custom mapping:**
   ```prisma
   // Use String for Decimal
   model Product {
     price String  // Instead of Decimal
   }
   ```

3. **Or keep as `any`:**
   ```typescript
   interface Product {
     price: any;  // Will be generated
   }
   ```

---

### Mongoose Issues

#### No Mongoose models found

**Error:**
```
❌ No Mongoose models found
   Path: ./models
```

**Solutions:**

1. **Check file exports:**
   ```javascript
   // models/User.js
   const mongoose = require('mongoose');
   const userSchema = new mongoose.Schema({ ... });
   
   module.exports = mongoose.model('User', userSchema);  // Must export
   ```

2. **Check file pattern:**
   ```json
   {
     "input": "./models/**/*.js"  // Glob pattern
   }
   ```

3. **Check directory:**
   ```bash
   ls ./models
   ```

---

#### Schema not recognized

**Problem:** Mongoose schema doesn't generate types

**Solutions:**

1. **Use mongoose.Schema:**
   ```javascript
   // ❌ Wrong
   const schema = {
     name: String
   };

   // ✅ Correct
   const schema = new mongoose.Schema({
     name: String
   });
   ```

2. **Export model:**
   ```javascript
   module.exports = mongoose.model('User', userSchema);
   ```

---

## 🚀 CI/CD Issues

### Verify fails in CI

**Error:**
```
❌ Types are OUT OF SYNC
```

**Solutions:**

1. **Generate before verify:**
   ```yaml
   # .github/workflows/ci.yml
   - name: Generate types
     run: npx typeweaver generate
   
   - name: Verify types
     run: npx typeweaver verify
   ```

2. **Commit generated types:**
   ```bash
   git add types/
   git commit -m "Update types"
   ```

3. **Or generate in CI:**
   ```yaml
   # Don't commit types, generate fresh
   - name: Generate and verify
     run: |
       npx typeweaver generate
       npm test
   ```

---

### Permission issues in Docker

**Error:**
```
EACCES: permission denied
```

**Solutions:**

1. **Run as user:**
   ```dockerfile
   FROM node:18
   
   USER node  # Don't run as root
   WORKDIR /app
   
   COPY --chown=node:node . .
   RUN npx typeweaver generate
   ```

2. **Fix permissions:**
   ```dockerfile
   RUN mkdir -p /app/types && \
       chown -R node:node /app/types
   ```

---

## ⚡ Performance Issues

### Generation is slow

**Problem:** Takes too long to generate

**Solutions:**

1. **Check schema size:**
   ```bash
   # How many models?
   grep "model " prisma/schema.prisma | wc -l
   ```

2. **Split schemas:**
   ```json
   {
     "input": [
       "./prisma/users.prisma",
       "./prisma/posts.prisma"
     ]
   }
   ```

3. **Disable features:**
   ```json
   {
     "includeComments": false,  // Skip comments
     "backup": false            // Skip backup
   }
   ```

---

### Watch is slow

**Problem:** Regeneration takes too long

**Solutions:**

1. **Increase debounce:**
   ```json
   {
     "watch": {
       "debounce": 1000  // Wait longer
     }
   }
   ```

2. **Reduce watched files:**
   ```json
   {
     "input": "./prisma/schema.prisma",  // Single file
     "watch": {
       "ignored": ["**/test/**"]
     }
   }
   ```

---

### Large output files

**Problem:** Generated files are huge

**Solutions:**

1. **Use per-model output:**
   ```json
   {
     "outputMode": "per-model"  // Multiple smaller files
   }
   ```

2. **Disable comments:**
   ```json
   {
     "includeComments": false  // Reduce file size
   }
   ```

3. **Split by domain:**
   ```json
   {
     "output": {
       "users": "./types/users",
       "products": "./types/products"
     }
   }
   ```

---

## 🔍 Debugging

### Enable verbose output

```bash
npx typeweaver generate --verbose
```

**Shows:**
- Detailed steps
- File operations
- Timing information
- Error stack traces

---

### Check configuration

```bash
npx typeweaver info
```

**Shows:**
- Loaded config
- Detected ORM
- Schema paths
- Output settings

---

### Dry run

```bash
npx typeweaver generate --dry-run
```

**Shows:**
- What would be generated
- Without writing files
- Good for testing

---

## 📞 Getting More Help

### Still stuck?

1. **Check existing issues:**
   - [GitHub Issues](https://github.com/sri11223/type-bridge/issues)
   - Search for your error

2. **Ask for help:**
   - [GitHub Discussions](https://github.com/sri11223/type-bridge/discussions)
   - Include:
     - Error message
     - Your configuration
     - ORM and version
     - Node.js version

3. **Report a bug:**
   - [Create an issue](https://github.com/sri11223/type-bridge/issues/new)
   - Include:
     - Minimal reproduction
     - Expected vs actual behavior
     - Environment details

---

## 📚 Related Guides

- [Getting Started](./getting-started.md) - Initial setup
- [Configuration](./configuration.md) - Config options
- [CLI Reference](./cli-reference.md) - Command details

---

## ✅ Quick Checklist

Before asking for help, verify:

- [ ] Node.js >= 16.0.0 installed
- [ ] TypeWeaver installed (`npm list typeweaver`)
- [ ] ORM installed (Prisma or Mongoose)
- [ ] Config file exists (`typeweaver.config.json`)
- [ ] Schema files exist
- [ ] Output directory is writable
- [ ] Schema syntax is valid
- [ ] Tried `npx typeweaver clean` + regenerate
- [ ] Checked [GitHub Issues](https://github.com/sri11223/type-bridge/issues)

---

**Need immediate help?** Check [GitHub Discussions](https://github.com/sri11223/type-bridge/discussions) 💬
