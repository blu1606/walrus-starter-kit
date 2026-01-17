import { describe, it, expect } from 'vitest';
import { validateProjectName, validateContext } from './validator.js';
import { Context } from './types.js';

describe('validateProjectName', () => {
  it('should accept valid project names', () => {
    expect(validateProjectName('my-project')).toBe(true);
    expect(validateProjectName('app123')).toBe(true);
    expect(validateProjectName('walrus-app-v2')).toBe(true);
  });

  it('should reject names with path traversal', () => {
    expect(validateProjectName('../my-project')).toContain('path separators');
    expect(validateProjectName('../../escape')).toContain('path separators');
    expect(validateProjectName('test/../bad')).toContain('path separators');
  });

  it('should reject names with forward slashes', () => {
    expect(validateProjectName('my/project')).toContain('path separators');
    expect(validateProjectName('/absolute/path')).toContain('path separators');
  });

  it('should reject names with backslashes', () => {
    expect(validateProjectName('my\\project')).toContain('path separators');
    expect(validateProjectName('C:\\Windows\\path')).toContain('path separators');
  });

  it('should reject absolute paths', () => {
    expect(validateProjectName('/usr/local/bin')).toContain('path');
    expect(validateProjectName('C:\\Program Files')).toContain('path');
  });

  it('should reject names with uppercase letters', () => {
    expect(validateProjectName('MyProject')).toContain('lowercase');
    expect(validateProjectName('TEST')).toContain('lowercase');
  });

  it('should reject names with special characters', () => {
    expect(validateProjectName('my_project')).toContain('lowercase');
    expect(validateProjectName('my.project')).toContain('lowercase');
    expect(validateProjectName('my@project')).toContain('lowercase');
    expect(validateProjectName('my project')).toContain('lowercase');
  });

  it('should reject names starting with hyphen', () => {
    expect(validateProjectName('-myproject')).toContain('hyphen');
  });

  it('should reject names ending with hyphen', () => {
    expect(validateProjectName('myproject-')).toContain('hyphen');
  });

  it('should accept names with hyphens in middle', () => {
    expect(validateProjectName('my-awesome-project')).toBe(true);
  });

  it('should accept numbers in names', () => {
    expect(validateProjectName('app123')).toBe(true);
    expect(validateProjectName('2024-project')).toBe(true);
  });
});

describe('validateContext', () => {
  const createContext = (overrides: Partial<Context> = {}): Context => ({
    projectName: 'test-app',
    projectPath: '/path/to/test-app',
    sdk: 'mysten',
    framework: 'react',
    useCase: 'simple-upload',
    analytics: false,
    tailwind: true,
    packageManager: 'pnpm',
    ...overrides,
  });

  it('should validate compatible sdk and framework combinations', () => {
    expect(validateContext(createContext({ sdk: 'mysten', framework: 'react' }))).toEqual({ valid: true });
    expect(validateContext(createContext({ sdk: 'mysten', framework: 'vue' }))).toEqual({ valid: true });
    expect(validateContext(createContext({ sdk: 'mysten', framework: 'plain-ts' }))).toEqual({ valid: true });
    expect(validateContext(createContext({ sdk: 'tusky', framework: 'react' }))).toEqual({ valid: true });
    expect(validateContext(createContext({ sdk: 'hibernuts', framework: 'react' }))).toEqual({ valid: true });
  });

  it('should reject incompatible sdk and framework combinations', () => {
    const result = validateContext(createContext({ sdk: 'hibernuts', framework: 'vue' }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('incompatible');
    expect(result.suggestion).toContain('Compatible frameworks');
  });

  it('should validate compatible sdk and useCase combinations', () => {
    expect(validateContext(createContext({ sdk: 'mysten', useCase: 'simple-upload' }))).toEqual({ valid: true });
    expect(validateContext(createContext({ sdk: 'mysten', useCase: 'gallery' }))).toEqual({ valid: true });
    expect(validateContext(createContext({ sdk: 'mysten', useCase: 'defi-nft' }))).toEqual({ valid: true });
    expect(validateContext(createContext({ sdk: 'tusky', useCase: 'simple-upload' }))).toEqual({ valid: true });
  });

  it('should reject incompatible sdk and useCase combinations', () => {
    const result = validateContext(createContext({ sdk: 'tusky', useCase: 'defi-nft' }));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('does not support');
    expect(result.suggestion).toContain('Supported use cases');
  });

  it('should reject hibernuts with gallery use case', () => {
    const result = validateContext(createContext({ sdk: 'hibernuts', useCase: 'gallery' }));
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('should provide helpful suggestions in error messages', () => {
    const result = validateContext(createContext({ sdk: 'hibernuts', framework: 'vue' }));
    expect(result.suggestion).toMatch(/react|plain-ts/);
  });
});
