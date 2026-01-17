import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { detectPackageManager } from './detect-pm.js';

describe('detectPackageManager', () => {
  let originalUserAgent: string | undefined;

  beforeEach(() => {
    originalUserAgent = process.env.npm_config_user_agent;
  });

  afterEach(() => {
    if (originalUserAgent === undefined) {
      delete process.env.npm_config_user_agent;
    } else {
      process.env.npm_config_user_agent = originalUserAgent;
    }
  });

  it('should detect pnpm from user agent', () => {
    process.env.npm_config_user_agent = 'pnpm/8.6.0 npm/? node/v18.16.0 linux x64';
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('should detect yarn from user agent', () => {
    process.env.npm_config_user_agent = 'yarn/1.22.19 npm/? node/v18.16.0 linux x64';
    expect(detectPackageManager()).toBe('yarn');
  });

  it('should detect bun from user agent', () => {
    process.env.npm_config_user_agent = 'bun/1.0.0';
    expect(detectPackageManager()).toBe('bun');
  });

  it('should default to npm when no user agent', () => {
    delete process.env.npm_config_user_agent;
    expect(detectPackageManager()).toBe('npm');
  });

  it('should default to npm for unknown user agent', () => {
    process.env.npm_config_user_agent = 'unknown/1.0.0';
    expect(detectPackageManager()).toBe('npm');
  });

  it('should handle user agent with pnpm in different positions', () => {
    process.env.npm_config_user_agent = 'npm/? pnpm/8.0.0 node/v18.0.0';
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('should prioritize pnpm over yarn when both present', () => {
    process.env.npm_config_user_agent = 'pnpm/8.0.0 yarn/1.22.0';
    expect(detectPackageManager()).toBe('pnpm');
  });

  it('should prioritize yarn over bun when both present', () => {
    process.env.npm_config_user_agent = 'yarn/1.22.0 bun/1.0.0';
    expect(detectPackageManager()).toBe('yarn');
  });

  it('should handle empty string user agent', () => {
    process.env.npm_config_user_agent = '';
    expect(detectPackageManager()).toBe('npm');
  });
});
