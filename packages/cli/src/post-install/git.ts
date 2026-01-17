import spawn from 'cross-spawn';
import fs from 'fs-extra';
import path from 'node:path';
import { logger } from '../utils/logger.js';

/**
 * @deprecated Git initialization has been removed from create-walrus-app.
 * Users should manually initialize git if needed: `git init && git add . && git commit -m "Initial commit"`
 *
 * This file is kept for backwards compatibility but is no longer used by the CLI.
 */

export interface GitResult {
  success: boolean;
  error?: Error;
}

/**
 * Check if git is available
 */
async function isGitAvailable(): Promise<boolean> {
  return new Promise((resolve) => {
    const child = spawn('git', ['--version'], { stdio: 'ignore' });
    child.on('close', (code: number | null) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

/**
 * Initialize git repository
 * @deprecated Git initialization has been removed from create-walrus-app post-install flow.
 */
export async function initializeGit(projectPath: string): Promise<GitResult> {
  // Check if git is available
  if (!(await isGitAvailable())) {
    logger.warn('⚠️  Git not found, skipping initialization');
    return { success: false };
  }

  // Check if already a git repo
  if (await fs.pathExists(path.join(projectPath, '.git'))) {
    logger.info('📝 Git repository already exists');
    return { success: true };
  }

  logger.info('📝 Initializing git repository...');

  // Run git init
  return new Promise((resolve) => {
    const child = spawn('git', ['init'], {
      cwd: projectPath,
      stdio: 'ignore',
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        logger.success('✓ Git repository initialized');
        resolve({ success: true });
      } else {
        resolve({
          success: false,
          error: new Error(`git init failed with code ${code}`),
        });
      }
    });

    child.on('error', (error: Error) => {
      resolve({ success: false, error });
    });
  });
}

/**
 * Create initial commit
 * @deprecated Git initialization has been removed from create-walrus-app post-install flow.
 */
export async function createInitialCommit(
  projectPath: string
): Promise<GitResult> {
  if (!(await fs.pathExists(path.join(projectPath, '.git')))) {
    return { success: false, error: new Error('Not a git repository') };
  }

  logger.info('📝 Creating initial commit...');

  // Stage all files
  return new Promise((resolve) => {
    const addChild = spawn('git', ['add', '.'], {
      cwd: projectPath,
      stdio: 'ignore',
    });

    addChild.on('close', (code: number | null) => {
      if (code !== 0) {
        resolve({ success: false, error: new Error('git add failed') });
        return;
      }

      // Create commit
      const commitChild = spawn(
        'git',
        ['commit', '-m', 'chore: initial commit from create-walrus-app'],
        {
          cwd: projectPath,
          stdio: 'ignore',
        }
      );

      commitChild.on('close', (commitCode: number | null) => {
        if (commitCode === 0) {
          logger.success('✓ Initial commit created');
          resolve({ success: true });
        } else {
          resolve({ success: false, error: new Error('git commit failed') });
        }
      });

      commitChild.on('error', (error: Error) => {
        resolve({ success: false, error });
      });
    });

    addChild.on('error', (error: Error) => {
      resolve({ success: false, error });
    });
  });
}
