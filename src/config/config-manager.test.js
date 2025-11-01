/**
 * Tests for Config Manager
 */

const fs = require('fs-extra');
const path = require('path');
const {
  DEFAULT_CONFIG,
  loadConfig,
  findConfigFile,
  loadConfigFile,
  saveConfigFile,
  createConfigFile,
  updateConfigFile,
  validateConfig,
  mergeConfigs,
  resolvePaths
} = require('./config-manager');

describe('Config Manager', () => {
  const testDir = path.join(__dirname, 'test-config');
  const configPath = path.join(testDir, 'type-bridge.config.json');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('DEFAULT_CONFIG', () => {
    test('should have all required defaults', () => {
      expect(DEFAULT_CONFIG.orm).toBe('auto');
      expect(DEFAULT_CONFIG.outputPath).toBeDefined();
      expect(DEFAULT_CONFIG.outputMode).toBe('single');
      expect(DEFAULT_CONFIG.watch).toBe(false);
      expect(DEFAULT_CONFIG.includeComments).toBe(true);
    });

    test('should have exclude patterns', () => {
      expect(Array.isArray(DEFAULT_CONFIG.exclude)).toBe(true);
      expect(DEFAULT_CONFIG.exclude.length).toBeGreaterThan(0);
    });
  });

  describe('validateConfig', () => {
    test('should validate correct config', () => {
      const config = {
        orm: 'prisma',
        outputPath: './types',
        outputMode: 'single',
        exportType: 'export'
      };

      const result = validateConfig(config);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('should accept valid outputMode', () => {
      const config = {
        outputPath: './types',
        outputMode: 'separate',
        exportType: 'export',
        orm: 'auto'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(true);
    });

    test('should reject invalid outputMode', () => {
      const config = {
        outputPath: './types',
        outputMode: 'invalid'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should reject invalid ORM', () => {
      const config = {
        orm: 'invalid-orm',
        outputPath: './types'
      };

      const result = validateConfig(config);
      expect(result.valid).toBe(false);
    });

    test('should accept valid ORMs', () => {
      const validOrms = ['auto', 'prisma', 'mongoose', 'typeorm', 'sequelize'];

      validOrms.forEach(orm => {
        const config = { orm, outputPath: './types', exportType: 'export' };
        const result = validateConfig(config);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('mergeConfigs', () => {
    test('should merge with defaults', () => {
      const custom = { orm: 'prisma' };
      const result = mergeConfigs(custom);

      expect(result.orm).toBe('prisma');
      expect(result.outputPath).toBe(DEFAULT_CONFIG.outputPath);
    });

    test('should merge multiple configs', () => {
      const config1 = { orm: 'prisma' };
      const config2 = { outputPath: './custom' };

      const result = mergeConfigs(config1, config2);

      expect(result.orm).toBe('prisma');
      expect(result.outputPath).toBe('./custom');
    });

    test('should filter undefined values', () => {
      const config = { orm: 'prisma', outputPath: undefined };

      const result = mergeConfigs(config);

      expect(result.orm).toBe('prisma');
      expect(result.outputPath).toBe(DEFAULT_CONFIG.outputPath);
    });

    test('should preserve false values', () => {
      const config = { watch: false };

      const result = mergeConfigs(config);

      expect(result.watch).toBe(false);
    });

    test('should handle empty config', () => {
      const result = mergeConfigs({});

      expect(result).toEqual(DEFAULT_CONFIG);
    });
  });

  describe('resolvePaths', () => {
    test('should resolve relative paths', () => {
      const config = {
        modelsPath: './models',
        schemaPath: './schema.prisma',
        outputPath: './types'
      };

      const result = resolvePaths(config, testDir);

      expect(path.isAbsolute(result.modelsPath)).toBe(true);
      expect(path.isAbsolute(result.schemaPath)).toBe(true);
      expect(path.isAbsolute(result.outputPath)).toBe(true);
    });

    test('should not change absolute paths', () => {
      const absolutePath = path.resolve('/absolute/path');
      const config = {
        outputPath: absolutePath
      };

      const result = resolvePaths(config, testDir);

      expect(result.outputPath).toBe(absolutePath);
    });

    test('should handle missing paths', () => {
      const config = { orm: 'prisma' };

      const result = resolvePaths(config, testDir);

      expect(result.orm).toBe('prisma');
    });
  });

  describe('saveConfigFile', () => {
    test('should save config to file', async () => {
      const config = {
        orm: 'prisma',
        outputPath: './types'
      };

      await saveConfigFile(configPath, config);

      const exists = await fs.pathExists(configPath);
      expect(exists).toBe(true);

      const saved = await fs.readJson(configPath);
      expect(saved.orm).toBe('prisma');
    });

    test('should format JSON with spaces', async () => {
      const config = { orm: 'prisma' };

      await saveConfigFile(configPath, config);

      const content = await fs.readFile(configPath, 'utf-8');
      expect(content).toContain('\n');
      expect(content).toContain('  ');
    });
  });

  describe('loadConfigFile', () => {
    test('should load config from file', async () => {
      const config = {
        orm: 'mongoose',
        modelsPath: './models'
      };

      await fs.writeJson(configPath, config);

      const loaded = await loadConfigFile(configPath);

      expect(loaded.orm).toBe('mongoose');
      expect(loaded.modelsPath).toBe('./models');
    });

    test('should throw error for invalid JSON', async () => {
      await fs.writeFile(configPath, 'invalid json');

      await expect(loadConfigFile(configPath)).rejects.toThrow();
    });

    test('should throw error for non-existent file', async () => {
      await expect(loadConfigFile('/nonexistent/config.json')).rejects.toThrow();
    });
  });

  describe('findConfigFile', () => {
    test('should find config in current directory', async () => {
      await fs.writeJson(configPath, {});

      const found = await findConfigFile(testDir);

      expect(found).toBe(configPath);
    });

    test('should find config in parent directory', async () => {
      const parentConfig = path.join(testDir, 'type-bridge.config.json');
      const childDir = path.join(testDir, 'child');

      await fs.ensureDir(childDir);
      await fs.writeJson(parentConfig, {});

      const found = await findConfigFile(childDir);

      expect(found).toBe(parentConfig);
    });

    test('should return null if no config found', async () => {
      const found = await findConfigFile(testDir);

      expect(found).toBeNull();
    });
  });

  describe('createConfigFile', () => {
    test('should create new config file', async () => {
      const custom = { orm: 'prisma' };

      const created = await createConfigFile(testDir, custom);

      expect(created).toBe(configPath);

      const exists = await fs.pathExists(configPath);
      expect(exists).toBe(true);

      const content = await fs.readJson(configPath);
      expect(content.orm).toBe('prisma');
    });

    test('should throw error if file exists', async () => {
      await fs.writeJson(configPath, {});

      await expect(createConfigFile(testDir, {})).rejects.toThrow('already exists');
    });

    test('should merge with defaults', async () => {
      await createConfigFile(testDir, { orm: 'prisma' });

      const content = await fs.readJson(configPath);

      expect(content.outputPath).toBeDefined();
      expect(content.watch).toBeDefined();
    });
  });

  describe('updateConfigFile', () => {
    beforeEach(async () => {
      await fs.writeJson(configPath, {
        orm: 'prisma',
        outputPath: './types'
      });
    });

    test('should update existing config', async () => {
      await updateConfigFile(configPath, { watch: true });

      const updated = await fs.readJson(configPath);

      expect(updated.orm).toBe('prisma');
      expect(updated.watch).toBe(true);
    });

    test('should preserve existing values', async () => {
      await updateConfigFile(configPath, { outputMode: 'separate' });

      const updated = await fs.readJson(configPath);

      expect(updated.orm).toBe('prisma');
      expect(updated.outputPath).toBe('./types');
      expect(updated.outputMode).toBe('separate');
    });
  });

  describe('loadConfig', () => {
    test('should load and merge all configs', async () => {
      await fs.writeJson(configPath, {
        orm: 'prisma',
        schemaPath: './schema.prisma'
      });

      const config = await loadConfig({
        projectRoot: testDir,
        overrides: { watch: true }
      });

      expect(config.orm).toBe('prisma');
      expect(config.watch).toBe(true);
      expect(path.isAbsolute(config.schemaPath)).toBe(true);
    });

    test('should use defaults if no config file', async () => {
      const config = await loadConfig({
        projectRoot: testDir
      });

      expect(config.orm).toBe(DEFAULT_CONFIG.orm);
      expect(config.outputPath).toBeDefined();
    });

    test('should throw error for invalid config', async () => {
      await fs.writeJson(configPath, {
        orm: 'invalid-orm'
      });

      await expect(loadConfig({ projectRoot: testDir })).rejects.toThrow();
    });

    test('should include configPath and projectRoot', async () => {
      await fs.writeJson(configPath, {});

      const config = await loadConfig({ projectRoot: testDir });

      expect(config.configPath).toBe(configPath);
      expect(config.projectRoot).toBe(testDir);
    });
  });
});
