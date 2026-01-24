import { SDK, Framework, UseCase, ValidationResult } from './types.js';

export interface Selection {
  sdk: SDK;
  framework: Framework;
  useCase: UseCase;
  useZkLogin?: boolean;
}

export function isCompatible(selection: Selection): ValidationResult {
  const { sdk, framework, useCase, useZkLogin } = selection;

  if (sdk === 'mysten') {
    if (!['react'].includes(framework)) {
      return {
        valid: false,
        error: `SDK "mysten" is currently only stable with "react" framework.`,
        suggestion:
          'Please select "react" or wait for "vue" and "plain-ts" support.',
      };
    }
  } else {
    return {
      valid: false,
      error: `SDK "${sdk}" is currently planned and not yet available.`,
      suggestion: 'Please select "mysten" SDK.',
    };
  }

  if (useZkLogin) {
    if (sdk !== 'mysten' || framework !== 'react') {
      return {
        valid: false,
        error: 'zkLogin (Enoki) requires "mysten" SDK and "react" framework.',
        suggestion:
          'Please select "mysten" SDK and "react" framework to use zkLogin.',
      };
    }
  }

  if (useCase === 'gallery') {
    if (framework !== 'react') {
      return {
        valid: false,
        error:
          'The "gallery" use case requires a UI framework (currently "react").',
        suggestion: 'Please select "react" framework for the gallery use case.',
      };
    }
  }

  if (useCase === 'defi-nft') {
    return {
      valid: false,
      error: 'The "defi-nft" use case is currently planned.',
      suggestion: 'Please select "simple-upload" or "gallery".',
    };
  }

  return { valid: true };
}

export function isStable(
  type: 'sdk' | 'framework' | 'useCase',
  value: string
): boolean {
  switch (type) {
    case 'sdk':
      return value === 'mysten';
    case 'framework':
      return value === 'react';
    case 'useCase':
      return ['simple-upload', 'gallery'].includes(value);
    default:
      return false;
  }
}
