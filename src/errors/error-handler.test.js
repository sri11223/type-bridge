/**
 * Tests for Error Handler
 */

const {
  TypeBridgeError,
  ERROR_CODES,
  formatError,
  createError,
  assert
} = require('./error-handler');

describe('Error Handler', () => {
  describe('ERROR_CODES', () => {
    test('should have all error codes defined', () => {
      expect(ERROR_CODES.E1001).toBeDefined();
      expect(ERROR_CODES.E1002).toBeDefined();
      expect(ERROR_CODES.E1003).toBeDefined();
      expect(ERROR_CODES.E1004).toBeDefined();
      expect(ERROR_CODES.E1005).toBeDefined();
    });

    test('should have message for each code', () => {
      Object.values(ERROR_CODES).forEach(errorInfo => {
        expect(errorInfo.message).toBeDefined();
        expect(typeof errorInfo.message).toBe('string');
      });
    });

    test('should have suggestions for each code', () => {
      Object.values(ERROR_CODES).forEach(errorInfo => {
        expect(Array.isArray(errorInfo.suggestions)).toBe(true);
      });
    });
  });

  describe('TypeBridgeError', () => {
    test('should create error with code', () => {
      const error = new TypeBridgeError('E1001');

      expect(error.code).toBe('E1001');
      expect(error.message).toBe(ERROR_CODES.E1001.message);
      expect(error.suggestions).toEqual(ERROR_CODES.E1001.suggestions);
    });

    test('should include docsUrl if available', () => {
      const error = new TypeBridgeError('E1001');

      expect(error.docsUrl).toBe(ERROR_CODES.E1001.docsUrl);
    });

    test('should handle details object', () => {
      const error = new TypeBridgeError('E1002', {
        modelsPath: './models',
        count: 0
      });

      expect(error.details.modelsPath).toBe('./models');
      expect(error.details.count).toBe(0);
    });

    test('should handle unknown error code', () => {
      const error = new TypeBridgeError('E9999');

      expect(error.code).toBe('E0000');
      expect(error.message).toContain('Unknown error code');
    });

    test('should be instance of Error', () => {
      const error = new TypeBridgeError('E1001');

      expect(error instanceof Error).toBe(true);
      expect(error.name).toBe('TypeBridgeError');
    });
  });

  describe('formatError', () => {
    test('should format TypeBridgeError', () => {
      const error = new TypeBridgeError('E1001');
      const formatted = formatError(error);

      expect(formatted).toContain('E1001');
      expect(formatted).toContain(ERROR_CODES.E1001.message);
      expect(formatted).toContain('Suggestions');
    });

    test('should include suggestions in formatted output', () => {
      const error = new TypeBridgeError('E1001');
      const formatted = formatError(error);

      ERROR_CODES.E1001.suggestions.forEach(suggestion => {
        expect(formatted).toContain(suggestion);
      });
    });

    test('should include details if provided', () => {
      const error = new TypeBridgeError('E1002', {
        path: './models'
      });
      const formatted = formatError(error);

      expect(formatted).toContain('Details');
      expect(formatted).toContain('./models');
    });

    test('should include documentation link', () => {
      const error = new TypeBridgeError('E1001');
      const formatted = formatError(error);

      expect(formatted).toContain('Documentation');
      expect(formatted).toContain(ERROR_CODES.E1001.docsUrl);
    });

    test('should format generic Error', () => {
      const error = new Error('Generic error message');
      const formatted = formatError(error);

      expect(formatted).toContain('Generic error message');
      expect(formatted).toContain('Error');
    });

    test('should handle errors without suggestions', () => {
      const error = new Error('Test error');
      const formatted = formatError(error);

      expect(formatted).not.toContain('Suggestions');
    });
  });

  describe('createError', () => {
    test('should create TypeBridgeError', () => {
      const error = createError('E1003');

      expect(error instanceof TypeBridgeError).toBe(true);
      expect(error.code).toBe('E1003');
    });

    test('should include details', () => {
      const error = createError('E1004', { path: '/test' });

      expect(error.details.path).toBe('/test');
    });

    test('should create error with all properties', () => {
      const error = createError('E1005');

      expect(error.code).toBeDefined();
      expect(error.message).toBeDefined();
      expect(error.suggestions).toBeDefined();
    });
  });

  describe('assert', () => {
    test('should not throw if condition is true', () => {
      expect(() => {
        assert(true, 'E1001');
      }).not.toThrow();
    });

    test('should throw TypeBridgeError if condition is false', () => {
      expect(() => {
        assert(false, 'E1001');
      }).toThrow(TypeBridgeError);
    });

    test('should throw error with correct code', () => {
      try {
        assert(false, 'E1002');
      } catch (error) {
        expect(error.code).toBe('E1002');
      }
    });

    test('should include details in thrown error', () => {
      try {
        assert(false, 'E1003', { config: 'invalid' });
      } catch (error) {
        expect(error.details.config).toBe('invalid');
      }
    });

    test('should support truthy values', () => {
      expect(() => assert(1, 'E1001')).not.toThrow();
      expect(() => assert('string', 'E1001')).not.toThrow();
      expect(() => assert({}, 'E1001')).not.toThrow();
    });

    test('should support falsy values', () => {
      expect(() => assert(0, 'E1001')).toThrow();
      expect(() => assert('', 'E1001')).toThrow();
      expect(() => assert(null, 'E1001')).toThrow();
      expect(() => assert(undefined, 'E1001')).toThrow();
    });
  });

  describe('Error messages validation', () => {
    test('E1001 - No ORM detected', () => {
      const error = createError('E1001');
      expect(error.message).toContain('ORM');
    });

    test('E1002 - No models found', () => {
      const error = createError('E1002');
      expect(error.message).toContain('models');
    });

    test('E1003 - Invalid configuration', () => {
      const error = createError('E1003');
      expect(error.message).toContain('configuration');
    });

    test('E1004 - No write permission', () => {
      const error = createError('E1004');
      expect(error.message).toContain('permission');
    });

    test('E1005 - Schema parsing failed', () => {
      const error = createError('E1005');
      expect(error.message).toContain('parsing');
    });
  });

  describe('Suggestion quality', () => {
    test('suggestions should be actionable', () => {
      Object.values(ERROR_CODES).forEach(errorInfo => {
        errorInfo.suggestions.forEach(suggestion => {
          expect(suggestion.length).toBeGreaterThanOrEqual(10);
          expect(typeof suggestion).toBe('string');
        });
      });
    });

    test('suggestions should not be empty', () => {
      Object.values(ERROR_CODES).forEach(errorInfo => {
        expect(errorInfo.suggestions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('formatError', () => {
    test('should format TypeBridgeError with all fields', () => {
      const error = new TypeBridgeError('E1001', { orm: 'unknown' });
      const formatted = formatError(error);

      expect(formatted).toContain('E1001');
      expect(formatted).toContain('No supported ORM detected');
      expect(formatted).toContain('Suggestions:');
      expect(formatted).toContain('Install one of the supported ORMs');
    });

    test('should include details in formatted output', () => {
      const error = new TypeBridgeError('E1003', { field: 'outputPath', value: null });
      const formatted = formatError(error);

      expect(formatted).toContain('Details:');
      expect(formatted).toContain('field: outputPath');
      expect(formatted).toContain('value: null');
    });

    test('should include documentation link if present', () => {
      const error = new TypeBridgeError('E1001');
      const formatted = formatError(error);

      expect(formatted).toContain('Documentation:');
      expect(formatted).toContain('github.com');
    });

    test('should format generic errors', () => {
      const error = new Error('Something went wrong');
      const formatted = formatError(error);

      expect(formatted).toContain('Error:');
      expect(formatted).toContain('Something went wrong');
    });

    test('should handle error without docsUrl', () => {
      const error = new TypeBridgeError('E1004');
      const formatted = formatError(error);

      expect(formatted).toContain('E1004');
      expect(formatted).toContain('No write permission');
    });
  });

  describe('logError', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should log formatted error to console', () => {
      const error = new TypeBridgeError('E1002');
      const { logError } = require('./error-handler');

      logError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      const output = consoleErrorSpy.mock.calls[0][0];
      expect(output).toContain('E1002');
    });

    test('should log stack trace in verbose mode', () => {
      const error = new Error('Test error');
      error.stack = 'Stack trace here';
      const { logError } = require('./error-handler');

      logError(error, { verbose: true });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
      expect(consoleErrorSpy.mock.calls[1][0]).toContain('Stack trace:');
    });

    test('should not log stack trace without verbose', () => {
      const error = new Error('Test error');
      error.stack = 'Stack trace here';
      const { logError } = require('./error-handler');

      logError(error, { verbose: false });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('handleError', () => {
    let consoleErrorSpy;
    let processExitSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    test('should log error and not exit in test environment', () => {
      const error = new TypeBridgeError('E1005');
      const { handleError } = require('./error-handler');

      handleError(error);

      expect(consoleErrorSpy).toHaveBeenCalled();
      expect(processExitSpy).not.toHaveBeenCalled();
    });

    test('should pass verbose option to logError', () => {
      const error = new Error('Test');
      error.stack = 'Stack';
      const { handleError } = require('./error-handler');

      handleError(error, { verbose: true });

      expect(consoleErrorSpy).toHaveBeenCalledTimes(3);
    });
  });

  describe('withErrorHandling', () => {
    let consoleErrorSpy;

    beforeEach(() => {
      consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      process.env.NODE_ENV = 'test';
    });

    afterEach(() => {
      consoleErrorSpy.mockRestore();
    });

    test('should wrap async function and catch errors', async () => {
      const { withErrorHandling } = require('./error-handler');
      const fn = async () => {
        throw new Error('Test error');
      };

      const wrapped = withErrorHandling(fn);
      await wrapped();

      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    test('should return result on success', async () => {
      const { withErrorHandling } = require('./error-handler');
      const fn = async (x, y) => x + y;

      const wrapped = withErrorHandling(fn);
      const result = await wrapped(2, 3);

      expect(result).toBe(5);
    });

    test('should pass arguments correctly', async () => {
      const { withErrorHandling } = require('./error-handler');
      const fn = async (a, b, c) => `${a}-${b}-${c}`;

      const wrapped = withErrorHandling(fn);
      const result = await wrapped('foo', 'bar', 'baz');

      expect(result).toBe('foo-bar-baz');
    });
  });
});
