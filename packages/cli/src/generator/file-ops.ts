import fs from 'fs-extra';
import path from 'node:path';

export interface EnvCopyResult {
  created: boolean;
  reason?: 'no-source' | 'already-exists';
}

/**
 * Recursively copy directory, excluding certain files
 */
export async function copyDirectory(
  src: string,
  dest: string,
  exclude: string[] = ['node_modules', '.git', 'dist']
): Promise<number> {
  let filesCreated = 0;

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (exclude.includes(entry.name)) continue;

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await fs.ensureDir(destPath);
      filesCreated += await copyDirectory(srcPath, destPath, exclude);
    } else {
      await fs.copy(srcPath, destPath, { overwrite: true });
      filesCreated++;
    }
  }

  return filesCreated;
}

/**
 * Check if directory is empty
 */
export async function isDirectoryEmpty(dir: string): Promise<boolean> {
  const exists = await fs.pathExists(dir);
  if (!exists) return true;

  const entries = await fs.readdir(dir);
  return entries.length === 0;
}

/**
 * Create directory if it doesn't exist
 */
export async function ensureDirectory(dir: string): Promise<void> {
  await fs.ensureDir(dir);
}

/**
 * Copy .env.example to .env if it doesn't exist
 */
export async function copyEnvFile(targetDir: string): Promise<EnvCopyResult> {
  const envExamplePath = path.join(targetDir, '.env.example');
  const envPath = path.join(targetDir, '.env');

  // Check if .env.example exists
  const hasExample = await fs.pathExists(envExamplePath);
  if (!hasExample) {
    return { created: false, reason: 'no-source' };
  }

  // Check if .env already exists
  const hasEnv = await fs.pathExists(envPath);
  if (hasEnv) {
    return { created: false, reason: 'already-exists' };
  }

  // Copy file
  await fs.copy(envExamplePath, envPath);
  return { created: true };
}
