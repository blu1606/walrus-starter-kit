#!/usr/bin/env node
import { execSync } from 'node:child_process';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLI_BIN = path.resolve(__dirname, '../../dist/index.js');
const TEMP_DIR = path.join(os.tmpdir(), `walrus-e2e-${Date.now()}`);

let testsFailed = 0;
let testsPassed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
    testsFailed++;
  }
}

function assertContains(str, substring, message) {
  if (!str.includes(substring)) {
    throw new Error(message || `Expected "${str}" to contain "${substring}"`);
  }
}

async function cleanup() {
  if (await fs.pathExists(TEMP_DIR)) {
    await fs.remove(TEMP_DIR);
  }
}

async function runTests() {
  console.log('\\n🧪 Running E2E Tests...\\n');

  await fs.ensureDir(TEMP_DIR);

  test('CLI binary exists', () => {
    if (!fs.existsSync(CLI_BIN)) {
      throw new Error(`CLI binary not found at ${CLI_BIN}`);
    }
  });

  test('CLI shows help with --help flag', () => {
    const output = execSync(`node "${CLI_BIN}" --help`, { encoding: 'utf-8' });
    assertContains(output, 'Usage', 'Help should contain usage');
  });

  test('Creates React project with all flags', () => {
    const projectName = 'test-react-project';
    const projectPath = path.join(TEMP_DIR, projectName);

    execSync(
      `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case simple-upload -p npm --skip-install --skip-git --skip-validation`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    );

    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project directory not created at ${projectPath}`);
    }
    if (!fs.existsSync(path.join(projectPath, 'package.json'))) {
      throw new Error('package.json not found');
    }
    if (!fs.existsSync(path.join(projectPath, 'src/main.tsx'))) {
      throw new Error('main.tsx not found');
    }
  });

  test('Package.json has correct name', () => {
    const projectName = 'test-pkg-name';
    const projectPath = path.join(TEMP_DIR, projectName);

    execSync(
      `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case simple-upload -p npm --skip-install --skip-git --skip-validation`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    );

    const pkg = fs.readJsonSync(path.join(projectPath, 'package.json'));
    if (pkg.name !== projectName) {
      throw new Error(`Expected name "${projectName}", got "${pkg.name}"`);
    }
  });

  test('Package.json includes React dependencies', () => {
    const projectName = 'test-deps';
    const projectPath = path.join(TEMP_DIR, projectName);

    execSync(
      `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case simple-upload -p npm --skip-install --skip-git --skip-validation`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    );

    const pkg = fs.readJsonSync(path.join(projectPath, 'package.json'));
    if (!pkg.dependencies.react) {
      throw new Error('Missing react dependency');
    }
    if (!pkg.dependencies['@mysten/walrus']) {
      throw new Error('Missing @mysten/walrus dependency');
    }
    if (!pkg.devDependencies.vite) {
      throw new Error('Missing vite devDependency');
    }
  });

  test('Creates simple-upload use-case correctly', () => {
    const projectName = 'test-simple-upload';
    const projectPath = path.join(TEMP_DIR, projectName);

    execSync(
      `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case simple-upload -p npm --skip-install --skip-git --skip-validation`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    );

    if (
      !fs.existsSync(path.join(projectPath, 'src/components/UploadForm.tsx'))
    ) {
      throw new Error('UploadForm.tsx not found');
    }

    const content = fs.readFileSync(
      path.join(projectPath, 'src/components/UploadForm.tsx'),
      'utf-8'
    );
    assertContains(
      content,
      'useUpload',
      'UploadForm should use useUpload hook'
    );
  });

  test('Creates gallery use-case correctly', () => {
    const projectName = 'test-gallery';
    const projectPath = path.join(TEMP_DIR, projectName);

    execSync(
      `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case gallery -p npm --skip-install --skip-git --skip-validation`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    );

    if (
      !fs.existsSync(path.join(projectPath, 'src/components/GalleryGrid.tsx'))
    ) {
      throw new Error('GalleryGrid.tsx not found');
    }
    if (!fs.existsSync(path.join(projectPath, 'src/utils/index-manager.ts'))) {
      throw new Error('index-manager.ts not found');
    }
  });

  test('Includes required configuration files', () => {
    const projectName = 'test-config';
    const projectPath = path.join(TEMP_DIR, projectName);

    execSync(
      `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case simple-upload -p npm --skip-install --skip-git --skip-validation`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    );

    if (!fs.existsSync(path.join(projectPath, 'tsconfig.json'))) {
      throw new Error('tsconfig.json not found');
    }
    if (!fs.existsSync(path.join(projectPath, 'vite.config.ts'))) {
      throw new Error('vite.config.ts not found');
    }
    if (!fs.existsSync(path.join(projectPath, '.gitignore'))) {
      throw new Error('.gitignore not found');
    }
  });

  test('Replaces template variables correctly', () => {
    const projectName = 'my-custom-app-name';
    const projectPath = path.join(TEMP_DIR, projectName);

    execSync(
      `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case simple-upload -p npm --skip-install --skip-git --skip-validation`,
      { cwd: TEMP_DIR, encoding: 'utf-8' }
    );

    const readme = fs.readFileSync(
      path.join(projectPath, 'README.md'),
      'utf-8'
    );
    assertContains(readme, projectName, 'README should contain project name');
    if (readme.includes('{{PROJECT_NAME}}')) {
      throw new Error('Template variable not replaced in README');
    }
  });

  test('Fails for invalid SDK', () => {
    let failed = false;
    try {
      execSync(
        `node "${CLI_BIN}" test-invalid --sdk invalid-sdk --framework react`,
        { cwd: TEMP_DIR, encoding: 'utf-8', stdio: 'pipe' }
      );
    } catch (error) {
      failed = true;
    }
    if (!failed) {
      throw new Error('Should have failed for invalid SDK');
    }
  });

  test('Fails for non-empty directory', () => {
    const projectName = 'test-non-empty';
    const projectPath = path.join(TEMP_DIR, projectName);

    fs.ensureDirSync(projectPath);
    fs.writeFileSync(path.join(projectPath, 'existing.txt'), 'content');

    let failed = false;
    try {
      execSync(
        `node "${CLI_BIN}" ${projectName} --sdk mysten --framework react --use-case simple-upload -p npm --skip-install --skip-git --skip-validation`,
        { cwd: TEMP_DIR, encoding: 'utf-8', stdio: 'pipe' }
      );
    } catch (error) {
      failed = true;
      assertContains(
        error.stderr || error.stdout || '',
        'not empty',
        'Error message should mention "not empty"'
      );
    }
    if (!failed) {
      throw new Error('Should have failed for non-empty directory');
    }
  });

  await cleanup();

  console.log(`\\n📊 Results: ${testsPassed} passed, ${testsFailed} failed\\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
