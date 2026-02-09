/**
 * Jest Setup File
 * 
 * This file runs before all tests to set up the testing environment.
 */

// Polyfill TextEncoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
}

if (typeof TextDecoder === 'undefined') {
  global.TextDecoder = require('util').TextDecoder;
}

// Global test timeout
jest.setTimeout(30000);

// Mock console for cleaner test output
if (process.env.JEST_SILENT) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}