/**
 * Mongoose Schema Parser
 * 
 * Parses Mongoose model definitions and converts to normalized format.
 * 
 * Example Mongoose model:
 * const userSchema = new Schema({
 *   name: { type: String, required: true },
 *   email: String,
 *   age: Number,
 *   posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }]
 * });
 */

const fs = require('fs-extra');
const path = require('path');
const { glob } = require('glob');
const { normalizeModel, STANDARD_TYPES } = require('../core/normalizer');

/**
 * Map Mongoose types to standard types
 */
const MONGOOSE_TYPE_MAP = {
  'String': STANDARD_TYPES.STRING,
  'Number': STANDARD_TYPES.NUMBER,
  'Boolean': STANDARD_TYPES.BOOLEAN,
  'Date': STANDARD_TYPES.DATE,
  'Buffer': STANDARD_TYPES.STRING,
  'ObjectId': STANDARD_TYPES.STRING,
  'Mixed': 'Record<string, any>',
  'Decimal128': STANDARD_TYPES.NUMBER,
  'Map': STANDARD_TYPES.OBJECT,
  'Schema.Types.String': STANDARD_TYPES.STRING,
  'Schema.Types.Number': STANDARD_TYPES.NUMBER,
  'Schema.Types.Boolean': STANDARD_TYPES.BOOLEAN,
  'Schema.Types.Date': STANDARD_TYPES.DATE,
  'Schema.Types.ObjectId': STANDARD_TYPES.STRING,
  'Schema.Types.Mixed': 'Record<string, any>',
  'Schema.Types.Decimal128': STANDARD_TYPES.NUMBER,
  'Schema.Types.Map': STANDARD_TYPES.OBJECT
};

/**
 * Extract type from Mongoose field definition
 * @param {any} fieldDef - Mongoose field definition
 * @returns {Object} Field type info
 */
function extractFieldType(fieldDef) {
  // Handle array syntax: [String] or [{ type: ObjectId, ref: 'Model' }]
  if (Array.isArray(fieldDef)) {
    if (fieldDef.length === 0) {
      return { type: STANDARD_TYPES.ARRAY, isArray: true, arrayOf: STANDARD_TYPES.ANY };
    }
    
    const innerType = extractFieldType(fieldDef[0]);
    return {
      type: STANDARD_TYPES.ARRAY,
      isArray: true,
      arrayOf: innerType.type,
      isReference: innerType.isReference,
      referenceTo: innerType.referenceTo
    };
  }

  // Handle object definition: { type: String, required: true }
  if (fieldDef && typeof fieldDef === 'object' && fieldDef.type) {
    const typeInfo = extractFieldType(fieldDef.type);
    
    // Check for ref (relationship)
    if (fieldDef.ref) {
      return {
        ...typeInfo,
        isReference: true,
        referenceTo: fieldDef.ref
      };
    }
    
    return typeInfo;
  }

  // Handle enum
  if (fieldDef && typeof fieldDef === 'object' && fieldDef.enum) {
    return {
      type: STANDARD_TYPES.STRING,
      isEnum: true,
      enumValues: fieldDef.enum
    };
  }

  // Handle direct type: String, Number, etc.
  if (typeof fieldDef === 'function') {
    const typeName = fieldDef.name;
    return {
      type: MONGOOSE_TYPE_MAP[typeName] || STANDARD_TYPES.ANY,
      isReference: false
    };
  }

  // Handle string type names
  if (typeof fieldDef === 'string') {
    return {
      type: MONGOOSE_TYPE_MAP[fieldDef] || STANDARD_TYPES.ANY,
      isReference: false
    };
  }

  return { type: STANDARD_TYPES.ANY, isReference: false };
}

/**
 * Parse Mongoose schema object
 * @param {Object} schemaObj - Mongoose schema.obj
 * @param {Object} schemaPaths - Mongoose schema.paths
 * @returns {Object[]} Array of normalized fields
 */
function parseSchemaFields(schemaObj, schemaPaths = {}) {
  const fields = [];

  for (const [fieldName, fieldDef] of Object.entries(schemaObj)) {
    // Skip internal fields
    if (fieldName.startsWith('_')) continue;

    const typeInfo = extractFieldType(fieldDef);
    const pathInfo = schemaPaths[fieldName];

    // Determine if required
    let required = false;
    if (fieldDef && typeof fieldDef === 'object') {
      required = fieldDef.required === true;
    }
    if (pathInfo && pathInfo.isRequired) {
      required = true;
    }

    // Extract default value
    let defaultValue = null;
    if (fieldDef && typeof fieldDef === 'object' && 'default' in fieldDef) {
      defaultValue = fieldDef.default;
    }

    // Check if unique
    const isUnique = fieldDef && typeof fieldDef === 'object' && fieldDef.unique === true;

    // Handle nested objects (embedded documents)
    let nested = null;
    if (fieldDef && typeof fieldDef === 'object' && !fieldDef.type && !fieldDef.enum && !Array.isArray(fieldDef)) {
      // This is a nested object definition
      nested = parseSchemaFields(fieldDef);
    }

    // Handle enum arrays specially
    const isEnumArray = typeInfo.isArray && typeInfo.isEnum;

    fields.push({
      name: fieldName,
      type: nested ? STANDARD_TYPES.OBJECT : typeInfo.type,
      required,
      isArray: typeInfo.isArray || false,
      arrayOf: typeInfo.arrayOf || null,
      isReference: typeInfo.isReference || false,
      referenceTo: typeInfo.referenceTo || null,
      isEnum: typeInfo.isEnum || false,
      isEnumArray: isEnumArray,
      enumValues: typeInfo.enumValues || null,
      defaultValue,
      isUnique,
      nested
    });
  }

  return fields;
}

/**
 * Extract schema from require'd module
 * @param {string} filePath - Path to model file
 * @returns {Object|null} Schema object or null
 */
function extractSchemaFromFile(filePath) {
  try {
    // Clear require cache to get fresh copy
    delete require.cache[require.resolve(filePath)];
    
    // Try to require the file
    const module = require(filePath);
    
    // Try different export patterns
    const possibleExports = [
      module,
      module.default,
      module.model,
      module.schema,
      ...Object.values(module)
    ];

    for (const exp of possibleExports) {
      if (!exp) continue;

      // Check if it's a Mongoose model
      if (exp.schema && exp.modelName) {
        return {
          modelName: exp.modelName,
          schema: exp.schema
        };
      }

      // Check if it's a schema directly
      if (exp.obj && exp.paths) {
        // Try to extract model name from file name
        const modelName = path.basename(filePath, path.extname(filePath));
        return {
          modelName: modelName.charAt(0).toUpperCase() + modelName.slice(1),
          schema: exp
        };
      }
    }

    return null;
  } catch (error) {
    console.warn(`Failed to parse ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Parse Mongoose model file
 * @param {string} filePath - Path to model file
 * @returns {Object|null} Normalized model or null
 */
function parseMongooseModel(filePath) {
  const extracted = extractSchemaFromFile(filePath);
  if (!extracted) return null;

  const { modelName, schema } = extracted;
  const fields = parseSchemaFields(schema.obj, schema.paths);

  return normalizeModel({
    modelName,
    fields,
    source: 'mongoose',
    filePath
  });
}

/**
 * Find all Mongoose model files in directory
 * @param {string} directory - Directory to search
 * @param {Object} options - Search options
 * @returns {Promise<string[]>} Array of file paths
 */
async function findMongooseModels(directory, options = {}) {
  const {
    pattern = '**/*.{js,ts}',
    exclude = ['**/node_modules/**', '**/*.test.{js,ts}', '**/*.spec.{js,ts}']
  } = options;

  try {
    const files = await glob(pattern, {
      cwd: directory,
      absolute: true,
      ignore: exclude
    });

    return files;
  } catch (error) {
    throw new Error(`Failed to find Mongoose models: ${error.message}`);
  }
}

/**
 * Parse all Mongoose models in directory
 * @param {string} directory - Directory containing models
 * @param {Object} options - Parse options
 * @returns {Promise<Object[]>} Array of normalized models
 */
async function parseMongooseModels(directory, options = {}) {
  const files = await findMongooseModels(directory, options);
  const models = [];

  for (const file of files) {
    const model = parseMongooseModel(file);
    if (model) {
      models.push(model);
    }
  }

  return models;
}

/**
 * Detect if project uses Mongoose
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<boolean>} True if Mongoose detected
 */
async function detectMongoose(projectRoot) {
  // Check package.json for mongoose dependency
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const packageJson = await fs.readJson(packageJsonPath);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };
      return 'mongoose' in deps;
    } catch {
      return false;
    }
  }

  return false;
}

module.exports = {
  parseMongooseModel,
  parseMongooseModels,
  findMongooseModels,
  detectMongoose,
  extractFieldType,
  parseSchemaFields
};
