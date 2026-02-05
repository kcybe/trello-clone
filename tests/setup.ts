/**
 * Jest Setup File
 * 
 * This file runs before all tests to set up the testing environment.
 */

import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

// Test database path
const TEST_DB_PATH = path.join(process.cwd(), 'test.db');
const TEST_DB_URL = `file:${TEST_DB_PATH}`;

// Create test adapter with isolated database
const testAdapter = new PrismaBetterSqlite3({
  url: TEST_DB_URL,
});

// Create a separate Prisma client for testing
export const testPrisma = new PrismaClient({
  adapter: testAdapter,
  log: ['error', 'warn'],
});

// Clean up test database before all tests
beforeAll(async () => {
  // Delete existing test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // Initialize clean test database
  await testPrisma.$connect();
});

// Clean up after all tests
afterAll(async () => {
  await testPrisma.$disconnect();

  // Clean up test database
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
});

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
