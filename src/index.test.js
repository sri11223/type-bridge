/**
 * Tests for main exports
 */

const typebridge = require('./index');

describe('Main Exports', () => {
  test('should export generateTypes function', () => {
    expect(typeof typebridge.generateTypes).toBe('function');
  });

  test('should export watchFiles function', () => {
    expect(typeof typebridge.watchFiles).toBe('function');
  });

  test('should export loadConfig function', () => {
    expect(typeof typebridge.loadConfig).toBe('function');
  });

  test('should export all expected functions', () => {
    const expectedExports = [
      'generateTypes',
      'watchFiles',
      'loadConfig'
    ];

    expectedExports.forEach(exportName => {
      expect(typebridge[exportName]).toBeDefined();
    });
  });

  test('exports should be functions', () => {
    Object.values(typebridge).forEach(exportValue => {
      expect(typeof exportValue).toBe('function');
    });
  });
});
