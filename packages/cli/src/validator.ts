import path from 'node:path';
import { Context, ValidationResult } from './types.js';
import { COMPATIBILITY_MATRIX } from './matrix.js';

export function validateContext(context: Context): ValidationResult {
  const { sdk, framework, useCase } = context;

  // Check framework compatibility
  if (!(COMPATIBILITY_MATRIX[sdk].frameworks as readonly string[]).includes(framework)) {
    return {
      valid: false,
      error: `SDK "${sdk}" is incompatible with framework "${framework}"`,
      suggestion: `Compatible frameworks for ${sdk}: ${COMPATIBILITY_MATRIX[sdk].frameworks.join(', ')}`,
    };
  }

  // Check use case compatibility
  if (!(COMPATIBILITY_MATRIX[sdk].useCases as readonly string[]).includes(useCase)) {
    return {
      valid: false,
      error: `SDK "${sdk}" does not support use case "${useCase}"`,
      suggestion: `Supported use cases for ${sdk}: ${COMPATIBILITY_MATRIX[sdk].useCases.join(', ')}`,
    };
  }

  return { valid: true };
}

export function validateProjectName(name: string): boolean | string {
  // Check for empty string
  if (!name || name.trim().length === 0) {
    return 'Project name cannot be empty';
  }

  // npm package name length limit (214 characters)
  if (name.length > 214) {
    return 'Project name must be 214 characters or less';
  }

  // Prevent path traversal
  if (name.includes('..') || name.includes('/') || name.includes('\\')) {
    return 'Project name cannot contain path separators';
  }

  // Prevent absolute paths
  if (path.isAbsolute(name)) {
    return 'Project name cannot be an absolute path';
  }

  // npm package naming rules
  if (!/^[a-z0-9-]+$/.test(name)) {
    return 'Project name must contain only lowercase letters, numbers, and hyphens';
  }

  if (name.startsWith('-') || name.endsWith('-')) {
    return 'Project name cannot start or end with a hyphen';
  }

  return true;
}
