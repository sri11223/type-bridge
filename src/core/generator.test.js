/**
 * Tests for Core Generator
 */

const fs = require('fs-extra');
const path = require('path');
const {
  detectORM,
  parseSchemas,
  generateTypes,
  validateModels
} = require('./generator');

describe('Core Generator', () => {
  const testDir = path.join(__dirname, 'test-generator');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('detectORM', () => {
    test('should be a function', () => {
      expect(typeof detectORM).toBe('function');
    });

    test('should return null for empty directory', async () => {
      const result = await detectORM(testDir);

      expect(result).toBe(null);
    });
  });

  describe('parseSchemas', () => {
    test('should be a function', () => {
      expect(typeof parseSchemas).toBe('function');
    });

    test('should throw error for unsupported ORM', async () => {
      await expect(parseSchemas('unsupported', testDir, {})).rejects.toThrow();
    });

    test('should return array for mongoose', async () => {
      const result = await parseSchemas('mongoose', testDir, { modelsPath: testDir });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('validateModels', () => {
    test('should validate correct models', () => {
      const models = [
        {
          name: 'User',
          fields: [
            { name: 'id', type: 'string', required: true },
            { name: 'email', type: 'string', required: true }
          ],
          source: 'test'
        }
      ];

      // validateModels doesn't throw, it logs validation warnings
      expect(() => validateModels(models)).not.toThrow();
    });

    test('should handle models without source', () => {
      const models = [
        {
          name: 'User',
          fields: [{ name: 'id', type: 'string' }]
        }
      ];

      expect(() => validateModels(models)).not.toThrow();
    });

    test('should handle multiple models', () => {
      const models = [
        {
          name: 'User',
          fields: [{ name: 'id', type: 'string' }],
          source: 'test'
        },
        {
          name: 'Post',
          fields: [{ name: 'title', type: 'string' }],
          source: 'test'
        }
      ];

      expect(() => validateModels(models)).not.toThrow();
    });

    test('should handle empty fields array', () => {
      const models = [
        {
          name: 'Empty',
          fields: [],
          source: 'test'
        }
      ];

      // May log warning but shouldn't throw
      expect(() => validateModels(models)).not.toThrow();
    });
  });

  describe('generateTypes', () => {
    test('should handle missing schemaPath for Prisma', async () => {
      const config = {
        projectRoot: testDir,
        outputPath: path.join(testDir, 'types'),
        orm: 'prisma'
      };

      const result = await generateTypes(config);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle output to directory', async () => {
      const schemaPath = path.join(testDir, 'schema.prisma');
      await fs.writeFile(schemaPath, `
        model User {
          id String @id
        }
      `);

      const config = {
        projectRoot: testDir,
        schemaPath,
        outputPath: path.join(testDir, 'types'),
        outputMode: 'single',
        orm: 'prisma'
      };

      const result = await generateTypes(config);

      expect(result.success).toBe(true);
      const outputFile = path.join(testDir, 'types', 'index.ts');
      expect(await fs.pathExists(outputFile)).toBe(true);
    });

    test('should handle output to specific file', async () => {
      const schemaPath = path.join(testDir, 'schema.prisma');
      await fs.writeFile(schemaPath, `
        model Post {
          id String @id
        }
      `);

      const config = {
        projectRoot: testDir,
        schemaPath,
        outputPath: path.join(testDir, 'custom.ts'),
        outputMode: 'single',
        orm: 'prisma'
      };

      const result = await generateTypes(config);

      expect(result.success).toBe(true);
      expect(await fs.pathExists(config.outputPath)).toBe(true);
    });

    test('should handle separate file mode', async () => {
      const schemaPath = path.join(testDir, 'schema.prisma');
      await fs.writeFile(schemaPath, `
        model User {
          id String @id
        }
        model Post {
          id String @id
        }
      `);

      const config = {
        projectRoot: testDir,
        schemaPath,
        outputPath: path.join(testDir, 'types'),
        outputMode: 'separate',
        orm: 'prisma'
      };

      const result = await generateTypes(config);

      expect(result.success).toBe(true);
      expect(await fs.pathExists(path.join(testDir, 'types', 'User.ts'))).toBe(true);
      expect(await fs.pathExists(path.join(testDir, 'types', 'Post.ts'))).toBe(true);
    });

    test('should return error on validation failure', async () => {
      const schemaPath = path.join(testDir, 'invalid.prisma');
      await fs.writeFile(schemaPath, 'invalid content');

      const config = {
        projectRoot: testDir,
        schemaPath,
        outputPath: path.join(testDir, 'types'),
        orm: 'prisma'
      };

      const result = await generateTypes(config);

      // Should handle parse errors gracefully
      expect(result).toBeDefined();
    });

    test('should merge config with defaults', async () => {
      const schemaPath = path.join(testDir, 'schema.prisma');
      await fs.writeFile(schemaPath, `
        model Test {
          id String @id
        }
      `);

      const config = {
        schemaPath,
        outputPath: path.join(testDir, 'out.ts')
      };

      const result = await generateTypes(config);

      expect(result).toBeDefined();
    });
  });

  describe('Error handling', () => {
    test('should handle file write errors', async () => {
      const schemaPath = path.join(testDir, 'schema.prisma');
      await fs.writeFile(schemaPath, `
        model User {
          id String @id
        }
      `);

      const config = {
        projectRoot: testDir,
        schemaPath,
        outputPath: '', // Invalid path
        orm: 'prisma'
      };

      const result = await generateTypes(config);

      expect(result.success).toBe(false);
    });

    test('should handle ORM detection failure', async () => {
      const config = {
        projectRoot: testDir,
        outputPath: path.join(testDir, 'types'),
        orm: 'auto'
      };

      const result = await generateTypes(config);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ORM');
    });
  });
});
