#!/usr/bin/env node

/**
 * Manual testing script for CLI engine core
 * Tests validation, context building, and compatibility matrix
 */

import { validateContext, validateProjectName } from './src/validator.ts';
import { buildContext } from './src/context.ts';
import { detectPackageManager } from './src/utils/detect-pm.ts';
import { COMPATIBILITY_MATRIX, SDK_METADATA } from './src/matrix.ts';

console.log('='.repeat(60));
console.log('CLI ENGINE CORE - MANUAL TEST SUITE');
console.log('='.repeat(60));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(message);
  }
}

// ====================
// TEST 1: Package Manager Detection
// ====================
console.log('\n## TEST 1: Package Manager Detection\n');

test('Should detect pnpm from user agent', () => {
  const originalAgent = process.env.npm_config_user_agent;
  process.env.npm_config_user_agent = 'pnpm/8.0.0';
  const result = detectPackageManager();
  assertEqual(result, 'pnpm', 'Should return pnpm');
  process.env.npm_config_user_agent = originalAgent;
});

test('Should detect yarn from user agent', () => {
  const originalAgent = process.env.npm_config_user_agent;
  process.env.npm_config_user_agent = 'yarn/1.22.0';
  const result = detectPackageManager();
  assertEqual(result, 'yarn', 'Should return yarn');
  process.env.npm_config_user_agent = originalAgent;
});

test('Should detect bun from user agent', () => {
  const originalAgent = process.env.npm_config_user_agent;
  process.env.npm_config_user_agent = 'bun/1.0.0';
  const result = detectPackageManager();
  assertEqual(result, 'bun', 'Should return bun');
  process.env.npm_config_user_agent = originalAgent;
});

test('Should default to npm when no user agent', () => {
  const originalAgent = process.env.npm_config_user_agent;
  delete process.env.npm_config_user_agent;
  const result = detectPackageManager();
  assertEqual(result, 'npm', 'Should return npm as default');
  process.env.npm_config_user_agent = originalAgent;
});

// ====================
// TEST 2: Project Name Validation
// ====================
console.log('\n## TEST 2: Project Name Validation\n');

test('Should accept valid project name', () => {
  const result = validateProjectName('my-walrus-app');
  assertEqual(result, true, 'Valid name should return true');
});

test('Should accept project name with numbers', () => {
  const result = validateProjectName('app-123');
  assertEqual(result, true, 'Name with numbers should be valid');
});

test('Should reject uppercase letters', () => {
  const result = validateProjectName('MyApp');
  assertTrue(typeof result === 'string', 'Should return error message');
});

test('Should reject spaces', () => {
  const result = validateProjectName('my app');
  assertTrue(typeof result === 'string', 'Should return error message');
});

test('Should reject path traversal attempts', () => {
  const result = validateProjectName('../etc/passwd');
  assertTrue(typeof result === 'string', 'Should return error message');
});

test('Should reject names starting with hyphen', () => {
  const result = validateProjectName('-myapp');
  assertTrue(typeof result === 'string', 'Should return error message');
});

test('Should reject names ending with hyphen', () => {
  const result = validateProjectName('myapp-');
  assertTrue(typeof result === 'string', 'Should return error message');
});

test('Should reject absolute paths (Unix)', () => {
  const result = validateProjectName('/var/www');
  assertTrue(typeof result === 'string', 'Should return error message');
});

// ====================
// TEST 3: Compatibility Matrix
// ====================
console.log('\n## TEST 3: Compatibility Matrix\n');

test('Mysten SDK should support all frameworks', () => {
  assertEqual(COMPATIBILITY_MATRIX.mysten.frameworks, ['react', 'vue', 'plain-ts'], 'Mysten supports all frameworks');
});

test('Hibernuts SDK should only support React and Plain TS', () => {
  assertEqual(COMPATIBILITY_MATRIX.hibernuts.frameworks, ['react', 'plain-ts'], 'Hibernuts has limited framework support');
});

test('Tusky SDK should support gallery use case', () => {
  assertTrue(COMPATIBILITY_MATRIX.tusky.useCases.includes('gallery'), 'Tusky supports gallery');
});

test('Hibernuts SDK should NOT support gallery use case', () => {
  assertFalse(COMPATIBILITY_MATRIX.hibernuts.useCases.includes('gallery'), 'Hibernuts does not support gallery');
});

test('SDK metadata should be defined for all SDKs', () => {
  assertTrue(SDK_METADATA.mysten.name === '@mysten/walrus', 'Mysten metadata exists');
  assertTrue(SDK_METADATA.tusky.name === '@tusky-io/ts-sdk', 'Tusky metadata exists');
  assertTrue(SDK_METADATA.hibernuts.name === '@hibernuts/walrus-sdk', 'Hibernuts metadata exists');
});

// ====================
// TEST 4: Context Validation - Valid Combinations
// ====================
console.log('\n## TEST 4: Context Validation - Valid Combinations\n');

test('Should accept valid Mysten + React + Simple Upload', () => {
  const context = {
    projectName: 'test-app',
    projectPath: '/test-app',
    sdk: 'mysten',
    framework: 'react',
    useCase: 'simple-upload',
    analytics: false,
    tailwind: true,
    packageManager: 'pnpm'
  };
  const result = validateContext(context);
  assertEqual(result.valid, true, 'Valid combination should pass');
});

test('Should accept valid Tusky + Vue + Gallery', () => {
  const context = {
    projectName: 'test-app',
    projectPath: '/test-app',
    sdk: 'tusky',
    framework: 'vue',
    useCase: 'gallery',
    analytics: false,
    tailwind: true,
    packageManager: 'npm'
  };
  const result = validateContext(context);
  assertEqual(result.valid, true, 'Valid combination should pass');
});

// ====================
// TEST 5: Context Validation - Invalid Combinations
// ====================
console.log('\n## TEST 5: Context Validation - Invalid Combinations\n');

test('Should reject Hibernuts + Vue (incompatible framework)', () => {
  const context = {
    projectName: 'test-app',
    projectPath: '/test-app',
    sdk: 'hibernuts',
    framework: 'vue',
    useCase: 'simple-upload',
    analytics: false,
    tailwind: true,
    packageManager: 'pnpm'
  };
  const result = validateContext(context);
  assertEqual(result.valid, false, 'Should reject incompatible framework');
  assertTrue(result.error.includes('incompatible'), 'Error should mention incompatibility');
  assertTrue(result.suggestion.includes('react'), 'Suggestion should mention valid frameworks');
});

test('Should reject Hibernuts + DeFi/NFT (unsupported use case)', () => {
  const context = {
    projectName: 'test-app',
    projectPath: '/test-app',
    sdk: 'hibernuts',
    framework: 'react',
    useCase: 'defi-nft',
    analytics: false,
    tailwind: true,
    packageManager: 'pnpm'
  };
  const result = validateContext(context);
  assertEqual(result.valid, false, 'Should reject unsupported use case');
  assertTrue(result.error.includes('does not support'), 'Error should mention unsupported use case');
});

test('Should reject Tusky + DeFi/NFT (unsupported use case)', () => {
  const context = {
    projectName: 'test-app',
    projectPath: '/test-app',
    sdk: 'tusky',
    framework: 'react',
    useCase: 'defi-nft',
    analytics: false,
    tailwind: true,
    packageManager: 'pnpm'
  };
  const result = validateContext(context);
  assertEqual(result.valid, false, 'Should reject unsupported use case');
});

// ====================
// TEST 6: Context Builder
// ====================
console.log('\n## TEST 6: Context Builder\n');

test('Should build context from args and prompts', () => {
  const args = { analytics: true };
  const prompts = {
    projectName: 'my-app',
    sdk: 'mysten',
    framework: 'react',
    useCase: 'simple-upload',
    tailwind: true
  };

  const originalAgent = process.env.npm_config_user_agent;
  process.env.npm_config_user_agent = 'pnpm/8.0.0';

  const context = buildContext(args, prompts);

  assertEqual(context.projectName, 'my-app', 'Project name should match');
  assertEqual(context.sdk, 'mysten', 'SDK should match');
  assertEqual(context.framework, 'react', 'Framework should match');
  assertEqual(context.useCase, 'simple-upload', 'Use case should match');
  assertEqual(context.analytics, true, 'Analytics should be true from args');
  assertEqual(context.tailwind, true, 'Tailwind should be true');
  assertEqual(context.packageManager, 'pnpm', 'Package manager should be detected');

  process.env.npm_config_user_agent = originalAgent;
});

test('Should prioritize args over prompts', () => {
  const args = { sdk: 'hibernuts', analytics: true };
  const prompts = { sdk: 'mysten', analytics: false, projectName: 'test', framework: 'react', useCase: 'simple-upload', tailwind: true };

  const context = buildContext(args, prompts);

  assertEqual(context.sdk, 'hibernuts', 'Args should override prompts for sdk');
  assertEqual(context.analytics, true, 'Args should override prompts for analytics');
});

// ====================
// SUMMARY
// ====================
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
console.log('='.repeat(60));

if (failed > 0) {
  process.exit(1);
}
