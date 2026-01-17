import { describe, it, expect } from 'vitest';
import { COMPATIBILITY_MATRIX, SDK_METADATA } from './matrix.js';

describe('COMPATIBILITY_MATRIX', () => {
  it('should have entries for all SDKs', () => {
    expect(COMPATIBILITY_MATRIX).toHaveProperty('mysten');
    expect(COMPATIBILITY_MATRIX).toHaveProperty('tusky');
    expect(COMPATIBILITY_MATRIX).toHaveProperty('hibernuts');
  });

  it('should have frameworks and useCases for each SDK', () => {
    Object.values(COMPATIBILITY_MATRIX).forEach((sdk) => {
      expect(sdk).toHaveProperty('frameworks');
      expect(sdk).toHaveProperty('useCases');
      expect(Array.isArray(sdk.frameworks)).toBe(true);
      expect(Array.isArray(sdk.useCases)).toBe(true);
    });
  });

  it('should have mysten support all frameworks', () => {
    expect(COMPATIBILITY_MATRIX.mysten.frameworks).toEqual(['react', 'vue', 'plain-ts']);
  });

  it('should have mysten support all use cases', () => {
    expect(COMPATIBILITY_MATRIX.mysten.useCases).toEqual(['simple-upload', 'gallery', 'defi-nft']);
  });

  it('should have tusky support limited use cases', () => {
    expect(COMPATIBILITY_MATRIX.tusky.useCases).toEqual(['simple-upload', 'gallery']);
    expect(COMPATIBILITY_MATRIX.tusky.useCases).not.toContain('defi-nft');
  });

  it('should have hibernuts with most restricted support', () => {
    expect(COMPATIBILITY_MATRIX.hibernuts.frameworks).toEqual(['react', 'plain-ts']);
    expect(COMPATIBILITY_MATRIX.hibernuts.useCases).toEqual(['simple-upload']);
  });

  it('should not have hibernuts support vue', () => {
    expect(COMPATIBILITY_MATRIX.hibernuts.frameworks).not.toContain('vue');
  });

  it('should not have hibernuts support gallery or defi-nft', () => {
    expect(COMPATIBILITY_MATRIX.hibernuts.useCases).not.toContain('gallery');
    expect(COMPATIBILITY_MATRIX.hibernuts.useCases).not.toContain('defi-nft');
  });
});

describe('SDK_METADATA', () => {
  it('should have metadata for all SDKs', () => {
    expect(SDK_METADATA).toHaveProperty('mysten');
    expect(SDK_METADATA).toHaveProperty('tusky');
    expect(SDK_METADATA).toHaveProperty('hibernuts');
  });

  it('should have name, description, and docs for each SDK', () => {
    Object.values(SDK_METADATA).forEach((metadata) => {
      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('docs');
      expect(typeof metadata.name).toBe('string');
      expect(typeof metadata.description).toBe('string');
      expect(typeof metadata.docs).toBe('string');
    });
  });

  it('should have valid package names', () => {
    expect(SDK_METADATA.mysten.name).toBe('@mysten/walrus');
    expect(SDK_METADATA.tusky.name).toBe('@tusky-io/ts-sdk');
    expect(SDK_METADATA.hibernuts.name).toBe('@hibernuts/walrus-sdk');
  });

  it('should have URLs in docs field', () => {
    Object.values(SDK_METADATA).forEach((metadata) => {
      expect(metadata.docs).toMatch(/^https?:\/\//);
    });
  });

  it('should have meaningful descriptions', () => {
    expect(SDK_METADATA.mysten.description.length).toBeGreaterThan(10);
    expect(SDK_METADATA.tusky.description.length).toBeGreaterThan(10);
    expect(SDK_METADATA.hibernuts.description.length).toBeGreaterThan(10);
  });
});
