export type SDK = 'mysten' | 'tusky' | 'hibernuts';
export type Framework = 'react' | 'vue' | 'plain-ts';
export type UseCase = 'simple-upload' | 'gallery' | 'defi-nft';
export type PackageManager = 'npm' | 'pnpm' | 'yarn' | 'bun';

export interface Context {
  projectName: string;
  projectPath: string;
  sdk: SDK;
  framework: Framework;
  useCase: UseCase;
  analytics: boolean;
  tailwind: boolean;
  packageManager: PackageManager;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}
