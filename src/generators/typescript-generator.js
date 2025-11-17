/**
 * TypeScript Type Generator
 *
 * Converts normalized schemas to TypeScript interface definitions.
 * Works with ALL ORMs because it uses normalized format.
 */

const { STANDARD_TYPES } = require("../core/normalizer");

/**
 * Convert standard type to TypeScript type
 * @param {Object} field - Normalized field
 * @param {Object[]} allModels - All models for enum reference lookup
 * @returns {string} TypeScript type string
 */
function fieldToTypeScript(field, allModels = []) {
  let tsType;

  // Handle enums
  if (field.isEnum && field.enumValues) {
    tsType = field.enumValues.map((v) => `'${v}'`).join(" | ");
  }
  // Handle arrays
  else if (field.isArray && field.arrayOf) {
    // Check if arrayOf is an enum type
    if (field.isEnumArray && field.enumValues) {
      // Generate union type array: ('USER' | 'ADMIN')[]
      const enumUnion = field.enumValues.map((v) => `'${v}'`).join(" | ");
      tsType = `(${enumUnion})[]`;
    } else {
      tsType = `${field.arrayOf}[]`;
    }
  }
  // Handle references (foreign keys)
  else if (field.isReference && field.referenceTo) {
    // Use the referenced model type name
    tsType = field.referenceTo;
  }
  // Handle nested objects
  else if (field.type === STANDARD_TYPES.OBJECT && field.nested) {
    tsType = generateInlineInterface(field.nested, allModels);
  }
  // Standard types
  else {
    tsType = field.type;
  }

  // Add optional marker if not required
  return field.required ? tsType : `${tsType} | null`;
}

/**
 * Generate inline interface for nested objects
 * @param {Object[]} fields - Array of nested fields
 * @param {Object[]} allModels - All models for enum reference lookup
 * @returns {string} Inline interface string
 */
function generateInlineInterface(fields, allModels = []) {
  const fieldStrings = fields.map((field) => {
    const optional = field.required ? "" : "?";
    return `  ${field.name}${optional}: ${fieldToTypeScript(
      field,
      allModels
    )};`;
  });

  return `{\n${fieldStrings.join("\n")}\n}`;
}

/**
 * Generate TypeScript enum
 * @param {Object} enumDef - Enum definition {name, values, type}
 * @param {Object} options - Generation options
 * @returns {string} TypeScript enum code
 */
function generateEnum(enumDef, options = {}) {
  const { exportType = "export", includeComments = true } = options;

  const lines = [];

  // Add auto-generated comment
  if (includeComments) {
    lines.push(`/** Auto-generated enum */`);
  }

  // Enum declaration
  lines.push(`${exportType} enum ${enumDef.name} {`);

  // Generate enum values
  enumDef.values.forEach((value, index) => {
    const comma = index < enumDef.values.length - 1 ? "," : "";
    lines.push(`  ${value} = '${value}'${comma}`);
  });

  lines.push(`}`);

  return lines.join("\n");
}

/**
 * Collect all type dependencies for a model (for import generation)
 * @param {Object} model - Normalized model
 * @param {Object[]} allEnums - Array of all enum definitions
 * @returns {Object} Object with enums and models arrays
 */
function collectTypeDependencies(model, allEnums = []) {
  const dependencies = {
    enums: new Set(),
    models: new Set(),
  };

  // Create a set of enum names for quick lookup
  const enumNames = new Set(allEnums.map((e) => e.name));

  // Primitive types that don't need imports
  const primitives = new Set([
    "string",
    "number",
    "boolean",
    "Date",
    "any",
    "unknown",
    "void",
    "null",
    "undefined",
    "array",
    "object",
  ]);

  model.fields.forEach((field) => {
    // For arrays, check arrayOf instead of type
    if (field.isArray && field.arrayOf) {
      if (!primitives.has(field.arrayOf) && field.arrayOf !== model.modelName) {
        if (enumNames.has(field.arrayOf)) {
          dependencies.enums.add(field.arrayOf);
        } else {
          dependencies.models.add(field.arrayOf);
        }
      }
    }
    // For non-arrays, check type
    else if (
      field.type &&
      !primitives.has(field.type) &&
      field.type !== model.modelName
    ) {
      if (enumNames.has(field.type)) {
        dependencies.enums.add(field.type);
      } else {
        dependencies.models.add(field.type);
      }
    }

    // Check referenceTo (for relations) - but only if it's different from type
    // to avoid duplicates
    if (
      field.referenceTo &&
      field.referenceTo !== field.type &&
      field.referenceTo !== model.modelName
    ) {
      if (enumNames.has(field.referenceTo)) {
        dependencies.enums.add(field.referenceTo);
      } else {
        dependencies.models.add(field.referenceTo);
      }
    }
  });

  return {
    enums: Array.from(dependencies.enums),
    models: Array.from(dependencies.models),
  };
}

/**
 * Generate TypeScript interface for a model
 * @param {Object} model - Normalized model
 * @param {Object} options - Generation options
 * @returns {string} TypeScript interface code
 */
function generateInterface(model, options = {}) {
  const {
    exportType = "export",
    includeComments = true,
    readonly = false,
    standalone = false, // If true, include imports for separate file mode
  } = options;

  const lines = [];

  // Add imports if standalone mode (separate files)
  if (standalone) {
    const deps = collectTypeDependencies(model, options.allEnums || []);

    // Import enums if needed
    if (deps.enums.length > 0) {
      lines.push(`import { ${deps.enums.join(", ")} } from './enums';`);
    }

    // Import other models if needed
    if (deps.models.length > 0) {
      deps.models.forEach((modelName) => {
        lines.push(`import type { ${modelName} } from './${modelName}';`);
      });
    }

    // Add blank line after imports
    if (deps.enums.length > 0 || deps.models.length > 0) {
      lines.push("");
    }
  }

  // Add model description if available
  if (includeComments && model.description) {
    lines.push(`/**`);
    lines.push(` * ${model.description}`);
    lines.push(` */`);
  }

  // Add auto-generated comment
  if (includeComments) {
    lines.push(`/** Auto-generated from ${model.source} schema */`);
  }

  // Interface declaration
  lines.push(`${exportType} interface ${model.modelName} {`);

  // Generate fields
  model.fields.forEach((field) => {
    const optional = field.required ? "" : "?";
    const readonlyPrefix = readonly ? "readonly " : "";
    const tsType = fieldToTypeScript(field, options.allModels);

    // Add field comment if description exists
    if (includeComments && field.description) {
      lines.push(`  /** ${field.description} */`);
    }

    lines.push(`  ${readonlyPrefix}${field.name}${optional}: ${tsType};`);
  });

  lines.push(`}`);

  return lines.join("\n");
}

/**
 * Generate TypeScript for multiple models
 * @param {Object[]} models - Array of normalized models
 * @param {Object} options - Generation options
 * @returns {string} TypeScript code for all models
 */
function generateTypes(models, options = {}) {
  const interfaces = models.map((model) => generateInterface(model, options));
  return interfaces.join("\n\n");
}

/**
 * Format TypeScript code with Prettier
 * @param {string} code - TypeScript code
 * @returns {Promise<string>} Formatted code
 */
async function formatCode(code) {
  try {
    // When running under Jest or if formatting is explicitly disabled,
    // skip loading Prettier to avoid opening TTY/stdin handles that keep
    // the test runner from exiting. Tests don't need formatted output.
    if (
      process.env.JEST_WORKER_ID ||
      process.env.TYPEBRIDGE_SKIP_FORMAT === "1"
    ) {
      return code;
    }

    // Require Prettier lazily to avoid opening stdin/TTY handles
    // when this module is loaded by code paths that don't need formatting.
    const prettier = require("prettier");

    return await prettier.format(code, {
      parser: "typescript",
      semi: true,
      singleQuote: true,
      trailingComma: "es5",
      printWidth: 80,
      tabWidth: 2,
    });
  } catch (error) {
    console.warn(
      "Failed to format code with Prettier, returning unformatted:",
      error.message
    );
    return code;
  }
}

/**
 * Generate complete TypeScript file
 * @param {Object[]} models - Array of normalized models
 * @param {Object} options - Generation options
 * @returns {Promise<string>} Complete TypeScript file content
 */
async function generateTypeScriptFile(models, options = {}) {
  const { includeHeader = true, banner = null, enums = [] } = options;

  const parts = [];

  // Add header comment
  if (includeHeader) {
    parts.push(`/**`);
    parts.push(` * AUTO-GENERATED by type-bridge`);
    parts.push(` * Do not edit manually`);
    parts.push(` * Generated: ${new Date().toISOString()}`);
    parts.push(` */`);
    parts.push("");
  }

  // Add custom banner if provided
  if (banner) {
    parts.push(`/* ${banner} */`);
    parts.push("");
  }

  // Generate enums first
  if (enums && enums.length > 0) {
    const enumCode = enums.map((e) => generateEnum(e, options)).join("\n\n");
    parts.push(enumCode);
    parts.push("");
  }

  // Generate all types
  const types = generateTypes(models, options);
  parts.push(types);

  // Combine and format
  const code = parts.join("\n");
  return await formatCode(code);
}

/**
 * Generate enums file for separate file mode
 * @param {Object[]} enums - Array of enum definitions
 * @param {Object} options - Generation options
 * @returns {string} Enums file content
 */
function generateEnumsFile(enums, options = {}) {
  const lines = [
    `/**`,
    ` * AUTO-GENERATED by type-bridge`,
    ` * Enum definitions`,
    ` */`,
    "",
  ];

  // Generate all enums
  enums.forEach((enumDef, index) => {
    if (index > 0) {
      lines.push(""); // Add blank line between enums
    }
    lines.push(generateEnum(enumDef, options));
  });

  return lines.join("\n");
}

/**
 * Generate index file that exports all types
 * @param {string[]} modelNames - Array of model names
 * @param {Object[]} enums - Array of enum definitions
 * @returns {string} Index file content
 */
function generateIndexFile(modelNames, enums = []) {
  const lines = [
    `/**`,
    ` * AUTO-GENERATED by type-bridge`,
    ` * Type exports`,
    ` */`,
    "",
  ];

  // Export enums if any
  if (enums && enums.length > 0) {
    const enumNames = enums.map((e) => e.name).join(", ");
    lines.push(`export { ${enumNames} } from './enums';`);
    lines.push("");
  }

  // Export all model types
  modelNames.forEach((name) => {
    lines.push(`export type { ${name} } from './${name}';`);
  });

  return lines.join("\n");
}

module.exports = {
  generateInterface,
  generateEnum,
  generateTypes,
  generateTypeScriptFile,
  generateIndexFile,
  generateEnumsFile,
  collectTypeDependencies,
  formatCode,
  fieldToTypeScript,
};
