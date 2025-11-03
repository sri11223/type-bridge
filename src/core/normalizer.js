/**
 * Schema Normalizer
 * 
 * All ORM parsers output this STANDARD format.
 * This is the secret to supporting multiple ORMs easily.
 * 
 * Example normalized schema:
 * {
 *   modelName: "User",
 *   fields: [
 *     { name: "id", type: "string", required: true, isPrimary: true },
 *     { name: "email", type: "string", required: true },
 *     { name: "age", type: "number", required: false }
 *   ]
 * }
 */

/**
 * Standard field types supported across all ORMs
 */
const STANDARD_TYPES = {
  STRING: 'string',
  NUMBER: 'number',
  BOOLEAN: 'boolean',
  DATE: 'Date',
  ARRAY: 'array',
  OBJECT: 'object',
  ANY: 'any',
  NULL: 'null',
  UNDEFINED: 'undefined'
};

/**
 * Normalize a field definition to standard format
 * @param {Object} field - Field definition from ORM parser
 * @returns {Object} Normalized field
 */
function normalizeField(field) {
  return {
    name: field.name,
    type: field.type || STANDARD_TYPES.ANY,
    required: field.required !== false, // Default to required
    isPrimary: field.isPrimary || false,
    isArray: field.isArray || false,
    arrayOf: field.arrayOf || null,
    isEnum: field.isEnum || false,
    enumValues: field.enumValues || null,
    isReference: field.isReference || false,
    referenceTo: field.referenceTo || null,
    defaultValue: field.defaultValue || null,
    description: field.description || null,
    nested: field.nested || null // For nested objects
  };
}

/**
 * Normalize a model/schema to standard format
 * @param {Object} model - Model definition from ORM parser
 * @returns {Object} Normalized model
 */
function normalizeModel(model) {
  return {
    modelName: model.modelName,
    tableName: model.tableName || model.modelName,
    fields: (model.fields || []).map(normalizeField),
    description: model.description || null,
    source: model.source || 'unknown', // 'prisma', 'mongoose', 'typeorm', 'sequelize'
    filePath: model.filePath || null
  };
}

/**
 * Validate normalized schema
 * @param {Object} schema - Normalized schema
 * @returns {Object} { valid: boolean, errors: string[] }
 */
function validateSchema(schema) {
  const errors = [];

  if (!schema.modelName) {
    errors.push('Model must have a name');
  }

  if (!Array.isArray(schema.fields)) {
    errors.push('Model must have fields array');
  }

  schema.fields?.forEach((field, index) => {
    if (!field.name) {
      errors.push(`Field at index ${index} must have a name`);
    }
    if (!field.type) {
      errors.push(`Field "${field.name}" must have a type`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Detect circular references in models
 * @param {Object[]} models - Array of normalized models
 * @returns {Object} { hasCircular: boolean, circularPaths: string[] }
 */
function detectCircularReferences(models) {
  const circularPaths = [];
  const modelMap = new Map(models.map(m => [m.modelName, m]));

  /**
   * Check if a field references create a cycle
   * @param {string} currentModel - Current model name
   * @param {string} targetModel - Target model being referenced
   * @param {string[]} path - Current path of models
   * @returns {boolean} True if circular reference detected
   */
  function hasCycle(currentModel, targetModel, path = []) {
    // Self-reference is allowed and handled separately
    if (currentModel === targetModel && path.length === 0) {
      return false;
    }

    // Check if we've seen this model in the path
    if (path.includes(targetModel)) {
      circularPaths.push([...path, targetModel].join(' -> '));
      return true;
    }

    // Get the target model
    const model = modelMap.get(targetModel);
    if (!model) return false;

    // Check all references in the target model
    const newPath = [...path, targetModel];
    for (const field of model.fields) {
      if (field.isReference && field.referenceTo) {
        if (hasCycle(targetModel, field.referenceTo, newPath)) {
          return true;
        }
      }
    }

    return false;
  }

  // Check all models for circular references
  for (const model of models) {
    for (const field of model.fields) {
      if (field.isReference && field.referenceTo) {
        hasCycle(model.modelName, field.referenceTo, [model.modelName]);
      }
    }
  }

  return {
    hasCircular: circularPaths.length > 0,
    circularPaths: [...new Set(circularPaths)] // Remove duplicates
  };
}

/**
 * Mark self-referencing fields in models
 * @param {Object[]} models - Array of normalized models
 * @returns {Object[]} Models with isSelfReference flag on fields
 */
function markSelfReferences(models) {
  return models.map(model => ({
    ...model,
    fields: model.fields.map(field => {
      if (field.isReference && field.referenceTo === model.modelName) {
        return { ...field, isSelfReference: true };
      }
      return field;
    })
  }));
}

module.exports = {
  STANDARD_TYPES,
  normalizeField,
  normalizeModel,
  validateSchema,
  detectCircularReferences,
  markSelfReferences
};
