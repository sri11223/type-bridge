/**
 * Tests for File Watcher
 */

const fs = require('fs-extra');
const path = require('path');
const { watchFiles, watchWithGeneration, debounce } = require('./file-watcher');

describe('File Watcher', () => {
  const testDir = path.join(__dirname, 'test-watch');

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('debounce', () => {
    test('should debounce function calls', (done) => {
      let callCount = 0;
      const fn = () => callCount++;
      const debouncedFn = debounce(fn, 50);

      // Call multiple times quickly
      debouncedFn();
      debouncedFn();
      debouncedFn();

      // Should only call once after delay
      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 100);
    });

    test('should pass arguments to debounced function', (done) => {
      let receivedArgs = null;
      const fn = (...args) => { receivedArgs = args; };
      const debouncedFn = debounce(fn, 50);

      debouncedFn('arg1', 'arg2', 'arg3');

      setTimeout(() => {
        expect(receivedArgs).toEqual(['arg1', 'arg2', 'arg3']);
        done();
      }, 100);
    });
  });

  describe('watchFiles', () => {
    test('should return a watcher controller', () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const controller = watchFiles(config, { debounceDelay: 100 });

      expect(controller).toBeDefined();
      expect(typeof controller.start).toBe('function');
      expect(typeof controller.stop).toBe('function');
      expect(typeof controller.restart).toBe('function');
    });

    test('should handle prisma config', () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
      expect(controller.isWatching).toBe(false); // Not started yet
    });

    test('should handle mongoose config', () => {
      const config = {
        orm: 'mongoose',
        modelsPath: path.join(testDir, 'models'),
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
      expect(controller.isWatching).toBe(false);
    });

    test('should provide stop method', async () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(typeof controller.stop).toBe('function');
      await expect(controller.stop()).resolves.not.toThrow();
    });

    test('should handle custom debounce time', () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir,
        watchDebounce: 500
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
    });

    test('should accept callback options', () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const onRegenerate = jest.fn();
      const onError = jest.fn();

      const controller = watchFiles(config, { onRegenerate, onError });

      expect(controller).toBeDefined();
    });
  });

  describe('watchWithGeneration', () => {
    test('should be a function', () => {
      expect(typeof watchWithGeneration).toBe('function');
    });

    test('should perform initial generation', async () => {
      const schemaPath = path.join(testDir, 'schema.prisma');
      await fs.writeFile(schemaPath, `
        model User {
          id String @id
          name String
        }
      `);

      const config = {
        orm: 'prisma',
        schemaPath,
        projectRoot: testDir,
        outputPath: path.join(testDir, 'types.ts')
      };

      const watcher = await watchWithGeneration(config);

      expect(watcher).toBeDefined();
      expect(typeof watcher.stop).toBe('function');

      await watcher.stop();

      // Check that types were generated
      const typesExist = await fs.pathExists(path.join(testDir, 'types.ts'));
      expect(typesExist).toBe(true);
    });

    test('should handle generation errors', async () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'nonexistent.prisma'),
        projectRoot: testDir,
        outputPath: path.join(testDir, 'types.ts')
      };

      await expect(watchWithGeneration(config)).rejects.toThrow();
    });

    // Note: Full integration tests are in src/__tests__/integration.test.js
    // These unit tests focus on the API surface
  });

  describe('Watcher configuration', () => {
    test('should use default debounce if not specified', () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
    });

    test('should handle exclude patterns', () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir,
        exclude: ['**/node_modules/**', '**/*.test.js']
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
    });

    test('should handle custom watchDebounce', () => {
      const config = {
        orm: 'mongoose',
        modelsPath: path.join(testDir, 'models'),
        projectRoot: testDir,
        watchDebounce: 1000
      };

      const controller = watchFiles(config, { debounceDelay: 500 });

      expect(controller).toBeDefined();
    });

    test('should allow restart', async () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(typeof controller.restart).toBe('function');
      await expect(controller.restart()).resolves.toBeDefined();
      await controller.stop();
    });

    test('should track watching state', () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(controller.isWatching).toBe(false);
      controller.start();
      expect(controller.isWatching).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle calling stop multiple times', async () => {
      const config = {
        orm: 'prisma',
        schemaPath: path.join(testDir, 'schema.prisma'),
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      // Should not throw when calling stop multiple times
      await controller.stop();
      await controller.stop();
      await controller.stop();
      
      expect(true).toBe(true); // If we got here, it didn't throw
    });

    test('should handle default schemaPath for prisma', () => {
      const config = {
        orm: 'prisma',
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
    });

    test('should handle default modelsPath for mongoose', () => {
      const config = {
        orm: 'mongoose',
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
    });

    test('should handle missing orm in config', () => {
      const config = {
        projectRoot: testDir
      };

      const controller = watchFiles(config);

      expect(controller).toBeDefined();
    });
  });
});
