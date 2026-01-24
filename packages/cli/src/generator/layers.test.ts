import { describe, it, expect } from 'vitest';
import { getPresetName, resolvePresetPath } from './layers.js';
import type { Context } from '../types.js';
import path from 'node:path';

describe('getPresetName', () => {
  it('should generate basic preset name', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'simple-upload',
      analytics: false,
      tailwind: false,
      useZkLogin: false,
      packageManager: 'pnpm',
    };

    const presetName = getPresetName(context);
    expect(presetName).toBe('react-mysten-simple-upload');
  });

  it('should include tailwind in preset name', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'gallery',
      analytics: false,
      tailwind: true,
      useZkLogin: false,
      packageManager: 'pnpm',
    };

    const presetName = getPresetName(context);
    expect(presetName).toBe('react-mysten-gallery-tailwind');
  });

  it('should include analytics in preset name', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'vue',
      useCase: 'defi-nft',
      analytics: true,
      tailwind: false,
      useZkLogin: false,
      packageManager: 'npm',
    };

    const presetName = getPresetName(context);
    expect(presetName).toBe('vue-mysten-defi-nft-analytics');
  });

  it('should include both optional features in alphabetical order', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'plain-ts',
      useCase: 'simple-upload',
      analytics: true,
      tailwind: true,
      useZkLogin: false,
      packageManager: 'yarn',
    };

    const presetName = getPresetName(context);
    // analytics comes before tailwind alphabetically
    expect(presetName).toBe('plain-ts-mysten-simple-upload-analytics-tailwind');
  });

  it('should include enoki in preset name when useZkLogin is true', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'simple-upload',
      analytics: false,
      tailwind: false,
      useZkLogin: true,
      packageManager: 'pnpm',
    };

    const presetName = getPresetName(context);
    expect(presetName).toBe('react-mysten-simple-upload-enoki');
  });

  it('should sort all features alphabetically', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'gallery',
      analytics: true,
      tailwind: true,
      useZkLogin: true,
      packageManager: 'pnpm',
    };

    const presetName = getPresetName(context);
    // alphabetical: analytics, enoki, tailwind
    expect(presetName).toBe('react-mysten-gallery-analytics-enoki-tailwind');
  });
});

describe('resolvePresetPath', () => {
  it('should resolve correct preset path', () => {
    const context: Context = {
      projectName: 'test-app',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'simple-upload',
      analytics: false,
      tailwind: false,
      useZkLogin: false,
      packageManager: 'pnpm',
    };

    const presetPath = resolvePresetPath(context);

    expect(presetPath).toContain('templates');
    expect(presetPath).toContain('react-mysten-simple-upload');
    expect(path.isAbsolute(presetPath)).toBe(true);
  });

  it('should prevent path traversal', () => {
    const context: Context = {
      projectName: '../../../etc/passwd',
      projectPath: '/path/to/test-app',
      sdk: 'mysten',
      framework: 'react',
      useCase: 'simple-upload',
      analytics: false,
      tailwind: false,
      useZkLogin: false,
      packageManager: 'pnpm',
    };

    // Should not throw - projectName doesn't affect preset path
    expect(() => resolvePresetPath(context)).not.toThrow();

    const presetPath = resolvePresetPath(context);
    expect(presetPath).toContain('templates');
  });
});
