/**
 * Direct validation tests - tests validator logic
 */

import path from 'node:path';

// Simple test implementation
const COMPATIBILITY_MATRIX = {
  mysten: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery', 'defi-nft'],
  },
  tusky: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery'],
  },
  hibernuts: {
    frameworks: ['react', 'plain-ts'],
    useCases: ['simple-upload'],
  },
};

function validateContext(context) {
  const { sdk, framework, useCase } = context;

  // Check framework compatibility
  if (!COMPATIBILITY_MATRIX[sdk].frameworks.includes(framework)) {
    return {
      valid: false,
      error: `SDK "${sdk}" is incompatible with framework "${framework}"`,
      suggestion: `Compatible frameworks for ${sdk}: ${COMPATIBILITY_MATRIX[sdk].frameworks.join(', ')}`,
    };
  }

  // Check use case compatibility
  if (!COMPATIBILITY_MATRIX[sdk].useCases.includes(useCase)) {
    return {
      valid: false,
      error: `SDK "${sdk}" does not support use case "${useCase}"`,
      suggestion: `Supported use cases for ${sdk}: ${COMPATIBILITY_MATRIX[sdk].useCases.join(', ')}`,
    };
  }

  return { valid: true };
}

function validateProjectName(name) {
  // Prevent path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return 'Project name cannot contain path separators';
  }

  // Prevent absolute paths
  if (path.isAbsolute(name)) {
    return 'Project name cannot be an absolute path';
  }

  // npm package naming rules
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name must contain only lowercase letters, numbers, and hyphens';
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    return 'Project name cannot start or end with a hyphen';
  }

  return true;
}

function detectPackageManager() {
  const userAgent = process.env.npm_config_user_agent;

  if (userAgent?.includes('pnpm')) return 'pnpm';
  if (userAgent?.includes('yarn')) return 'yarn';
  if (userAgent?.includes('bun')) return 'bun';

  return 'npm';
}

// Test framework
let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    failed++;
    failures.push({ name, error: error.message });
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

console.log('============================================================');
console.log('CLI ENGINE CORE - VALIDATION TEST SUITE');
console.log('============================================================\n');

// TEST 1: Package Manager Detection
console.log('## TEST 1: Package Manager Detection\n');

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

test('Should default to npm when no user agent', () => {
  const originalAgent = process.env.npm_config_user_agent;
  delete process.env.npm_config_user_agent;
  const result = detectPackageManager();
  assertEqual(result, 'npm', 'Should return npm as default');
  process.env.npm_config_user_agent = originalAgent;
});

// TEST 2: Project Name Validation
console.log('\n## TEST 2: Project Name Validation\n');

test('Should accept valid project name', () => {
  assertEqual(validateProjectName('my-walrus-app'), true, 'Valid name should return true');
});

test('Should accept project name with numbers', () => {
  assertEqual(validateProjectName('app-123'), true, 'Name with numbers should be valid');
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

// TEST 3: Context Validation - Valid Combinations
console.log('\n## TEST 3: Context Validation - Valid Combinations\n');

test('Should accept valid Mysten + React + Simple Upload', () => {
  const context = {
    sdk: 'mysten',
    framework: 'react',
    useCase: 'simple-upload',
  };
  const result = validateContext(context);
  assertEqual(result.valid, true, 'Valid combination should pass');
});

test('Should accept valid Tusky + Vue + Gallery', () => {
  const context = {
    sdk: 'tusky',
    framework: 'vue',
    useCase: 'gallery',
  };
  const result = validateContext(context);
  assertEqual(result.valid, true, 'Valid combination should pass');
});

test('Should accept valid Hibernuts + React + Simple Upload', () => {
  const context = {
    sdk: 'hibernuts',
    framework: 'react',
    useCase: 'simple-upload',
  };
  const result = validateContext(context);
  assertEqual(result.valid, true, 'Valid combination should pass');
});

test('Should accept all Mysten framework combinations', () => {
  ['react', 'vue', 'plain-ts'].forEach(fw => {
    const result = validateContext({
      sdk: 'mysten',
      framework: fw,
      useCase: 'simple-upload',
    });
    assertTrue(result.valid, `Mysten should work with ${fw}`);
  });
});

// TEST 4: Context Validation - Invalid Combinations
console.log('\n## TEST 4: Context Validation - Invalid Combinations\n');

test('Should reject Hibernuts + Vue (incompatible framework)', () => {
  const context = {
    sdk: 'hibernuts',
    framework: 'vue',
    useCase: 'simple-upload',
  };
  const result = validateContext(context);
  assertEqual(result.valid, false, 'Should reject incompatible framework');
  assertTrue(result.error.includes('incompatible'), 'Error should mention incompatibility');
  assertTrue(result.suggestion.includes('react'), 'Suggestion should mention valid frameworks');
});

test('Should reject Hibernuts + DeFi/NFT (unsupported use case)', () => {
  const context = {
    sdk: 'hibernuts',
    framework: 'react',
    useCase: 'defi-nft',
  };
  const result = validateContext(context);
  assertEqual(result.valid, false, 'Should reject unsupported use case');
  assertTrue(result.error.includes('does not support'), 'Error should mention unsupported use case');
});

test('Should reject Tusky + DeFi/NFT (unsupported use case)', () => {
  const context = {
    sdk: 'tusky',
    framework: 'react',
    useCase: 'defi-nft',
  };
  const result = validateContext(context);
  assertEqual(result.valid, false, 'Should reject unsupported use case');
});

test('Should reject Hibernuts + Plain-TS + Gallery', () => {
  const context = {
    sdk: 'hibernuts',
    framework: 'plain-ts',
    useCase: 'gallery',
  };
  const result = validateContext(context);
  assertEqual(result.valid, false, 'Should reject unsupported use case');
});

// TEST 5: Edge Cases
console.log('\n## TEST 5: Edge Cases\n');

test('Should handle empty project name', () => {
  const result = validateProjectName('');
  assertTrue(typeof result === 'string', 'Empty name should be rejected');
});

test('Should handle very long project name', () => {
  const longName = 'a'.repeat(100);
  const result = validateProjectName(longName);
  assertEqual(result, true, 'Long valid name should be accepted');
});

test('Should reject Windows path separators', () => {
  const result = validateProjectName('my\\app');
  assertTrue(typeof result === 'string', 'Windows path separator should be rejected');
});

test('Should reject special characters', () => {
  ['my@app', 'my.app', 'my_app', 'my app!'].forEach(name => {
    const result = validateProjectName(name);
    assertTrue(typeof result === 'string', `Special characters in "${name}" should be rejected`);
  });
});

// Summary
console.log('\n============================================================');
console.log('TEST SUMMARY');
console.log('============================================================');
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);

if (failed > 0) {
  console.log('\n## FAILED TESTS:\n');
  failures.forEach(({ name, error }) => {
    console.log(`  - ${name}`);
    console.log(`    ${error}\n`);
  });
}

console.log('============================================================\n');

process.exit(failed > 0 ? 1 : 0);
