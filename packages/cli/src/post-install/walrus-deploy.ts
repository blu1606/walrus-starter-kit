import prompts from 'prompts';
import { spawn } from 'cross-spawn';
import { join } from 'node:path';
import { existsSync, chmodSync } from 'node:fs';
import { logger } from '../utils/logger.js';
import type { Context } from '../types.js';

/**
 * Prompts user to setup Walrus Sites deployment
 * Runs setup-walrus-deploy.sh script if user confirms
 */
export async function setupWalrusDeploy(
  projectPath: string,
  _context: Context
): Promise<void> {
  try {
    const isInteractive = Boolean(process.stdin.isTTY);

    // Skip in non-interactive mode
    if (!isInteractive) {
      return;
    }

    console.log(''); // Newline for better spacing
    const response = await prompts(
      {
        type: 'confirm',
        name: 'setup',
        message: 'Setup Walrus Sites deployment? (testnet)',
        initial: false,
      },
      {
        onCancel: () => {
          logger.info('Skipping Walrus deployment setup');
          return false;
        },
      }
    );

    if (!response.setup) {
      logger.info('You can setup later by running: pnpm setup-walrus-deploy');
      return;
    }

    // Run the setup script
    const scriptPath = join(projectPath, 'scripts', 'setup-walrus-deploy.sh');

    if (!existsSync(scriptPath)) {
      logger.warn(
        '⚠️  setup-walrus-deploy.sh not found in project scripts/'
      );
      return;
    }

    // Make script executable (Unix/macOS)
    try {
      chmodSync(scriptPath, 0o755);
    } catch (error) {
      // Ignore on Windows
    }

    logger.info('🦭 Running Walrus deployment setup...\n');

    // Execute setup script
    const child = spawn('bash', [scriptPath, projectPath], {
      cwd: projectPath,
      stdio: 'inherit', // Show output in real-time
      shell: true,
    });

    await new Promise<void>((resolve, reject) => {
      child.on('close', (code) => {
        if (code === 0) {
          logger.success('\n✅ Walrus deployment setup complete!');
          resolve();
        } else {
          logger.warn(
            `\n⚠️  Setup exited with code ${code}. You can retry with: pnpm setup-walrus-deploy`
          );
          resolve(); // Don't fail the whole installation
        }
      });

      child.on('error', (error) => {
        logger.error(`Setup script error: ${error.message}`);
        reject(error);
      });
    });
  } catch (error) {
    // Non-fatal: log and continue
    logger.warn('⚠️  Walrus deployment setup skipped due to error');
    if (error instanceof Error) {
      logger.warn(error.message);
    }
  }
}
