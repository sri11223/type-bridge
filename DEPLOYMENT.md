# 🚀 TypeWeaver Deployment Guide

This guide walks through publishing TypeWeaver to npm.

---

## 📋 **Pre-Deployment Checklist**

### 1. **Code Quality**
- [ ] All tests passing: `npm test`
- [ ] No linting errors: `npm run lint`
- [ ] Code coverage acceptable: `npm run test:coverage`
- [ ] No console.log statements in production code

### 2. **Version & Documentation**
- [ ] Version updated in `package.json`
- [ ] `CHANGELOG.md` updated with changes
- [ ] `README.md` reflects current version
- [ ] All `@beta` tags removed (for production)

### 3. **Package Content**
- [ ] `package.json` "files" field includes all necessary files
- [ ] `.npmignore` properly configured
- [ ] Example files included in package
- [ ] License file present

### 4. **Testing**
- [ ] Test installation locally: `npm pack`
- [ ] Test in a fresh project
- [ ] Test all CLI commands work

---

## 🔐 **Step 1: Prepare for Publishing**

### Check NPM Login
```bash
npm whoami
# If not logged in:
npm login
```

### Verify Package Name is Available
```bash
npm search typeweaver
```

### Test Package Locally
```bash
# Create a tarball
npm pack

# This creates: typeweaver-1.0.0.tgz
# Install it in a test project:
cd /path/to/test-project
npm install /path/to/typeweaver-1.0.0.tgz
```

---

## 📦 **Step 2: Publish to NPM**

### Dry Run (Preview)
```bash
npm publish --dry-run
```

This shows what will be published without actually publishing.

### Publish Production Version
```bash
# For stable releases (v1.0.0, v1.1.0, etc.)
npm publish

# For beta releases (if needed)
npm publish --tag beta
```

### Verify Publication
```bash
npm view typeweaver

# Check specific version
npm view typeweaver@1.0.0
```

---

## ✅ **Step 3: Post-Publishing Verification**

### 1. **Test Installation**
```bash
# In a fresh directory
mkdir test-typeweaver
cd test-typeweaver
npm init -y
npm install -D typeweaver

# Verify installation
npx typeweaver --version
# Should output: 1.0.0
```

### 2. **Test Commands**
```bash
# Test init command
npx typeweaver init

# Test help
npx typeweaver --help
```

### 3. **Test with Real Project**

**For Prisma:**
```bash
cd /path/to/prisma-project
npm install -D typeweaver
npx typeweaver init
# Select: Prisma
# Set paths appropriately
npx typeweaver generate
```

**For Mongoose:**
```bash
cd /path/to/mongoose-project
npm install -D typeweaver
npx typeweaver init
# Select: Mongoose
# Set paths appropriately
npx typeweaver generate
```

### 4. **Check NPM Page**
Visit: https://www.npmjs.com/package/typeweaver

Verify:
- [ ] Version is correct
- [ ] README displays properly
- [ ] Install instructions are clear
- [ ] License is visible

---

## 🏷️ **Step 4: Tag Release on GitHub**

```bash
# Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0: Production Release"
git push origin v1.0.0

# Or create release on GitHub UI
```

### GitHub Release Notes Template

```markdown
## 🎉 TypeWeaver v1.0.0 - Production Release

TypeWeaver is now production-ready!

### 🌟 Highlights
- ✅ Circular reference detection
- ✅ Nested object support
- ✅ Better type mappings (Json, Mixed)
- ✅ New `verify` command for CI/CD
- ✅ All 284 tests passing

### 📦 Installation
```bash
npm install -D typeweaver
```

### 🚀 Quick Start
```bash
npx typeweaver init
npx typeweaver generate
```

### 📚 Full Changelog
See [CHANGELOG.md](./CHANGELOG.md) for detailed changes.

### 🙏 Thank You
Thank you to everyone who tested the beta!
```

---

## 📊 **Step 5: Monitor After Release**

### Track NPM Downloads
- https://npmtrends.com/typeweaver
- https://npm-stat.com/charts.html?package=typeweaver

### Monitor GitHub
- Watch for issues
- Respond to questions
- Review pull requests

### Update Documentation
- Fix any user-reported documentation issues
- Add FAQs based on common questions
- Create video tutorials (optional)

---

## 🔄 **Publishing Updates (v1.0.1, v1.1.0, etc.)**

### Patch Release (Bug Fixes) - v1.0.x
```bash
# 1. Fix bugs
# 2. Update CHANGELOG.md
# 3. Run tests
npm test

# 4. Bump patch version
npm version patch

# 5. Publish
npm publish

# 6. Push to git
git push && git push --tags
```

### Minor Release (New Features) - v1.x.0
```bash
# 1. Develop new features
# 2. Update CHANGELOG.md
# 3. Run tests
npm test

# 4. Bump minor version
npm version minor

# 5. Publish
npm publish

# 6. Push to git
git push && git push --tags
```

### Major Release (Breaking Changes) - v2.0.0
```bash
# 1. Make breaking changes
# 2. Update CHANGELOG.md with BREAKING CHANGES section
# 3. Update README with migration guide
# 4. Run tests
npm test

# 5. Bump major version
npm version major

# 6. Publish
npm publish

# 7. Push to git
git push && git push --tags
```

---

## 🚨 **Rollback / Unpublish**

### Deprecate a Version (Recommended)
```bash
npm deprecate typeweaver@1.0.0 "Please upgrade to 1.0.1 - fixes critical bug"
```

### Unpublish (Use with Caution!)
```bash
# Only allowed within 72 hours of publishing
npm unpublish typeweaver@1.0.0

# To unpublish entire package (DANGER!)
npm unpublish typeweaver --force
```

⚠️ **Warning**: Unpublishing can break projects that depend on your package. Always prefer deprecation.

---

## 📝 **npm Scripts for Deployment**

Add these to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "lint": "eslint src/**/*.js",
    "prepublishOnly": "npm test && npm run lint",
    "version": "npm run format && git add -A src",
    "postversion": "git push && git push --tags",
    "release:patch": "npm version patch && npm publish",
    "release:minor": "npm version minor && npm publish",
    "release:major": "npm version major && npm publish"
  }
}
```

Then you can simply run:
```bash
npm run release:patch   # For v1.0.1
npm run release:minor   # For v1.1.0
npm run release:major   # For v2.0.0
```

---

## 🎯 **NPM Publishing Best Practices**

### 1. **Always Test Before Publishing**
- Run full test suite
- Test in clean environment
- Test installation from tarball

### 2. **Version Appropriately**
- **Patch (1.0.x)**: Bug fixes, no new features
- **Minor (1.x.0)**: New features, backward compatible
- **Major (x.0.0)**: Breaking changes

### 3. **Keep CHANGELOG Updated**
- Document all changes
- Use clear, user-friendly language
- Include migration guides for breaking changes

### 4. **Communicate Changes**
- Announce on GitHub releases
- Post in relevant communities
- Update documentation

### 5. **Respond to Issues Quickly**
- Monitor npm, GitHub, and social media
- Fix critical bugs immediately
- Be helpful and professional

---

## 📚 **Resources**

- [npm Publishing Guide](https://docs.npmjs.com/cli/v9/commands/npm-publish)
- [Semantic Versioning](https://semver.org/)
- [Keep a Changelog](https://keepachangelog.com/)
- [npm Version Management](https://docs.npmjs.com/cli/v9/commands/npm-version)

---

## ✅ **Quick Publish Checklist**

For quick reference before each publish:

```bash
# 1. Tests
npm test

# 2. Version bump
npm version [patch|minor|major]

# 3. Review
cat CHANGELOG.md
cat package.json

# 4. Publish
npm publish

# 5. Verify
npm view typeweaver

# 6. Tag & Push
git push && git push --tags

# 7. Create GitHub Release
# (Do manually on GitHub)

# Done! 🎉
```

---

**Good luck with your release!** 🚀
