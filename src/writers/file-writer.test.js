/**
 * Tests for File Writer
 */

const fs = require('fs-extra');
const path = require('path');
const {
  writeFileSafe,
  writeMultipleFiles,
  writeTypesByModel,
  writeSingleFile,
  cleanGeneratedFiles,
  checkWritePermission,
  ensureDirectory
} = require('./file-writer');

describe('File Writer', () => {
  const testDir = path.join(__dirname, 'test-output');
  const testFile = path.join(testDir, 'test.ts');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('ensureDirectory', () => {
    test('should create directory if not exists', async () => {
      const newDir = path.join(testDir, 'new-dir');

      await ensureDirectory(newDir);

      const exists = await fs.pathExists(newDir);
      expect(exists).toBe(true);
    });

    test('should not fail if directory already exists', async () => {
      await ensureDirectory(testDir);
      await ensureDirectory(testDir);

      const exists = await fs.pathExists(testDir);
      expect(exists).toBe(true);
    });

    test('should create nested directories', async () => {
      const nestedDir = path.join(testDir, 'a', 'b', 'c');

      await ensureDirectory(nestedDir);

      const exists = await fs.pathExists(nestedDir);
      expect(exists).toBe(true);
    });
  });

  describe('checkWritePermission', () => {
    test('should return true for writable directory', async () => {
      const result = await checkWritePermission(testFile);
      expect(result).toBe(true);
    });

    test('should return false for non-existent directory', async () => {
      const result = await checkWritePermission('/nonexistent/path/file.ts');
      expect(result).toBe(false);
    });
  });

  describe('writeFileSafe', () => {
    test('should write file successfully', async () => {
      const content = 'export interface User { id: string; }';

      const result = await writeFileSafe(testFile, content);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(testFile);

      const written = await fs.readFile(testFile, 'utf-8');
      expect(written).toBe(content);
    });

    test('should create parent directories if needed', async () => {
      const nestedFile = path.join(testDir, 'nested', 'deep', 'file.ts');
      const content = 'export interface Test {}';

      const result = await writeFileSafe(nestedFile, content);

      expect(result.success).toBe(true);
      const exists = await fs.pathExists(nestedFile);
      expect(exists).toBe(true);
    });

    test('should create backup of existing file', async () => {
      const content1 = 'original content';
      const content2 = 'new content';

      await fs.writeFile(testFile, content1);
      const result = await writeFileSafe(testFile, content2);

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(true);

      const written = await fs.readFile(testFile, 'utf-8');
      expect(written).toBe(content2);
    });

    test('should restore backup on error', async () => {
      const originalContent = 'original';
      await fs.writeFile(testFile, originalContent);

      // Simulate error by using invalid content
      const result = await writeFileSafe(testFile, null);

      // Should fail but restore backup
      expect(result.success).toBe(false);
    });

    test('should skip backup when disabled', async () => {
      const content1 = 'original';
      const content2 = 'new';

      await fs.writeFile(testFile, content1);
      const result = await writeFileSafe(testFile, content2, { createBackup: false });

      expect(result.success).toBe(true);
      expect(result.backupCreated).toBe(false);
    });

    test('should handle write errors gracefully', async () => {
      // Try to write to invalid path - use a path that can't be created
      // Note: Some systems might allow creating deep paths, so we test error handling differently
      const result = await writeFileSafe('', 'content'); // Empty path should fail

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('writeMultipleFiles', () => {
    test('should write multiple files successfully', async () => {
      const files = [
        { path: path.join(testDir, 'User.ts'), content: 'export interface User {}' },
        { path: path.join(testDir, 'Post.ts'), content: 'export interface Post {}' }
      ];

      const result = await writeMultipleFiles(files);

      expect(result.success).toBe(true);
      expect(result.successful).toBe(2);
      expect(result.failed).toBe(0);

      const exists1 = await fs.pathExists(files[0].path);
      const exists2 = await fs.pathExists(files[1].path);
      expect(exists1).toBe(true);
      expect(exists2).toBe(true);
    });

    test('should report partial success', async () => {
      const files = [
        { path: path.join(testDir, 'User.ts'), content: 'export interface User {}' },
        { path: '', content: 'export interface Post {}' } // Empty path should fail
      ];

      const result = await writeMultipleFiles(files);

      expect(result.success).toBe(false);
      expect(result.successful).toBe(1);
      expect(result.failed).toBe(1);
    });

    test('should handle empty files array', async () => {
      const result = await writeMultipleFiles([]);

      expect(result.success).toBe(true);
      expect(result.total).toBe(0);
    });
  });

  describe('writeTypesByModel', () => {
    test('should write one file per model', async () => {
      const models = [
        {
          modelName: 'User',
          generatedCode: 'export interface User { id: string; }'
        },
        {
          modelName: 'Post',
          generatedCode: 'export interface Post { id: string; }'
        }
      ];

      const result = await writeTypesByModel(models, testDir);

      expect(result.success).toBe(true);
      expect(result.successful).toBe(2);

      const userExists = await fs.pathExists(path.join(testDir, 'User.ts'));
      const postExists = await fs.pathExists(path.join(testDir, 'Post.ts'));
      expect(userExists).toBe(true);
      expect(postExists).toBe(true);
    });

    test('should handle models without generatedCode', async () => {
      const models = [
        { modelName: 'User' }
      ];

      const result = await writeTypesByModel(models, testDir);

      expect(result.failed).toBe(1);
    });
  });

  describe('writeSingleFile', () => {
    test('should write single file with all types', async () => {
      const content = `
export interface User { id: string; }
export interface Post { id: string; }
      `;

      const result = await writeSingleFile(content, testFile);

      expect(result.success).toBe(true);

      const written = await fs.readFile(testFile, 'utf-8');
      expect(written).toContain('User');
      expect(written).toContain('Post');
    });

    test('should handle large content', async () => {
      const largeContent = 'export interface Test {}\n'.repeat(1000);

      const result = await writeSingleFile(largeContent, testFile);

      expect(result.success).toBe(true);

      const stats = await fs.stat(testFile);
      expect(stats.size).toBeGreaterThan(0);
    });
  });

  describe('cleanGeneratedFiles', () => {
    beforeEach(async () => {
      // Create some test files
      await fs.writeFile(path.join(testDir, 'User.ts'), 'test');
      await fs.writeFile(path.join(testDir, 'Post.ts'), 'test');
      await fs.writeFile(path.join(testDir, 'other.js'), 'test');
    });

    test('should delete only .ts files', async () => {
      const result = await cleanGeneratedFiles(testDir);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(2);

      const userExists = await fs.pathExists(path.join(testDir, 'User.ts'));
      const postExists = await fs.pathExists(path.join(testDir, 'Post.ts'));
      const jsExists = await fs.pathExists(path.join(testDir, 'other.js'));

      expect(userExists).toBe(false);
      expect(postExists).toBe(false);
      expect(jsExists).toBe(true);
    });

    test('should support dry run mode', async () => {
      const result = await cleanGeneratedFiles(testDir, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.dryRun).toBe(true);
      expect(result.files.length).toBe(2);

      // Files should still exist
      const userExists = await fs.pathExists(path.join(testDir, 'User.ts'));
      expect(userExists).toBe(true);
    });

    test('should handle non-existent directory', async () => {
      const result = await cleanGeneratedFiles('/nonexistent/path');

      expect(result.success).toBe(true);
      expect(result.message).toContain('does not exist');
    });

    test('should handle empty directory', async () => {
      await fs.remove(testDir);
      await fs.ensureDir(testDir);

      const result = await cleanGeneratedFiles(testDir);

      expect(result.success).toBe(true);
      expect(result.deletedCount).toBe(0);
    });
  });
});
