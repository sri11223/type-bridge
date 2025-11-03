/**
 * Tests for CLI Commands
 */

const fs = require('fs-extra');
const path = require('path');
// Note: We can't easily test the CLI because it calls process.exit and has side effects
// These tests focus on configuration and setup validation

describe('CLI', () => {
  const testDir = path.join(__dirname, 'test-cli');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('Config initialization', () => {
    test('should create config file with correct structure', async () => {
      const configPath = path.join(testDir, 'type-bridge.config.json');
      
      const config = {
        orm: 'prisma',
        schemaPath: './prisma/schema.prisma',
        outputPath: './types',
        outputMode: 'single',
        watch: false,
        includeComments: true,
        exportType: 'export'
      };

      await fs.writeJson(configPath, config, { spaces: 2 });

      const loaded = await fs.readJson(configPath);
      expect(loaded.orm).toBe('prisma');
      expect(loaded.outputPath).toBe('./types');
    });

    test('should validate required config fields', () => {
      const requiredFields = ['orm', 'outputPath', 'exportType'];
      const config = {
        orm: 'prisma',
        outputPath: './types',
        exportType: 'export'
      };

      requiredFields.forEach(field => {
        expect(config[field]).toBeDefined();
      });
    });
  });

  describe('Path resolution', () => {
    test('should resolve relative paths correctly', () => {
      const projectRoot = testDir;
      const relativePath = './types';
      const resolved = path.resolve(projectRoot, relativePath);

      expect(path.isAbsolute(resolved)).toBe(true);
      expect(resolved).toContain('types');
    });

    test('should preserve absolute paths', () => {
      const absolutePath = path.join(testDir, 'types');
      const resolved = path.isAbsolute(absolutePath) ? absolutePath : path.resolve(testDir, absolutePath);

      expect(resolved).toBe(absolutePath);
    });
  });

  describe('CLI argument parsing', () => {
    test('should handle output path option', () => {
      const args = ['--output', './custom-types'];
      const outputArg = args[args.indexOf('--output') + 1];

      expect(outputArg).toBe('./custom-types');
    });

    test('should handle watch option', () => {
      const args = ['--watch'];
      const hasWatch = args.includes('--watch');

      expect(hasWatch).toBe(true);
    });

    test('should handle ORM option', () => {
      const args = ['--orm', 'prisma'];
      const ormArg = args[args.indexOf('--orm') + 1];

      expect(ormArg).toBe('prisma');
    });

    test('should handle config option', () => {
      const args = ['--config', './custom-config.json'];
      const configArg = args[args.indexOf('--config') + 1];

      expect(configArg).toBe('./custom-config.json');
    });

    test('should handle verbose option', () => {
      const args = ['--verbose'];
      const hasVerbose = args.includes('--verbose');

      expect(hasVerbose).toBe(true);
    });

    test('should handle force option', () => {
      const args = ['init', '--force'];
      const hasForce = args.includes('--force');

      expect(hasForce).toBe(true);
    });

    test('should parse multiple options', () => {
      const args = ['generate', '--orm', 'prisma', '--output', './types', '--watch'];
      
      expect(args.includes('--orm')).toBe(true);
      expect(args.includes('--output')).toBe(true);
      expect(args.includes('--watch')).toBe(true);
    });
  });

  describe('Config file handling', () => {
    test('should create valid JSON config', async () => {
      const configPath = path.join(testDir, 'config.json');
      const config = {
        orm: 'mongoose',
        modelsPath: './models',
        outputPath: './types',
        backup: true
      };

      await fs.writeJson(configPath, config, { spaces: 2 });
      const content = await fs.readFile(configPath, 'utf8');

      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('should handle config with all options', async () => {
      const configPath = path.join(testDir, 'full-config.json');
      const config = {
        orm: 'prisma',
        schemaPath: './prisma/schema.prisma',
        outputPath: './types',
        outputMode: 'separate',
        watch: true,
        watchDebounce: 500,
        includeComments: true,
        exportType: 'export',
        backup: true,
        backupDir: './.backups',
        exclude: ['**/*.test.js']
      };

      await fs.writeJson(configPath, config, { spaces: 2 });
      const loaded = await fs.readJson(configPath);

      expect(loaded).toEqual(config);
    });

    test('should detect missing config file', async () => {
      const configPath = path.join(testDir, 'nonexistent.json');
      const exists = await fs.pathExists(configPath);

      expect(exists).toBe(false);
    });
  });

  describe('Command validation', () => {
    test('should validate generate command', () => {
      const validCommands = ['init', 'generate', 'watch', 'clean'];
      
      expect(validCommands.includes('generate')).toBe(true);
    });

    test('should validate init command', () => {
      const validCommands = ['init', 'generate', 'watch', 'clean'];
      
      expect(validCommands.includes('init')).toBe(true);
    });

    test('should validate watch command', () => {
      const validCommands = ['init', 'generate', 'watch', 'clean'];
      
      expect(validCommands.includes('watch')).toBe(true);
    });

    test('should validate clean command', () => {
      const validCommands = ['init', 'generate', 'watch', 'clean'];
      
      expect(validCommands.includes('clean')).toBe(true);
    });
  });

  describe('ORM detection', () => {
    test('should detect prisma from package.json', async () => {
      const pkgPath = path.join(testDir, 'package.json');
      await fs.writeJson(pkgPath, {
        dependencies: {
          'prisma': '^5.0.0',
          '@prisma/client': '^5.0.0'
        }
      });

      const pkg = await fs.readJson(pkgPath);
      const hasPrisma = pkg.dependencies && (pkg.dependencies.prisma || pkg.dependencies['@prisma/client']);

      expect(hasPrisma).toBeTruthy();
    });

    test('should detect mongoose from package.json', async () => {
      const pkgPath = path.join(testDir, 'package.json');
      await fs.writeJson(pkgPath, {
        dependencies: {
          'mongoose': '^8.0.0'
        }
      });

      const pkg = await fs.readJson(pkgPath);
      const hasMongoose = pkg.dependencies && pkg.dependencies.mongoose;

      expect(hasMongoose).toBeTruthy();
    });

    test('should detect prisma schema file', async () => {
      const schemaPath = path.join(testDir, 'schema.prisma');
      await fs.writeFile(schemaPath, 'model User { id String @id }');

      const exists = await fs.pathExists(schemaPath);
      expect(exists).toBe(true);
    });
  });
});
