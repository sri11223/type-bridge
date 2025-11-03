/**
 * Prisma Schema Parser
 * 
 * Parses .prisma schema files and converts to normalized format.
 * 
 * Example Prisma schema:
 * model User {
 *   id        String   @id @default(cuid())
 *   email     String   @unique
 *   name      String?
 *   posts     Post[]
 *   createdAt DateTime @default(now())
 * }
 */

const fs = require('fs-extra');
const path = require('path');
const { normalizeModel, STANDARD_TYPES } = require('../core/normalizer');

/**
 * Map Prisma types to standard types
 */
const PRISMA_TYPE_MAP = {
  'String': STANDARD_TYPES.STRING,
  'Int': STANDARD_TYPES.NUMBER,
  'Float': STANDARD_TYPES.NUMBER,
  'Boolean': STANDARD_TYPES.BOOLEAN,
  'DateTime': STANDARD_TYPES.DATE,
  'Json': 'Record<string, unknown>',
  'Bytes': STANDARD_TYPES.STRING,
  'Decimal': STANDARD_TYPES.NUMBER,
  'BigInt': STANDARD_TYPES.NUMBER
};

/**
 * Parse a Prisma field line
 * @param {string} line - Single field line from schema
 * @returns {Object|null} Parsed field or null if not a field
 */
function parseField(line) {
  // Trim whitespace
  line = line.trim();
  
  // Skip empty lines and comments
  if (!line || line.startsWith('//') || line.startsWith('@@')) {
    return null;
  }

  // Match field pattern: name Type? @attributes
  const fieldMatch = line.match(/^(\w+)\s+([\w[\]]+)(\?)?(.*)$/);
  if (!fieldMatch) return null;

  const [, name, typeStr, optional, attributes] = fieldMatch;
  
  // Check if array type
  const isArray = typeStr.endsWith('[]');
  const baseType = isArray ? typeStr.slice(0, -2) : typeStr;
  
  // Map to standard type
  const mappedType = PRISMA_TYPE_MAP[baseType] || baseType;
  
  // Parse attributes
  const isPrimary = attributes.includes('@id');
  const isUnique = attributes.includes('@unique');
  
  // Extract default value if present
  let defaultValue = null;
  const defaultMatch = attributes.match(/@default\(([^)]+)\)/);
  if (defaultMatch) {
    defaultValue = defaultMatch[1];
  }

  // Check if it's a relation (field type is another model)
  const isReference = !PRISMA_TYPE_MAP[baseType] && !isArray;

  return {
    name,
    type: isArray ? STANDARD_TYPES.ARRAY : mappedType,
    required: !optional && !isPrimary, // Primary keys are auto-required
    isPrimary,
    isArray,
    arrayOf: isArray ? mappedType : null,
    isReference,
    referenceTo: isReference ? baseType : null,
    defaultValue,
    isUnique
  };
}

/**
 * Parse a Prisma model block
 * @param {string} modelBlock - Complete model block from schema
 * @param {string} filePath - Path to .prisma file
 * @returns {Object} Normalized model
 */
function parseModel(modelBlock, filePath) {
  const lines = modelBlock.split('\n');
  
  // Extract model name from first line
  const modelNameMatch = lines[0].match(/model\s+(\w+)/);
  if (!modelNameMatch) return null;
  
  const modelName = modelNameMatch[1];
  
  // Parse all fields
  const fields = lines
    .slice(1, -1) // Skip first line (model name) and last line (closing brace)
    .map(parseField)
    .filter(field => field !== null);

  return normalizeModel({
    modelName,
    fields,
    source: 'prisma',
    filePath
  });
}

/**
 * Parse a Prisma enum
 * @param {string} enumBlock - Enum block from schema
 * @returns {Object|null} Parsed enum or null
 */
function parseEnum(enumBlock) {
  try {
    // Extract enum name
    const nameMatch = enumBlock.match(/enum\s+(\w+)/);
    if (!nameMatch) return null;

    const name = nameMatch[1];

    // Extract enum values (lines that start with word characters)
    const values = [];
    const lines = enumBlock.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      // Match enum value (word at start of line, not 'enum' keyword)
      if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('enum') && !trimmed.includes('{') && !trimmed.includes('}')) {
        values.push(trimmed);
      }
    }

    return {
      name,
      values,
      type: 'enum'
    };
  } catch (error) {
    return null;
  }
}

/**
 * Parse entire Prisma schema file
 * @param {string} schemaPath - Path to schema.prisma file
 * @returns {Object} Object with models and enums arrays
 */
async function parsePrismaSchema(schemaPath) {
  try {
    // Read schema file
    const content = await fs.readFile(schemaPath, 'utf-8');
    
    // Extract all model blocks (Fixed regex to handle nested braces)
    const modelRegex = /model\s+(\w+)\s*\{[\s\S]*?\}/g;
    const modelBlocks = content.match(modelRegex) || [];
    
    // Extract all enum blocks
    const enumRegex = /enum\s+(\w+)\s*\{[\s\S]*?\}/g;
    const enumBlocks = content.match(enumRegex) || [];
    
    // Parse each model
    const models = modelBlocks
      .map(block => parseModel(block, schemaPath))
      .filter(model => model !== null);

    // Parse each enum
    const enums = enumBlocks
      .map(block => parseEnum(block))
      .filter(e => e !== null);

    return { models, enums };
  } catch (error) {
    throw new Error(`Failed to parse Prisma schema: ${error.message}`);
  }
}

/**
 * Find Prisma schema file in directory
 * @param {string} directory - Directory to search
 * @returns {string|null} Path to schema.prisma or null
 */
async function findPrismaSchema(directory) {
  const commonPaths = [
    path.join(directory, 'schema.prisma'),
    path.join(directory, 'prisma', 'schema.prisma'),
    path.join(directory, 'prisma', 'schema', 'schema.prisma')
  ];

  for (const schemaPath of commonPaths) {
    if (await fs.pathExists(schemaPath)) {
      return schemaPath;
    }
  }

  return null;
}

/**
 * Detect if project uses Prisma
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<boolean>} True if Prisma detected
 */
async function detectPrisma(projectRoot) {
  // Check for schema file
  const schemaPath = await findPrismaSchema(projectRoot);
  if (schemaPath) return true;

  // Check package.json for prisma dependency
  const packageJsonPath = path.join(projectRoot, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    const packageJson = await fs.readJson(packageJsonPath);
    const deps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    };
    return 'prisma' in deps || '@prisma/client' in deps;
  }

  return false;
}

module.exports = {
  parsePrismaSchema,
  findPrismaSchema,
  detectPrisma,
  parseField,
  parseModel,
  parseEnum
};
