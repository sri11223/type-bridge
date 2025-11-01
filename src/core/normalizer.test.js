/**
 * Tests for Core Normalizer
 */

const {
  STANDARD_TYPES,
  normalizeField,
  normalizeModel,
  validateSchema
} = require('./normalizer');

describe('Core Normalizer', () => {
  describe('STANDARD_TYPES', () => {
    test('should have all standard types defined', () => {
      expect(STANDARD_TYPES.STRING).toBe('string');
      expect(STANDARD_TYPES.NUMBER).toBe('number');
      expect(STANDARD_TYPES.BOOLEAN).toBe('boolean');
      expect(STANDARD_TYPES.DATE).toBe('Date');
      expect(STANDARD_TYPES.ARRAY).toBe('array');
      expect(STANDARD_TYPES.OBJECT).toBe('object');
      expect(STANDARD_TYPES.ANY).toBe('any');
    });
  });

  describe('normalizeField', () => {
    test('should normalize a basic field', () => {
      const field = {
        name: 'email',
        type: 'string',
        required: true
      };

      const result = normalizeField(field);

      expect(result.name).toBe('email');
      expect(result.type).toBe('string');
      expect(result.required).toBe(true);
      expect(result.isPrimary).toBe(false);
      expect(result.isArray).toBe(false);
    });

    test('should default required to true', () => {
      const field = { name: 'email', type: 'string' };
      const result = normalizeField(field);
      expect(result.required).toBe(true);
    });

    test('should handle optional fields', () => {
      const field = { name: 'age', type: 'number', required: false };
      const result = normalizeField(field);
      expect(result.required).toBe(false);
    });

    test('should normalize array fields', () => {
      const field = {
        name: 'tags',
        type: 'array',
        isArray: true,
        arrayOf: 'string'
      };

      const result = normalizeField(field);

      expect(result.isArray).toBe(true);
      expect(result.arrayOf).toBe('string');
    });

    test('should normalize enum fields', () => {
      const field = {
        name: 'role',
        type: 'string',
        isEnum: true,
        enumValues: ['user', 'admin']
      };

      const result = normalizeField(field);

      expect(result.isEnum).toBe(true);
      expect(result.enumValues).toEqual(['user', 'admin']);
    });

    test('should normalize reference fields', () => {
      const field = {
        name: 'authorId',
        type: 'string',
        isReference: true,
        referenceTo: 'User'
      };

      const result = normalizeField(field);

      expect(result.isReference).toBe(true);
      expect(result.referenceTo).toBe('User');
    });

    test('should handle primary key fields', () => {
      const field = {
        name: 'id',
        type: 'string',
        isPrimary: true
      };

      const result = normalizeField(field);
      expect(result.isPrimary).toBe(true);
    });

    test('should handle default values', () => {
      const field = {
        name: 'status',
        type: 'string',
        defaultValue: 'active'
      };

      const result = normalizeField(field);
      expect(result.defaultValue).toBe('active');
    });

    test('should handle nested objects', () => {
      const field = {
        name: 'profile',
        type: 'object',
        nested: [
          { name: 'bio', type: 'string' }
        ]
      };

      const result = normalizeField(field);
      expect(result.nested).toBeDefined();
      expect(result.nested.length).toBe(1);
    });
  });

  describe('normalizeModel', () => {
    test('should normalize a basic model', () => {
      const model = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true }
        ],
        source: 'prisma'
      };

      const result = normalizeModel(model);

      expect(result.modelName).toBe('User');
      expect(result.fields.length).toBe(2);
      expect(result.source).toBe('prisma');
      expect(result.tableName).toBe('User');
    });

    test('should handle custom table name', () => {
      const model = {
        modelName: 'User',
        tableName: 'users',
        fields: []
      };

      const result = normalizeModel(model);
      expect(result.tableName).toBe('users');
    });

    test('should handle models with description', () => {
      const model = {
        modelName: 'User',
        description: 'User account model',
        fields: []
      };

      const result = normalizeModel(model);
      expect(result.description).toBe('User account model');
    });

    test('should normalize all fields in model', () => {
      const model = {
        modelName: 'Post',
        fields: [
          { name: 'title', type: 'string' },
          { name: 'views', type: 'number', required: false }
        ]
      };

      const result = normalizeModel(model);
      expect(result.fields[0].required).toBe(true);
      expect(result.fields[1].required).toBe(false);
    });

    test('should handle empty fields array', () => {
      const model = {
        modelName: 'Empty',
        fields: []
      };

      const result = normalizeModel(model);
      expect(result.fields).toEqual([]);
    });

    test('should include filePath if provided', () => {
      const model = {
        modelName: 'User',
        fields: [],
        filePath: '/path/to/model.js'
      };

      const result = normalizeModel(model);
      expect(result.filePath).toBe('/path/to/model.js');
    });
  });

  describe('validateSchema', () => {
    test('should validate a correct schema', () => {
      const schema = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'email', type: 'string' }
        ]
      };

      const result = validateSchema(schema);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should reject schema without model name', () => {
      const schema = {
        fields: [{ name: 'id', type: 'string' }]
      };

      const result = validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model must have a name');
    });

    test('should reject schema without fields array', () => {
      const schema = {
        modelName: 'User'
      };

      const result = validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Model must have fields array');
    });

    test('should reject field without name', () => {
      const schema = {
        modelName: 'User',
        fields: [
          { type: 'string' }
        ]
      };

      const result = validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject field without type', () => {
      const schema = {
        modelName: 'User',
        fields: [
          { name: 'email' }
        ]
      };

      const result = validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Field "email" must have a type');
    });

    test('should validate schema with multiple fields', () => {
      const schema = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'string' },
          { name: 'email', type: 'string' },
          { name: 'age', type: 'number' }
        ]
      };

      const result = validateSchema(schema);
      expect(result.valid).toBe(true);
    });

    test('should collect all validation errors', () => {
      const schema = {
        fields: [
          { type: 'string' },
          { name: 'email' }
        ]
      };

      const result = validateSchema(schema);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });
});
