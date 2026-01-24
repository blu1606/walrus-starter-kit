import path from 'node:path';
import { Context } from './types.js';
import { detectPackageManager } from './utils/detect-pm.js';

export function buildContext(
  args: Record<string, unknown>,
  promptResults: Record<string, unknown>
): Context {
  const merged = { ...promptResults, ...args }; // Args override prompts

  // Runtime validation before type assertions
  const projectName = merged.projectName;
  if (typeof projectName !== 'string' || !projectName) {
    throw new Error('Project name is required and must be a string');
  }

  const sdk = merged.sdk;
  if (sdk !== 'mysten' && sdk !== 'tusky' && sdk !== 'hibernuts') {
    throw new Error(
      `Invalid SDK: ${sdk}. Must be one of: mysten, tusky, hibernuts`
    );
  }

  const framework = merged.framework;
  if (
    framework !== 'react' &&
    framework !== 'vue' &&
    framework !== 'plain-ts'
  ) {
    throw new Error(
      `Invalid framework: ${framework}. Must be one of: react, vue, plain-ts`
    );
  }

  const useCase = merged.useCase;
  if (
    useCase !== 'simple-upload' &&
    useCase !== 'gallery' &&
    useCase !== 'defi-nft'
  ) {
    throw new Error(
      `Invalid use case: ${useCase}. Must be one of: simple-upload, gallery, defi-nft`
    );
  }

  const packageManager =
    (merged.packageManager as string) || detectPackageManager();
  if (
    packageManager !== 'npm' &&
    packageManager !== 'pnpm' &&
    packageManager !== 'yarn' &&
    packageManager !== 'bun'
  ) {
    throw new Error(
      `Invalid package manager: ${packageManager}. Must be one of: npm, pnpm, yarn, bun`
    );
  }

  return {
    projectName,
    projectPath: path.resolve(process.cwd(), projectName),
    sdk,
    framework,
    useCase,
    // Temporarily disabled until templates are implemented
    analytics: false, // Boolean(merged.analytics),
    tailwind: false, // Boolean(merged.tailwind),
    useZkLogin: Boolean(merged.useZkLogin),
    packageManager: packageManager as Context['packageManager'],
  };
}
