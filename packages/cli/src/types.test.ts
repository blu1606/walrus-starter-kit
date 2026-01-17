import { describe, it, expect } from 'vitest';
import type { SDK, Framework, UseCase, PackageManager, Context, ValidationResult } from './types.js';

describe('Type definitions', () => {
  it('should allow valid SDK values', () => {
    const sdks: SDK[] = ['mysten', 'tusky', 'hibernuts'];
    expect(sdks).toHaveLength(3);
  });

  it('should allow valid Framework values', () => {
    const frameworks: Framework[] = ['react', 'vue', 'plain-ts'];
    expect(frameworks).toHaveLength(3);
  });

  it('should allow valid UseCase values', () => {
    const useCases: UseCase[] = ['simple-upload', 'gallery', 'defi-nft'];
    expect(useCases).toHaveLength(3);
  });

  it('should allow valid PackageManager values', () => {
    const pms: PackageManager[] = ['npm', 'pnpm', 'yarn', 'bun'];
    expect(pms).toHaveLength(4);
  });

  it('should create valid Context object', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'simple-upload',
      analytics: false,
      tailwind: true,
      packageManager: 'pnpm',
    };

    expect(context.projectName).toBe('test-app');
    expect(context.sdk).toBe('mysten');
    expect(context.framework).toBe('react');
    expect(context.useCase).toBe('simple-upload');
    expect(context.analytics).toBe(false);
    expect(context.tailwind).toBe(true);
    expect(context.packageManager).toBe('pnpm');
  });

  it('should create valid ValidationResult with success', () => {
    const result: ValidationResult = {
      valid: true,
    };

    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
    expect(result.suggestion).toBeUndefined();
  });

  it('should create valid ValidationResult with error', () => {
    const result: ValidationResult = {
      valid: false,
      error: 'Something went wrong',
      suggestion: 'Try this instead',
    };

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Something went wrong');
    expect(result.suggestion).toBe('Try this instead');
  });

  it('should allow ValidationResult with error but no suggestion', () => {
    const result: ValidationResult = {
      valid: false,
      error: 'Error without suggestion',
    };

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Error without suggestion');
    expect(result.suggestion).toBeUndefined();
  });
});
