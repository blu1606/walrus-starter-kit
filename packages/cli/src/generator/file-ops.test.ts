import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs-extra';
import path from 'node:path';
import os from 'node:os';
import { copyEnvFile } from './file-ops.js';

describe('copyEnvFile', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'env-test-'));
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  it('should create .env from .env.example', async () => {
    // Setup
    const envExample = path.join(tempDir, '.env.example');
    await fs.writeFile(envExample, 'FOO=bar\n');

    // Execute
    const result = await copyEnvFile(tempDir);

    // Assert
    expect(result.created).toBe(true);
    expect(result.reason).toBeUndefined();
    const envExists = await fs.pathExists(path.join(tempDir, '.env'));
    expect(envExists).toBe(true);
  });

  it('should skip if .env already exists', async () => {
    // Setup
    await fs.writeFile(path.join(tempDir, '.env.example'), 'FOO=bar\n');
    await fs.writeFile(path.join(tempDir, '.env'), 'EXISTING=true\n');

    // Execute
    const result = await copyEnvFile(tempDir);

    // Assert
    expect(result.created).toBe(false);
    expect(result.reason).toBe('already-exists');
  });

  it('should skip if .env.example missing', async () => {
    // Execute
    const result = await copyEnvFile(tempDir);

    // Assert
    expect(result.created).toBe(false);
    expect(result.reason).toBe('no-source');
  });

  it('should copy exact file content', async () => {
    // Setup
    const content = 'VITE_API_KEY=test123\nNODE_ENV=development\n';
    await fs.writeFile(path.join(tempDir, '.env.example'), content);

    // Execute
    await copyEnvFile(tempDir);

    // Assert
    const envContent = await fs.readFile(path.join(tempDir, '.env'), 'utf8');
    expect(envContent).toBe(content);
  });
});
