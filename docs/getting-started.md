# 🚀 Getting Started with TypeWeaver

Welcome to TypeWeaver! This guide will help you set up and start using TypeWeaver in your project.

---

## 📦 Installation

### Prerequisites

- Node.js >= 16.0.0
- npm or yarn
- A project using Prisma or Mongoose

### Install TypeWeaver

```bash
npm install -D typeweaver
```

Or with yarn:

```bash
yarn add -D typeweaver
```

---

## 🎯 Quick Start

### Step 1: Initialize Configuration

Run the interactive setup wizard:

```bash
npx typeweaver init
```

You'll be asked:
1. **Which ORM?** - Select Prisma, Mongoose, or Auto-detect
2. **Schema location?** - Path to your schema file(s)
3. **Output location?** - Where to generate TypeScript types
4. **Output mode?** - Single file or multiple files

This creates a `typeweaver.config.json` file:

```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "./types",
  "outputMode": "single"
}
```

### Step 2: Generate Types

Generate types from your schemas:

```bash
npx typeweaver generate
```

This creates TypeScript interfaces in your specified output directory!

### Step 3: Use Watch Mode (Optional)

For automatic regeneration during development:

```bash
npx typeweaver watch
```

Now every time you change your schema, types are automatically regenerated in <500ms!

---

## 📚 Example Workflows

### Prisma Workflow

**1. Your Prisma Schema:**
```prisma
// prisma/schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  age       Int?
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
}

model Post {
  id        String   @id
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}

enum Role {
  USER
  ADMIN
  MODERATOR
}
```

**2. Initialize TypeWeaver:**
```bash
npx typeweaver init
# Select: Prisma
# Schema: ./prisma/schema.prisma
# Output: ./types
# Mode: single
```

**3. Generate Types:**
```bash
npx typeweaver generate
```

**4. Generated Types:**
```typescript
// types/index.ts
export interface User {
  id: string;
  email: string;
  name: string;
  age?: number | null;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  posts: Post[];
  createdAt: Date;
}

export interface Post {
  id: string;
  title: string;
  content?: string | null;
  published: boolean;
  author: string;
  authorId: string;
}
```

**5. Use in Frontend:**
```typescript
// React component
import { User, Post } from './types';

const UserProfile: React.FC<{ user: User }> = ({ user }) => {
  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      <p>Role: {user.role}</p>
      <p>Posts: {user.posts.length}</p>
    </div>
  );
};
```

---

### Mongoose Workflow

**1. Your Mongoose Models:**
```javascript
// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  age: Number,
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
  address: {
    street: String,
    city: String,
    zip: Number
  }
});

module.exports = mongoose.model('User', userSchema);
```

**2. Initialize TypeWeaver:**
```bash
npx typeweaver init
# Select: Mongoose
# Models path: ./models
# Output: ./types
# Mode: single
```

**3. Generate Types:**
```bash
npx typeweaver generate
```

**4. Generated Types:**
```typescript
// types/index.ts
export interface User {
  _id?: string;
  name: string;
  email: string;
  age?: number | null;
  role: 'user' | 'admin' | 'moderator';
  posts: string[];
  address: {
    street: string;
    city: string;
    zip: number;
  };
}
```

---

## 🎨 Monorepo Setup

For monorepos with separate backend and frontend:

```
my-app/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── typeweaver.config.json  ← Configure here
│   └── package.json
└── frontend/
    ├── src/
    │   └── types/  ← Types generated here
    └── package.json
```

**Backend config:**
```json
{
  "orm": "prisma",
  "schemaPath": "./prisma/schema.prisma",
  "outputPath": "../frontend/src/types",
  "outputMode": "single"
}
```

**Run from backend:**
```bash
cd backend
npx typeweaver watch
```

Types automatically appear in `frontend/src/types`! 🎉

---

## 🔧 Integration with Development Workflow

### Add to package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"typeweaver watch\" \"nodemon server.js\"",
    "build": "typeweaver generate && tsc",
    "types": "typeweaver generate",
    "types:watch": "typeweaver watch",
    "types:verify": "typeweaver verify"
  }
}
```

### Pre-commit Hook (Husky)

```bash
# .husky/pre-commit
npx typeweaver verify || (echo "⚠️  Types are out of sync! Run 'npm run types'" && exit 1)
```

### CI/CD Integration

```yaml
# .github/workflows/ci.yml
- name: Verify types are in sync
  run: npx typeweaver verify
```

---

## ✅ Verification

Ensure your types are always in sync:

```bash
npx typeweaver verify
```

- **Exit code 0**: Types are in sync ✅
- **Exit code 1**: Types are outdated ⚠️

Perfect for CI/CD pipelines!

---

## 🎯 Common Use Cases

### Use Case 1: API DTOs

Use TypeWeaver types for API request/response validation:

```typescript
import { User, Post } from './types';

// API route
app.post('/api/users', (req, res) => {
  const userData: User = req.body;
  // TypeScript validates the structure!
});
```

### Use Case 2: Form Validation

```typescript
import { User } from './types';
import { z } from 'zod';

// Create Zod schema from TypeWeaver type
const UserSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

type User = z.infer<typeof UserSchema>; // Matches TypeWeaver type!
```

### Use Case 3: React Query

```typescript
import { useQuery } from '@tanstack/react-query';
import { User } from './types';

const useUser = (id: string) => {
  return useQuery<User>({
    queryKey: ['user', id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json())
  });
};
```

---

## 🚨 Troubleshooting

### Issue: "No supported ORM detected"

**Solution:**
- Ensure Prisma or Mongoose is in your `package.json`
- Run `npx typeweaver init` and manually select your ORM
- Check schema path in config file

### Issue: "No models found"

**For Prisma:**
- Verify `schemaPath` points to `schema.prisma`
- Check file exists and has models

**For Mongoose:**
- Verify `modelsPath` points to models directory
- Ensure model files export properly

### Issue: Types not updating

**Solution:**
```bash
# Regenerate forcefully
npx typeweaver generate --force

# Or restart watch mode
npx typeweaver watch
```

### More Help

See [Troubleshooting Guide](./troubleshooting.md) for detailed solutions.

---

## 📖 Next Steps

Now that you're set up:

1. **Learn Configuration**: See [Configuration Guide](./configuration.md)
2. **Explore CLI**: See [CLI Reference](./cli-reference.md)
3. **Customize Output**: Adjust config for your needs
4. **Set Up CI/CD**: Add `verify` to your pipeline

---

## 🎉 You're Ready!

TypeWeaver is now:
- ✅ Installed
- ✅ Configured
- ✅ Generating types

Your frontend types will stay in sync with your backend schemas automatically! 🚀

---

**Need Help?**
- 📚 [Configuration Guide](./configuration.md)
- 💬 [GitHub Discussions](https://github.com/sri11223/type-bridge/discussions)
- 🐛 [Report Issues](https://github.com/sri11223/type-bridge/issues)
