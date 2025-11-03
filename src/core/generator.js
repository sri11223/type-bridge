/**
 * Core Generator
 * 
 * Main orchestrator that:
 * 1. Detects ORM
 * 2. Parses schemas
 * 3. Generates TypeScript
 * 4. Writes files
 */

const { detectPrisma, parsePrismaSchema, findPrismaSchema } = require('../parsers/prisma-parser');
const { detectMongoose, parseMongooseModels } = require('../parsers/mongoose-parser');
const { generateTypeScriptFile, generateInterface, generateIndexFile } = require('../generators/typescript-generator');
const { writeTypesByModel, writeSingleFile } = require('../writers/file-writer');
const { validateSchema } = require('./normalizer');
const path = require('path');

/**
 * Detect which ORM is being used
 * @param {string} projectRoot - Project root directory
 * @returns {Promise<string|null>} ORM name or null
 */
async function detectORM(projectRoot) {
  const detectors = [
    { name: 'prisma', detect: () => detectPrisma(projectRoot) },
    { name: 'mongoose', detect: () => detectMongoose(projectRoot) }
  ];

  for (const { name, detect } of detectors) {
    if (await detect()) {
      return name;
    }
  }

  return null;
}

/**
 * Parse schemas based on detected ORM
 * @param {string} orm - ORM name
 * @param {string} projectRoot - Project root directory
 * @param {Object} options - Parse options
 * @returns {Promise<Object>} Object with {models, enums}
 */
async function parseSchemas(orm, projectRoot, options = {}) {
  switch (orm) {
    case 'prisma': {
      const schemaPath = await findPrismaSchema(projectRoot);
      if (!schemaPath) {
        throw new Error('Prisma schema file not found');
      }
      // Prisma returns {models, enums}
      return await parsePrismaSchema(schemaPath);
    }

    case 'mongoose': {
      const modelsPath = options.modelsPath || path.join(projectRoot, 'models');
      const models = await parseMongooseModels(modelsPath, options);
      // Normalize Mongoose to same format: {models, enums}
      return { models, enums: [] };
    }

    default:
      throw new Error(`Unsupported ORM: ${orm}`);
  }
}

/**
 * Validate all schemas
 * @param {Object[]} models - Array of normalized models
 * @returns {Object} Validation results
 */
function validateModels(models) {
  const results = models.map(model => ({
    modelName: model.modelName,
    ...validateSchema(model)
  }));

  const invalid = results.filter(r => !r.valid);
  
  return {
    valid: invalid.length === 0,
    total: models.length,
    invalid: invalid.length,
    errors: invalid
  };
}

/**
 * Generate TypeScript for models
 * @param {Object[]} models - Array of normalized models
 * @param {Object} options - Generation options
 * @returns {Promise<Object[]>} Models with generated code
 */
async function generateTypesForModels(models, options = {}) {
  const generated = [];

  for (const model of models) {
    const code = await generateInterface(model, options);
    generated.push({
      ...model,
      generatedCode: code
    });
  }

  return generated;
}

/**
 * Main generate function - full pipeline
 * @param {Object} config - Configuration object
 * @returns {Promise<Object>} Generation results
 */
async function generateTypes(config) {
  const {
    projectRoot = process.cwd(),
    outputPath,
    outputMode = 'single', // 'single' or 'separate'
    ...options
  } = config;

  try {
    // Step 1: Detect ORM
    console.log('🔍 Detecting ORM...');
    const orm = await detectORM(projectRoot);
    
    if (!orm) {
      return {
        success: false,
        error: 'No supported ORM detected. Please install Prisma or Mongoose.'
      };
    }
    
    console.log(`✅ Detected: ${orm}`);

    // Step 2: Parse schemas
    console.log('📖 Parsing schemas...');
    let { models } = await parseSchemas(orm, projectRoot, options);
    const { enums } = await parseSchemas(orm, projectRoot, options);
    
    if (models.length === 0) {
      return {
        success: false,
        error: 'No models found'
      };
    }
    
    console.log(`✅ Found ${models.length} models` + (enums.length > 0 ? ` and ${enums.length} enums` : ''));

    // Step 3: Detect circular references and mark self-references
    const { detectCircularReferences, markSelfReferences } = require('./normalizer');
    const circularCheck = detectCircularReferences(models);
    
    if (circularCheck.hasCircular) {
      console.log(`⚠️  Circular references detected: ${circularCheck.circularPaths.join(', ')}`);
      console.log('   Using forward references to handle cycles safely.');
    }
    
    // Mark self-referencing fields
    models = markSelfReferences(models);

    // Step 4: Validate
    console.log('✔️  Validating schemas...');
    const validation = validateModels(models);
    
    if (!validation.valid) {
      return {
        success: false,
        error: 'Schema validation failed',
        validation
      };
    }

    // Step 5: Generate TypeScript
    console.log('⚙️  Generating TypeScript...');
    const generatedModels = await generateTypesForModels(models, { ...options, allModels: models });

    // Step 5: Write files
    console.log('💾 Writing files...');
    let writeResult;

    if (outputMode === 'separate') {
      // Write one file per model
      writeResult = await writeTypesByModel(generatedModels, outputPath, options);
      
      // Also write index file
      const indexContent = generateIndexFile(models.map(m => m.modelName));
      await writeSingleFile(indexContent, path.join(outputPath, 'index.ts'), options);
      
    } else {
      // Write single file with all types
      const allTypes = await generateTypeScriptFile(models, { ...options, enums });
      
      // Ensure we have an output path
      if (!outputPath) {
        return {
          success: false,
          error: 'outputPath is required'
        };
      }
      
      // Ensure outputPath ends with .ts
      let finalOutputPath = outputPath;
      if (!finalOutputPath.endsWith('.ts')) {
        finalOutputPath = path.join(finalOutputPath, 'index.ts');
      }
      
      writeResult = await writeSingleFile(allTypes, finalOutputPath, options);
    }

    if (!writeResult.success) {
      return {
        success: false,
        error: writeResult.error || 'Failed to write files',
        writeResult
      };
    }

    console.log('✅ Generation complete!');
    
    // Get generated content for verification
    const generatedContent = outputMode === 'separate' 
      ? null 
      : await generateTypeScriptFile(models, { ...options, enums });
    
    return {
      success: true,
      orm,
      modelsCount: models.length,
      outputPath,
      models: models.map(m => m.modelName),
      generatedContent
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Generate for specific models only
 * @param {Object} config - Configuration
 * @param {string[]} modelNames - Models to generate
 * @returns {Promise<Object>} Generation results
 */
async function generateSpecificModels(config, modelNames) {
  const result = await generateTypes(config);
  
  if (!result.success) return result;

  // Filter to requested models
  const filtered = result.models.filter(name => 
    modelNames.includes(name)
  );

  return {
    ...result,
    modelsCount: filtered.length,
    models: filtered
  };
}

module.exports = {
  generateTypes,
  generateSpecificModels,
  detectORM,
  parseSchemas,
  validateModels
};
