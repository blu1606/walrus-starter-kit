import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildContext } from './context.js';
import * as detectPmModule from './utils/detect-pm.js';

// Mock the detectPackageManager function
vi.mock('./utils/detect-pm.js', () => ({
  detectPackageManager: vi.fn(() => 'pnpm'),
}));

describe('buildContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build context from args only', () => {
    const args = {
      projectName: 'test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'simple-upload',
      analytics: true,
      tailwind: false,
    };

    const context = buildContext(args, {});

    expect(context.projectName).toBe('test-app');
    expect(context.sdk).toBe('mysten');
    expect(context.framework).toBe('react');
    expect(context.useCase).toBe('simple-upload');
    expect(context.analytics).toBe(true);
    expect(context.tailwind).toBe(false);
    expect(context.packageManager).toBe('pnpm');
    expect(context.projectPath).toMatch(/test-app$/);
  });

  it('should build context from prompt results only', () => {
    const promptResults = {
      projectName: 'prompt-app',
      sdk: 'tusky',
      framework: 'vue',
      useCase: 'gallery',
      analytics: false,
      tailwind: true,
    };

    const context = buildContext({}, promptResults);

    expect(context.projectName).toBe('prompt-app');
    expect(context.sdk).toBe('tusky');
    expect(context.framework).toBe('vue');
    expect(context.useCase).toBe('gallery');
    expect(context.analytics).toBe(false);
    expect(context.tailwind).toBe(true);
  });

  it('should prioritize args over prompt results', () => {
    const args = {
      projectName: 'args-app',
      sdk: 'mysten',
    };

    const promptResults = {
      projectName: 'prompt-app',
      sdk: 'tusky',
      framework: 'react',
      useCase: 'simple-upload',
      analytics: true,
      tailwind: true,
    };

    const context = buildContext(args, promptResults);

    expect(context.projectName).toBe('args-app');
    expect(context.sdk).toBe('mysten');
    expect(context.framework).toBe('react');
    expect(context.useCase).toBe('simple-upload');
  });

  it('should convert analytics to boolean correctly', () => {
    const base = { sdk: 'mysten', framework: 'react', useCase: 'simple-upload' };
    expect(buildContext({ projectName: 'test', analytics: true, ...base }, {}).analytics).toBe(true);
    expect(buildContext({ projectName: 'test', analytics: false, ...base }, {}).analytics).toBe(false);
    expect(buildContext({ projectName: 'test', analytics: 1, ...base }, {}).analytics).toBe(true);
    expect(buildContext({ projectName: 'test', analytics: 0, ...base }, {}).analytics).toBe(false);
    expect(buildContext({ projectName: 'test', analytics: 'yes', ...base }, {}).analytics).toBe(true);
    expect(buildContext({ projectName: 'test', analytics: '', ...base }, {}).analytics).toBe(false);
  });

  it('should convert tailwind to boolean correctly', () => {
    const base = { sdk: 'mysten', framework: 'react', useCase: 'simple-upload' };
    expect(buildContext({ projectName: 'test', tailwind: true, ...base }, {}).tailwind).toBe(true);
    expect(buildContext({ projectName: 'test', tailwind: false, ...base }, {}).tailwind).toBe(false);
    expect(buildContext({ projectName: 'test', tailwind: 1, ...base }, {}).tailwind).toBe(true);
    expect(buildContext({ projectName: 'test', tailwind: 0, ...base }, {}).tailwind).toBe(false);
  });

  it('should call detectPackageManager', () => {
    buildContext({ projectName: 'test', sdk: 'mysten', framework: 'react', useCase: 'simple-upload' }, {});
    expect(detectPmModule.detectPackageManager).toHaveBeenCalled();
  });

  it('should generate absolute projectPath', () => {
    const context = buildContext({ projectName: 'test-app', sdk: 'mysten', framework: 'react', useCase: 'simple-upload' }, {});
    expect(context.projectPath).toContain('test-app');
    expect(context.projectPath.length).toBeGreaterThan('test-app'.length);
  });

  it('should handle partial args and prompts', () => {
    const context = buildContext(
      { projectName: 'partial' },
      { sdk: 'hibernuts', framework: 'react', useCase: 'simple-upload' }
    );

    expect(context.projectName).toBe('partial');
    expect(context.sdk).toBe('hibernuts');
    expect(context.framework).toBe('react');
  });
});
