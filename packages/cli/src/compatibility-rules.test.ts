import { describe, it, expect } from 'vitest';
import { isCompatible, isStable } from './compatibility-rules.js';

describe('compatibility-rules', () => {
  describe('isCompatible', () => {
    it('should return valid for stable mysten + react + simple-upload', () => {
      const result = isCompatible({
        sdk: 'mysten',
        framework: 'react',
        useCase: 'simple-upload',
      });
      expect(result.valid).toBe(true);
    });

    it('should return valid for stable mysten + react + gallery', () => {
      const result = isCompatible({
        sdk: 'mysten',
        framework: 'react',
        useCase: 'gallery',
      });
      expect(result.valid).toBe(true);
    });

    it('should return valid for mysten + react + simple-upload + zkLogin', () => {
      const result = isCompatible({
        sdk: 'mysten',
        framework: 'react',
        useCase: 'simple-upload',
        useZkLogin: true,
      });
      expect(result.valid).toBe(true);
    });

    it('should return invalid for planned sdk (tusky)', () => {
      const result = isCompatible({
        sdk: 'tusky',
        framework: 'react',
        useCase: 'simple-upload',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('currently planned');
    });

    it('should return invalid for planned framework (vue)', () => {
      const result = isCompatible({
        sdk: 'mysten',
        framework: 'vue',
        useCase: 'simple-upload',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('currently only stable with "react"');
    });

    it('should return invalid for planned use case (defi-nft)', () => {
      const result = isCompatible({
        sdk: 'mysten',
        framework: 'react',
        useCase: 'defi-nft',
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('currently planned');
    });

    it('should return invalid for enoki without react', () => {
      const result = isCompatible({
        sdk: 'mysten',
        framework: 'plain-ts',
        useCase: 'simple-upload',
        useZkLogin: true,
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('currently only stable with "react"');
    });
  });

  describe('isStable', () => {
    it('should identify stable sdk', () => {
      expect(isStable('sdk', 'mysten')).toBe(true);
      expect(isStable('sdk', 'tusky')).toBe(false);
    });

    it('should identify stable framework', () => {
      expect(isStable('framework', 'react')).toBe(true);
      expect(isStable('framework', 'vue')).toBe(false);
    });

    it('should identify stable useCase', () => {
      expect(isStable('useCase', 'simple-upload')).toBe(true);
      expect(isStable('useCase', 'gallery')).toBe(true);
      expect(isStable('useCase', 'defi-nft')).toBe(false);
    });
  });
});
