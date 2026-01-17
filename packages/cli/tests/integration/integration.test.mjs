#!/usr/bin/env node

/**
 * CLI Integration Testing
 * Tests the CLI with various flag combinations
 */

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CLI_PATH = join(__dirname, '..', '..', 'src', 'index.ts');

console.log('============================================================');
console.log('CLI INTEGRATION TEST SUITE');
console.log('============================================================\n');

let passed = 0;
let failed = 0;
const results = [];

function test(name, command, expectations) {
  try {
    console.log(`Testing: ${name}`);
    console.log(`Command: ${command}\n`);

    const output = execSync(command, {
      cwd: join(__dirname, '..', '..'),
      encoding: 'utf-8',
      timeout: 10000,
      env: { ...process.env, npm_config_user_agent: 'pnpm/8.0.0' }
    });

    // Check expectations
    let allMatch = true;
    const failedExpectations = [];

    for (const [key, pattern] of Object.entries(expectations)) {
      if (pattern instanceof RegExp) {
        if (!pattern.test(output)) {
          allMatch = false;
          failedExpectations.push(`${key}: Pattern ${pattern} not found in output`);
        }
      } else if (typeof pattern === 'string') {
        if (!output.includes(pattern)) {
          allMatch = false;
          failedExpectations.push(`${key}: String "${pattern}" not found in output`);
        }
      }
    }

    if (allMatch) {
      console.log(`✓ PASSED\n`);
      passed++;
      results.push({ name, status: 'PASSED', output: output.substring(0, 200) });
    } else {
      console.log(`✗ FAILED`);
      failedExpectations.forEach(msg => console.log(`  - ${msg}`));
      console.log();
      failed++;
      results.push({ name, status: 'FAILED', errors: failedExpectations, output: output.substring(0, 200) });
    }
  } catch (error) {
    // Check if error is expected
    if (expectations.shouldFail) {
      if (error.stderr && expectations.errorPattern && expectations.errorPattern.test(error.stderr.toString())) {
        console.log(`✓ PASSED (Expected error matched)\n`);
        passed++;
        results.push({ name, status: 'PASSED (Expected Error)', stderr: error.stderr.toString().substring(0, 200) });
      } else {
        console.log(`✗ FAILED (Unexpected error)`);
        console.log(`  Error: ${error.message}\n`);
        failed++;
        results.push({ name, status: 'FAILED', error: error.message });
      }
    } else {
      console.log(`✗ FAILED (Unexpected error)`);
      console.log(`  Error: ${error.message}\n`);
      failed++;
      results.push({ name, status: 'FAILED', error: error.message });
    }
  }
}

// Test 1: Help command
test(
  'CLI help command',
  'npx tsx src/index.ts --help',
  {
    hasName: /create-walrus-app/,
    hasDescription: /Interactive CLI/,
    hasVersion: /--version/,
  }
);

// Test 2: Version command
test(
  'CLI version command',
  'npx tsx src/index.ts --version',
  {
    hasVersion: /\d+\.\d+\.\d+/,
  }
);

// Test 3: Valid non-interactive mode
test(
  'Valid CLI flags - Mysten + React + Simple Upload',
  'echo "" | npx tsx src/index.ts my-test-app --sdk mysten --framework react --use-case simple-upload',
  {
    hasWelcome: /Welcome to Walrus/,
    hasValid: /Configuration valid/,
  }
);

// Test 4: Invalid combination - Hibernuts + Vue
test(
  'Invalid combination - Hibernuts + Vue should fail',
  'echo "" | npx tsx src/index.ts test-app --sdk hibernuts --framework vue --use-case simple-upload 2>&1 || true',
  {
    hasError: /incompatible/,
    hasSuggestion: /Compatible frameworks/,
  }
);

// Test 5: Invalid combination - Tusky + DeFi/NFT
test(
  'Invalid combination - Tusky + DeFi/NFT should fail',
  'echo "" | npx tsx src/index.ts test-app --sdk tusky --framework react --use-case defi-nft 2>&1 || true',
  {
    hasError: /does not support/,
    hasSuggestion: /Supported use cases/,
  }
);

// Test 6: Check package manager detection
test(
  'Package manager detection',
  'echo "" | npx tsx src/index.ts pkg-test --sdk mysten --framework react --use-case simple-upload',
  {
    hasPackageManager: /pnpm/,
  }
);

// Summary
console.log('============================================================');
console.log('INTEGRATION TEST SUMMARY');
console.log('============================================================');
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(2)}%`);
console.log('============================================================\n');

if (failed > 0) {
  console.log('FAILED TESTS:\n');
  results
    .filter(r => r.status.includes('FAILED'))
    .forEach(r => {
      console.log(`  - ${r.name}`);
      if (r.errors) {
        r.errors.forEach(e => console.log(`    ${e}`));
      }
      if (r.error) {
        console.log(`    ${r.error}`);
      }
    });
  console.log();
}

process.exit(failed > 0 ? 1 : 0);
