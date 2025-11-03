/**
 * Tests for TypeScript Generator
 */

const {
  fieldToTypeScript,
  generateInterface,
  generateTypes,
  generateTypeScriptFile,
  generateIndexFile,
  formatCode
} = require('./typescript-generator');

describe('TypeScript Generator', () => {
  describe('fieldToTypeScript', () => {
    test('should convert string field', () => {
      const field = {
        name: 'email',
        type: 'string',
        required: true
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe('string');
    });

    test('should convert optional field', () => {
      const field = {
        name: 'age',
        type: 'number',
        required: false
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe('number | null');
    });

    test('should convert array field', () => {
      const field = {
        name: 'tags',
        type: 'array',
        isArray: true,
        arrayOf: 'string',
        required: true
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe('string[]');
    });

    test('should convert enum field', () => {
      const field = {
        name: 'role',
        type: 'string',
        isEnum: true,
        enumValues: ['user', 'admin'],
        required: true
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe("'user' | 'admin'");
    });

    test('should convert Date field', () => {
      const field = {
        name: 'createdAt',
        type: 'Date',
        required: true
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe('Date');
    });

    test('should convert boolean field', () => {
      const field = {
        name: 'active',
        type: 'boolean',
        required: true
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe('boolean');
    });

    test('should convert reference field to referenced type name', () => {
      const field = {
        name: 'authorId',
        type: 'string',
        isReference: true,
        referenceTo: 'User',
        required: true
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe('User');
    });

    test('should handle any type', () => {
      const field = {
        name: 'metadata',
        type: 'any',
        required: true
      };

      const result = fieldToTypeScript(field);
      expect(result).toBe('any');
    });
  });

  describe('generateInterface', () => {
    test('should generate basic interface', () => {
      const model = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'email', type: 'string', required: true }
        ],
        source: 'prisma'
      };

      const result = generateInterface(model);

      expect(result).toContain('export interface User');
      expect(result).toContain('id: string;');
      expect(result).toContain('email: string;');
    });

    test('should handle optional fields', () => {
      const model = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'string', required: true },
          { name: 'bio', type: 'string', required: false }
        ],
        source: 'prisma'
      };

      const result = generateInterface(model);

      expect(result).toContain('id: string;');
      expect(result).toContain('bio?: string | null;');
    });

    test('should include JSDoc comments', () => {
      const model = {
        modelName: 'User',
        fields: [],
        source: 'prisma',
        description: 'User account model'
      };

      const result = generateInterface(model, { includeComments: true });

      expect(result).toContain('/**');
      expect(result).toContain('User account model');
      expect(result).toContain('Auto-generated from prisma');
    });

    test('should exclude comments when disabled', () => {
      const model = {
        modelName: 'User',
        fields: [],
        source: 'prisma'
      };

      const result = generateInterface(model, { includeComments: false });

      expect(result).not.toContain('/**');
      expect(result).not.toContain('Auto-generated');
    });

    test('should generate readonly fields', () => {
      const model = {
        modelName: 'User',
        fields: [
          { name: 'id', type: 'string', required: true }
        ],
        source: 'prisma'
      };

      const result = generateInterface(model, { readonly: true });

      expect(result).toContain('readonly id: string;');
    });

    test('should handle array fields', () => {
      const model = {
        modelName: 'User',
        fields: [
          { name: 'tags', type: 'array', isArray: true, arrayOf: 'string', required: true }
        ],
        source: 'prisma'
      };

      const result = generateInterface(model);

      expect(result).toContain('tags: string[];');
    });

    test('should handle enum fields', () => {
      const model = {
        modelName: 'User',
        fields: [
          { name: 'role', type: 'string', isEnum: true, enumValues: ['user', 'admin'], required: true }
        ],
        source: 'prisma'
      };

      const result = generateInterface(model);

      expect(result).toContain("role: 'user' | 'admin';");
    });
  });

  describe('generateTypes', () => {
    test('should generate multiple interfaces', () => {
      const models = [
        {
          modelName: 'User',
          fields: [{ name: 'id', type: 'string', required: true }],
          source: 'prisma'
        },
        {
          modelName: 'Post',
          fields: [{ name: 'id', type: 'string', required: true }],
          source: 'prisma'
        }
      ];

      const result = generateTypes(models);

      expect(result).toContain('export interface User');
      expect(result).toContain('export interface Post');
    });

    test('should separate interfaces with blank lines', () => {
      const models = [
        {
          modelName: 'User',
          fields: [{ name: 'id', type: 'string', required: true }],
          source: 'prisma'
        },
        {
          modelName: 'Post',
          fields: [{ name: 'id', type: 'string', required: true }],
          source: 'prisma'
        }
      ];

      const result = generateTypes(models);

      expect(result).toContain('\n\n');
    });

    test('should handle empty models array', () => {
      const result = generateTypes([]);
      expect(result).toBe('');
    });
  });

  describe('generateTypeScriptFile', () => {
    test('should generate complete file with header', async () => {
      const models = [
        {
          modelName: 'User',
          fields: [{ name: 'id', type: 'string', required: true }],
          source: 'prisma'
        }
      ];

      const result = await generateTypeScriptFile(models);

      expect(result).toContain('AUTO-GENERATED by type-bridge');
      expect(result).toContain('Do not edit manually');
      expect(result).toContain('Generated:');
      expect(result).toContain('export interface User');
    });

    test('should exclude header when disabled', async () => {
      const models = [
        {
          modelName: 'User',
          fields: [{ name: 'id', type: 'string', required: true }],
          source: 'prisma'
        }
      ];

      const result = await generateTypeScriptFile(models, { includeHeader: false });

      expect(result).not.toContain('AUTO-GENERATED');
    });

    test('should include custom banner', async () => {
      const models = [
        {
          modelName: 'User',
          fields: [],
          source: 'prisma'
        }
      ];

      const result = await generateTypeScriptFile(models, {
        banner: 'Custom Banner Text'
      });

      expect(result).toContain('Custom Banner Text');
    });

    test('should format code with Prettier', async () => {
      const models = [
        {
          modelName: 'User',
          fields: [{ name: 'id', type: 'string', required: true }],
          source: 'prisma'
        }
      ];

      const result = await generateTypeScriptFile(models);

      // Check for consistent formatting
      expect(result).toMatch(/export interface User \{/);
    });
  });

  describe('generateIndexFile', () => {
    test('should generate export statements', () => {
      const modelNames = ['User', 'Post', 'Comment'];

      const result = generateIndexFile(modelNames);

      expect(result).toContain("export type { User } from './User';");
      expect(result).toContain("export type { Post } from './Post';");
      expect(result).toContain("export type { Comment } from './Comment';");
    });

    test('should include header comment', () => {
      const modelNames = ['User'];

      const result = generateIndexFile(modelNames);

      expect(result).toContain('AUTO-GENERATED by type-bridge');
      expect(result).toContain('Type exports');
    });

    test('should handle empty array', () => {
      const result = generateIndexFile([]);

      expect(result).toContain('AUTO-GENERATED');
      expect(result).not.toContain('export type');
    });

    test('should handle single model', () => {
      const result = generateIndexFile(['User']);

      expect(result).toContain("export type { User } from './User';");
    });
  });

  describe('formatCode', () => {
    test('should format TypeScript code', async () => {
      const code = 'export interface User{id:string;email:string;}';

      const result = await formatCode(code);

      expect(result).toContain('export interface User');
      expect(result).toMatch(/\{\s+id:/);
      expect(result).toMatch(/email:\s+string;/);
    });

    test('should handle malformed code gracefully', async () => {
      const code = 'export interface User { id: string';

      const result = await formatCode(code);

      // Should return original code if formatting fails
      expect(result).toBeDefined();
    });

    test('should preserve semicolons', async () => {
      const code = 'export interface User { id: string; }';

      const result = await formatCode(code);

      expect(result).toContain(';');
    });
  });
});
