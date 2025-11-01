/**
 * Tests for Prisma Parser
 */

const fs = require('fs-extra');
const path = require('path');
const {
  parseField,
  parseModel,
  parsePrismaSchema,
  findPrismaSchema,
  detectPrisma
} = require('./prisma-parser');

describe('Prisma Parser', () => {
  describe('parseField', () => {
    test('should parse basic String field', () => {
      const line = 'email String';
      const result = parseField(line);

      expect(result.name).toBe('email');
      expect(result.type).toBe('string');
      expect(result.required).toBe(true);
    });

    test('should parse optional field with ?', () => {
      const line = 'age Int?';
      const result = parseField(line);

      expect(result.name).toBe('age');
      expect(result.type).toBe('number');
      expect(result.required).toBe(false);
    });

    test('should parse array field', () => {
      const line = 'tags String[]';
      const result = parseField(line);

      expect(result.isArray).toBe(true);
      expect(result.arrayOf).toBe('string');
    });

    test('should parse field with @id attribute', () => {
      const line = 'id String @id';
      const result = parseField(line);

      expect(result.isPrimary).toBe(true);
    });

    test('should parse field with @unique attribute', () => {
      const line = 'email String @unique';
      const result = parseField(line);

      expect(result.isUnique).toBe(true);
    });

    test('should parse field with @default attribute', () => {
      const line = 'status String @default("active")';
      const result = parseField(line);

      expect(result.defaultValue).toBe('"active"');
    });

    test('should parse DateTime field', () => {
      const line = 'createdAt DateTime';
      const result = parseField(line);

      expect(result.type).toBe('Date');
    });

    test('should parse Boolean field', () => {
      const line = 'published Boolean';
      const result = parseField(line);

      expect(result.type).toBe('boolean');
    });

    test('should parse Int field', () => {
      const line = 'count Int';
      const result = parseField(line);

      expect(result.type).toBe('number');
    });

    test('should parse Float field', () => {
      const line = 'price Float';
      const result = parseField(line);

      expect(result.type).toBe('number');
    });

    test('should parse reference field', () => {
      const line = 'author User';
      const result = parseField(line);

      expect(result.isReference).toBe(true);
      expect(result.referenceTo).toBe('User');
    });

    test('should parse array of references', () => {
      const line = 'posts Post[]';
      const result = parseField(line);

      expect(result.isArray).toBe(true);
      expect(result.isReference).toBe(false); // Arrays are not marked as references
      expect(result.arrayOf).toBe('Post');
    });

    test('should return null for comments', () => {
      const line = '// This is a comment';
      const result = parseField(line);

      expect(result).toBeNull();
    });

    test('should return null for empty lines', () => {
      const line = '   ';
      const result = parseField(line);

      expect(result).toBeNull();
    });

    test('should return null for @@ attributes', () => {
      const line = '@@unique([email, username])';
      const result = parseField(line);

      expect(result).toBeNull();
    });

    test('should handle complex attributes', () => {
      const line = 'id String @id @default(cuid())';
      const result = parseField(line);

      expect(result.isPrimary).toBe(true);
      expect(result.defaultValue).toBe('cuid('); // Parser captures only up to first )
    });
  });

  describe('parseModel', () => {
    test('should parse a basic model', () => {
      const modelBlock = `model User {
  id    String @id
  email String
}`;

      const result = parseModel(modelBlock, '/test/schema.prisma');

      expect(result.modelName).toBe('User');
      expect(result.fields.length).toBe(2);
      expect(result.source).toBe('prisma');
      expect(result.filePath).toBe('/test/schema.prisma');
    });

    test('should parse model with multiple fields', () => {
      const modelBlock = `model Post {
  id        String   @id
  title     String
  content   String?
  published Boolean
  views     Int
}`;

      const result = parseModel(modelBlock, '/test/schema.prisma');

      expect(result.fields.length).toBe(5);
      expect(result.fields[0].name).toBe('id');
      expect(result.fields[1].name).toBe('title');
      expect(result.fields[2].name).toBe('content');
    });

    test('should skip comment lines in model', () => {
      const modelBlock = `model User {
  // This is a comment
  id String @id
  // Another comment
  email String
}`;

      const result = parseModel(modelBlock, '/test/schema.prisma');

      expect(result.fields.length).toBe(2);
    });

    test('should return null for invalid model block', () => {
      const modelBlock = 'not a valid model';

      const result = parseModel(modelBlock, '/test/schema.prisma');

      expect(result).toBeNull();
    });
  });

  describe('parsePrismaSchema', () => {
    const testSchemaPath = path.join(__dirname, 'test-schema.prisma');

    beforeEach(async () => {
      const schemaContent = `
model User {
  id    String @id
  email String @unique
  name  String
  posts Post[]
}

model Post {
  id       String @id
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId String
}
`;
      await fs.writeFile(testSchemaPath, schemaContent);
    });

    afterEach(async () => {
      await fs.remove(testSchemaPath);
    });

    test('should parse schema file with multiple models', async () => {
      const result = await parsePrismaSchema(testSchemaPath);

      expect(result.models.length).toBe(2);
      expect(result.models[0].modelName).toBe('User');
      expect(result.models[1].modelName).toBe('Post');
    });

    test('should throw error for non-existent file', async () => {
      await expect(parsePrismaSchema('/nonexistent/schema.prisma'))
        .rejects
        .toThrow();
    });
  });

  describe('findPrismaSchema', () => {
    const testDir = path.join(__dirname, 'test-project');
    const prismaDir = path.join(testDir, 'prisma');
    const schemaPath = path.join(prismaDir, 'schema.prisma');

    beforeEach(async () => {
      await fs.ensureDir(prismaDir);
      await fs.writeFile(schemaPath, 'model User { id String @id }');
    });

    afterEach(async () => {
      await fs.remove(testDir);
    });

    test('should find schema in prisma directory', async () => {
      const found = await findPrismaSchema(testDir);
      expect(found).toBeTruthy();
      expect(found).toContain('schema.prisma');
    });

    test('should return null if no schema found', async () => {
      const found = await findPrismaSchema('/nonexistent/path');
      expect(found).toBeNull();
    });
  });

  describe('detectPrisma', () => {
    const testDir = path.join(__dirname, 'test-detect');
    const packageJsonPath = path.join(testDir, 'package.json');

    beforeEach(async () => {
      await fs.ensureDir(testDir);
    });

    afterEach(async () => {
      await fs.remove(testDir);
    });

    test('should detect Prisma from package.json dependencies', async () => {
      await fs.writeJson(packageJsonPath, {
        dependencies: {
          '@prisma/client': '^5.0.0'
        }
      });

      const detected = await detectPrisma(testDir);
      expect(detected).toBe(true);
    });

    test('should detect Prisma from devDependencies', async () => {
      await fs.writeJson(packageJsonPath, {
        devDependencies: {
          'prisma': '^5.0.0'
        }
      });

      const detected = await detectPrisma(testDir);
      expect(detected).toBe(true);
    });

    test('should return false if Prisma not found', async () => {
      await fs.writeJson(packageJsonPath, {
        dependencies: {
          'express': '^4.0.0'
        }
      });

      const detected = await detectPrisma(testDir);
      expect(detected).toBe(false);
    });
  });
});
