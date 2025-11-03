# 🤝 Contributing to TypeWeaver

Thank you for your interest in contributing! This guide will help you get started.

---

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [Development Setup](#-development-setup)
- [Project Structure](#-project-structure)
- [Development Workflow](#-development-workflow)
- [Testing](#-testing)
- [Code Style](#-code-style)
- [Submitting Changes](#-submitting-changes)
- [Reporting Bugs](#-reporting-bugs)
- [Feature Requests](#-feature-requests)

---

## 📜 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of:
- Age, body size, disability
- Ethnicity, gender identity
- Experience level
- Nationality, personal appearance
- Race, religion, sexual identity

### Our Standards

**Positive behavior:**
- Being respectful and inclusive
- Gracefully accepting constructive criticism
- Focusing on what's best for the community
- Showing empathy towards others

**Unacceptable behavior:**
- Harassment, trolling, insulting comments
- Public or private harassment
- Publishing others' private information
- Other unprofessional conduct

### Enforcement

Report violations to: [GitHub Issues](https://github.com/sri11223/type-bridge/issues)

---

## 🚀 Getting Started

### Prerequisites

- **Node.js:** >= 16.0.0
- **npm:** >= 7.0.0
- **Git:** Latest version

### Knowledge Requirements

**Basic contributions:**
- JavaScript/Node.js fundamentals
- Git basics

**Advanced contributions:**
- TypeScript type system
- ORM concepts (Prisma/Mongoose)
- AST parsing
- File system operations

---

## 🛠️ Development Setup

### 1. Fork & Clone

```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR_USERNAME/type-bridge.git
cd type-bridge
```

### 2. Install Dependencies

```bash
npm install
```

**This installs:**
- Development dependencies
- Testing frameworks
- Linting tools

### 3. Verify Setup

```bash
# Run tests
npm test

# Run linter
npm run lint

# Generate coverage
npm run test:coverage
```

**Expected output:**
```
✓ All tests passing
✓ No lint errors
✓ Coverage > 80%
```

### 4. Create Branch

```bash
# Feature branch
git checkout -b feature/your-feature-name

# Bug fix branch
git checkout -b fix/bug-description
```

---

## 📁 Project Structure

```
type-bridge/
├── src/                    # Source code
│   ├── cli/               # Command-line interface
│   │   ├── index.js       # CLI commands
│   │   └── cli.test.js    # CLI tests
│   ├── config/            # Configuration management
│   │   ├── config-manager.js
│   │   └── config-manager.test.js
│   ├── core/              # Core logic
│   │   ├── generator.js   # Main generation logic
│   │   ├── normalizer.js  # Schema normalization
│   │   └── *.test.js      # Core tests
│   ├── parsers/           # ORM parsers
│   │   ├── prisma-parser.js
│   │   ├── mongoose-parser.js
│   │   └── *.test.js      # Parser tests
│   ├── generators/        # Type generators
│   │   ├── typescript-generator.js
│   │   └── typescript-generator.test.js
│   ├── watchers/          # File watchers
│   │   ├── file-watcher.js
│   │   └── file-watcher.test.js
│   ├── writers/           # File writers
│   │   ├── file-writer.js
│   │   └── file-writer.test.js
│   ├── errors/            # Error handling
│   │   ├── error-handler.js
│   │   └── error-handler.test.js
│   └── index.js           # Main entry point
├── bin/                   # CLI executable
│   └── type-bridge.js
├── examples/              # Example projects
│   └── prisma-example/
├── docs/                  # Documentation
├── coverage/              # Test coverage reports
├── jest.config.js         # Jest configuration
├── package.json           # Package metadata
├── .eslintrc.json         # ESLint config
├── .gitignore            # Git ignore
└── README.md             # Main documentation
```

### Key Files

**Entry Points:**
- `src/index.js` - Main API
- `bin/type-bridge.js` - CLI entry

**Core Logic:**
- `src/core/generator.js` - Orchestrates generation
- `src/core/normalizer.js` - Normalizes schemas

**Parsers:**
- `src/parsers/prisma-parser.js` - Parses Prisma schemas
- `src/parsers/mongoose-parser.js` - Parses Mongoose models

**Generators:**
- `src/generators/typescript-generator.js` - Generates TypeScript

---

## 🔄 Development Workflow

### 1. Make Changes

```bash
# Edit files
code src/parsers/prisma-parser.js
```

### 2. Test Changes

```bash
# Run all tests
npm test

# Run specific test file
npm test -- parsers/prisma-parser.test.js

# Run in watch mode
npm test -- --watch
```

### 3. Check Code Style

```bash
# Lint code
npm run lint

# Auto-fix issues
npm run lint:fix
```

### 4. Update Documentation

If your changes affect:
- **API** → Update `README.md`
- **Configuration** → Update `docs/configuration.md`
- **CLI** → Update `docs/cli-reference.md`
- **Behavior** → Update `CHANGELOG.md`

### 5. Commit Changes

```bash
# Stage files
git add .

# Commit with descriptive message
git commit -m "feat: add support for Prisma enums"
```

**Commit message format:**
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance

**Examples:**
```bash
feat(prisma): add enum array support
fix(mongoose): handle circular references
docs(readme): update installation guide
test(generator): add edge case tests
```

---

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Watch mode
npm test -- --watch

# Specific file
npm test -- parsers/prisma-parser.test.js

# Specific test
npm test -- -t "should parse string fields"
```

### Writing Tests

**Structure:**
```javascript
// src/parsers/prisma-parser.test.js
const { parsePrismaSchema } = require('./prisma-parser');

describe('PrismaParser', () => {
  describe('parsePrismaSchema', () => {
    it('should parse string fields', () => {
      const schema = `
        model User {
          name String
        }
      `;
      
      const result = parsePrismaSchema(schema);
      
      expect(result.models[0].fields[0]).toEqual({
        name: 'name',
        type: 'String',
        required: true
      });
    });

    it('should handle optional fields', () => {
      // Test implementation
    });

    it('should parse relations', () => {
      // Test implementation
    });
  });
});
```

**Best practices:**
- One test per behavior
- Descriptive test names
- Arrange-Act-Assert pattern
- Test edge cases
- Mock external dependencies

### Test Coverage

**Minimum requirements:**
- Overall: 80%
- New code: 90%
- Critical paths: 100%

**Check coverage:**
```bash
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

---

## 🎨 Code Style

### ESLint Rules

We use ESLint with standard rules:

```bash
# Check
npm run lint

# Auto-fix
npm run lint:fix
```

### Style Guide

**JavaScript:**
```javascript
// ✅ Good
function parseField(field) {
  if (!field.name) {
    throw new Error('Field name is required');
  }
  
  return {
    name: field.name,
    type: mapType(field.type),
    required: !field.optional
  };
}

// ❌ Bad
function parseField(field) {
  if(!field.name) throw new Error('Field name is required')
  return { name: field.name, type: mapType(field.type), required: !field.optional }
}
```

**Naming:**
- `camelCase` for variables and functions
- `PascalCase` for classes
- `UPPER_SNAKE_CASE` for constants
- Descriptive names (no abbreviations)

**Comments:**
```javascript
// ✅ Good - Explain WHY
// Use Record type for better type safety than 'any'
const mappedType = 'Record<string, unknown>';

// ❌ Bad - Explain WHAT (code already shows this)
// Set the mapped type
const mappedType = 'Record<string, unknown>';
```

**Functions:**
- Single responsibility
- Max 50 lines
- Clear inputs/outputs
- Handle errors

**Files:**
- One export per file (with related helpers)
- Test file next to source
- Max 500 lines

---

## 📤 Submitting Changes

### 1. Push Branch

```bash
git push origin feature/your-feature-name
```

### 2. Create Pull Request

1. Go to [GitHub Repository](https://github.com/sri11223/type-bridge)
2. Click "Pull Request"
3. Select your branch
4. Fill out template

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] Added new tests
- [ ] Coverage maintained/improved

## Checklist
- [ ] Code follows style guide
- [ ] Self-reviewed code
- [ ] Commented complex logic
- [ ] Updated documentation
- [ ] No breaking changes (or documented)
```

### 3. Review Process

**Automated checks:**
- ✅ All tests pass
- ✅ No lint errors
- ✅ Coverage maintained

**Manual review:**
- Code quality
- Design decisions
- Documentation
- Breaking changes

**Timeline:**
- Initial review: 2-3 days
- Follow-up: 1-2 days

### 4. Address Feedback

```bash
# Make requested changes
git add .
git commit -m "fix: address PR feedback"
git push
```

### 5. Merge

Once approved:
- PR will be merged by maintainer
- Your branch can be deleted
- Changes will be in next release

---

## 🐛 Reporting Bugs

### Before Reporting

**Check:**
1. [Existing issues](https://github.com/sri11223/type-bridge/issues)
2. [Troubleshooting guide](./troubleshooting.md)
3. Latest version (`npm outdated`)

### Bug Report Template

```markdown
## Bug Description
Clear description of the bug

## To Reproduce
Steps to reproduce:
1. Create config: `{ ... }`
2. Run command: `npx typeweaver generate`
3. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- TypeWeaver version: 1.0.0
- Node.js version: 18.0.0
- ORM: Prisma 5.0.0
- OS: macOS 13.0

## Schema Example
```prisma
model User {
  id String @id
}
```

## Configuration
```json
{
  "orm": "prisma",
  "input": "./prisma/schema.prisma"
}
```

## Error Output
```
❌ Error message here
```

## Additional Context
Any other relevant information
```

### Creating Issue

1. Go to [Issues](https://github.com/sri11223/type-bridge/issues/new)
2. Choose "Bug Report"
3. Fill template
4. Submit

---

## 💡 Feature Requests

### Before Requesting

**Consider:**
- Is it broadly useful?
- Does it fit project scope?
- Could it be a separate package?

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Use Case
Real-world scenario where this helps

## Proposed Solution
How you envision it working

## Alternatives Considered
Other approaches you've thought about

## Example Usage
```javascript
// How it would be used
typeweaver.generate({
  newOption: true
});
```

## Breaking Changes
Would this break existing functionality?

## Additional Context
Any other relevant information
```

### Creating Request

1. Go to [Issues](https://github.com/sri11223/type-bridge/issues/new)
2. Choose "Feature Request"
3. Fill template
4. Submit

---

## 🎯 Good First Issues

Looking to get started? Check issues labeled:
- `good first issue` - Easy for beginners
- `help wanted` - We'd love contributions
- `documentation` - Improve docs

[View Good First Issues](https://github.com/sri11223/type-bridge/labels/good%20first%20issue)

---

## 💬 Communication

### Channels

**GitHub Issues:**
- Bug reports
- Feature requests
- General questions

**GitHub Discussions:**
- Ideas and proposals
- Show and tell
- Q&A

**Pull Requests:**
- Code contributions
- Documentation improvements

### Response Times

- Issues: 2-3 days
- PRs: 2-3 days for initial review
- Discussions: 3-5 days

---

## 🏆 Recognition

Contributors are recognized in:
- GitHub contributors page
- Release notes (for significant contributions)
- README.md (for major features)

---

## 📝 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

## ❓ Questions?

- Check [Getting Started](./getting-started.md)
- Read [Troubleshooting](./troubleshooting.md)
- Ask in [Discussions](https://github.com/sri11223/type-bridge/discussions)
- Open an [Issue](https://github.com/sri11223/type-bridge/issues)

---

**Thank you for contributing! 🙏**

Your contributions help make TypeWeaver better for everyone.
