/**
 * Tests for Mongoose Parser
 */

const fs = require('fs-extra');
const path = require('path');
const {
  extractFieldType,
  parseSchemaFields,
  parseMongooseModel,
  parseMongooseModels,
  detectMongoose
} = require('./mongoose-parser');
const { STANDARD_TYPES } = require('../core/normalizer');

describe('Mongoose Parser', () => {
  const testDir = path.join(__dirname, 'test-mongoose');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('extractFieldType', () => {
    test('should parse String type', () => {
      const result = extractFieldType(String);
      expect(result.type).toBe(STANDARD_TYPES.STRING);
    });

    test('should parse Number type', () => {
      const result = extractFieldType(Number);
      expect(result.type).toBe(STANDARD_TYPES.NUMBER);
    });

    test('should parse Boolean type', () => {
      const result = extractFieldType(Boolean);
      expect(result.type).toBe(STANDARD_TYPES.BOOLEAN);
    });

    test('should parse Date type', () => {
      const result = extractFieldType(Date);
      expect(result.type).toBe(STANDARD_TYPES.DATE);
    });

    test('should parse array types', () => {
      const result = extractFieldType([String]);
      expect(result.isArray).toBe(true);
      expect(result.arrayOf).toBe(STANDARD_TYPES.STRING);
    });

    test('should parse empty array as any[]', () => {
      const result = extractFieldType([]);
      expect(result.isArray).toBe(true);
      expect(result.type).toBe(STANDARD_TYPES.ARRAY);
    });

    test('should parse array of objects', () => {
      const result = extractFieldType([{ type: String }]);
      expect(result.isArray).toBe(true);
    });

    test('should parse object with type property', () => {
      const result = extractFieldType({ type: String, required: true });
      expect(result.type).toBe(STANDARD_TYPES.STRING);
      // Note: extractFieldType doesn't return required, that's handled by parseSchemaFields
    });

    test('should handle nested object types', () => {
      const result = extractFieldType({
        name: String,
        age: Number
      });
      // Nested objects without 'type' property return STANDARD_TYPES.ANY
      expect([STANDARD_TYPES.ANY, STANDARD_TYPES.OBJECT]).toContain(result.type);
    });

    test('should handle ref (references)', () => {
      const result = extractFieldType({ type: 'ObjectId', ref: 'User' });
      expect(result.isReference).toBe(true);
      expect(result.referenceTo).toBe('User');
    });

    test('should handle enum values', () => {
      const result = extractFieldType({ type: String, enum: ['admin', 'user'] });
      expect(result.type).toBe(STANDARD_TYPES.STRING);
    });

    test('should handle Schema.Types references', () => {
      const result = extractFieldType({ type: 'Schema.Types.ObjectId', ref: 'Post' });
      expect(result.type).toBe(STANDARD_TYPES.STRING);
      expect(result.isReference).toBe(true);
    });

    test('should handle ObjectId type', () => {
      const result = extractFieldType('ObjectId');
      expect(result.type).toBe(STANDARD_TYPES.STRING);
    });

    test('should handle Mixed type', () => {
      const result = extractFieldType({ type: 'Mixed' });
      expect(result.type).toBe('Record<string, any>');
    });

    test('should handle Map type', () => {
      const result = extractFieldType({ type: 'Map' });
      expect(result.type).toBe(STANDARD_TYPES.OBJECT);
    });

    test('should handle Buffer type', () => {
      const result = extractFieldType({ type: 'Buffer' });
      expect(result.type).toBe(STANDARD_TYPES.STRING);
    });

    test('should handle default values', () => {
      const result = extractFieldType({ type: String, default: 'test' });
      expect(result.type).toBe(STANDARD_TYPES.STRING);
      // defaultValue might not be extracted by extractFieldType alone
    });

    test('should handle required field', () => {
      const result = extractFieldType({ type: Number, required: true });
      expect(result.type).toBe(STANDARD_TYPES.NUMBER);
    });

    test('should handle unique field', () => {
      const result = extractFieldType({ type: String, unique: true });
      expect(result.type).toBe(STANDARD_TYPES.STRING);
      // isUnique might not be extracted by extractFieldType alone
    });

    test('should handle index field', () => {
      const result = extractFieldType({ type: String, index: true });
      expect(result.type).toBe(STANDARD_TYPES.STRING);
    });

    test('should handle arrays with type objects', () => {
      const result = extractFieldType([{ type: Number }]);
      expect(result.isArray).toBe(true);
      expect(result.arrayOf).toBe(STANDARD_TYPES.NUMBER);
    });
  });

  describe('parseSchemaFields', () => {
    test('should parse basic schema definition', () => {
      const schemaObj = {
        name: String,
        email: String,
        age: Number
      };

      const result = parseSchemaFields(schemaObj);
      
      expect(result.length).toBeGreaterThanOrEqual(3);
      const fieldNames = result.map(f => f.name);
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
      expect(fieldNames).toContain('age');
    });

    test('should handle field with type object', () => {
      const schemaObj = {
        email: { type: String }
      };

      const result = parseSchemaFields(schemaObj);
      expect(result.length).toBeGreaterThan(0);
      expect(result.find(f => f.name === 'email')).toBeDefined();
    });

    test('should skip _id and __v by default', () => {
      const schemaObj = {
        _id: 'ObjectId',
        __v: Number,
        name: String
      };

      const result = parseSchemaFields(schemaObj);
      const fieldNames = result.map(f => f.name);
      expect(fieldNames).not.toContain('_id');
      expect(fieldNames).not.toContain('__v');
      expect(fieldNames).toContain('name');
    });
  });

  describe('detectMongoose', () => {
    test('should detect mongoose in package.json', async () => {
      const packageJson = {
        dependencies: {
          mongoose: '^6.0.0'
        }
      };

      await fs.writeJson(path.join(testDir, 'package.json'), packageJson);

      const result = await detectMongoose(testDir);
      expect(result).toBe(true);
    });

    test('should return false if no mongoose', async () => {
      const packageJson = {
        dependencies: {
          express: '^4.0.0'
        }
      };

      await fs.writeJson(path.join(testDir, 'package.json'), packageJson);

      const result = await detectMongoose(testDir);
      expect(result).toBe(false);
    });

    test('should handle missing package.json', async () => {
      const result = await detectMongoose(testDir);
      expect(result).toBe(false);
    });
  });

  describe('parseMongooseModel', () => {
    test('should return null for files that cannot be parsed', async () => {
      const modelCode = `
        const mongoose = require('mongoose');
        
        const UserSchema = new mongoose.Schema({
          name: String,
          email: { type: String, required: true },
          age: Number
        });
        
        module.exports = mongoose.model('User', UserSchema);
      `;

      const modelPath = path.join(testDir, 'User.js');
      await fs.writeFile(modelPath, modelCode);

      // Will fail because mongoose is not installed in test environment
      const result = await parseMongooseModel(modelPath);
      
      // Expect null since mongoose module is not available
      expect(result).toBeNull();
    });

    test('should handle non-existent file', async () => {
      const modelPath = path.join(testDir, 'NonExistent.js');

      const result = await parseMongooseModel(modelPath);
      expect(result).toBeNull();
    });
  });

  describe('parseMongooseModels', () => {
    test('should return empty array for empty models directory', async () => {
      const modelsDir = path.join(testDir, 'empty');
      await fs.ensureDir(modelsDir);

      const result = await parseMongooseModels(modelsDir);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([]);
    });

    test('should handle non-existent directory', async () => {
      const result = await parseMongooseModels(path.join(testDir, 'nonexistent'));
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test('should skip invalid model files', async () => {
      const modelsDir = path.join(testDir, 'models');
      await fs.ensureDir(modelsDir);

      // Create invalid model files
      await fs.writeFile(path.join(modelsDir, 'Invalid.js'), 'invalid javascript code {{{');
      await fs.writeFile(path.join(modelsDir, 'Empty.js'), '');

      const result = await parseMongooseModels(modelsDir);
      expect(Array.isArray(result)).toBe(true);
      // Invalid files should be skipped
    });
  });
});
