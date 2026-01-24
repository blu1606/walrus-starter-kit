import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Context } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Presets are in packages/templates (separate package)
const PRESETS_ROOT = path.join(__dirname, '../../../templates');

/**
 * Validate that a template path is within the templates root (prevent path traversal)
 */
function validateTemplatePath(templatePath: string): void {
  const normalized = path.resolve(templatePath);
  const root = path.resolve(PRESETS_ROOT);

  if (!normalized.startsWith(root)) {
    throw new Error(
      `Invalid template path: ${templatePath} is outside templates root`
    );
  }
}

/**
 * Generate preset name from context
 * Format: {framework}-{sdk}-{useCase}[-optional-features]
 *
 * Examples:
 * - react-mysten-simple-upload
 * - react-mysten-gallery-enoki
 * - vue-mysten-gallery-tailwind
 */
export function getPresetName(context: Context): string {
  const parts = [context.framework, context.sdk, context.useCase];

  // Add optional features in alphabetical order
  const optionalFeatures: string[] = [];

  if (context.analytics) {
    optionalFeatures.push('analytics');
  }

  if (context.useZkLogin) {
    optionalFeatures.push('enoki');
  }

  if (context.tailwind) {
    optionalFeatures.push('tailwind');
  }

  // Sort for consistency
  optionalFeatures.sort();

  return [...parts, ...optionalFeatures].join('-');
}

/**
 * Resolve preset path from context
 * Returns the absolute path to the preset directory
 */
export function resolvePresetPath(context: Context): string {
  const presetName = getPresetName(context);
  const presetPath = path.join(PRESETS_ROOT, presetName);

  // Validate path for security
  validateTemplatePath(presetPath);

  return presetPath;
}
