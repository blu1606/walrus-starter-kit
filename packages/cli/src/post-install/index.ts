import { logger } from '../utils/logger.js';
import { installDependencies } from './package-manager.js';
import { validateProject } from './validator.js';
import { displaySuccess, displayError } from './messages.js';
import { setupWalrusDeploy } from './walrus-deploy.js';
import type { Context } from '../types.js';

export interface PostInstallOptions {
  context: Context;
  projectPath: string;
  skipInstall?: boolean;
  skipGit?: boolean;
  skipValidation?: boolean;
}

export interface PostInstallResult {
  success: boolean;
  installed: boolean;
  validated: boolean;
  error?: Error;
}

export async function runPostInstall(
  options: PostInstallOptions
): Promise<PostInstallResult> {
  const {
    context,
    projectPath,
    skipInstall = false,
    skipValidation = false,
  } = options;

  const result: PostInstallResult = {
    success: true,
    installed: false,
    validated: false,
  };

  try {
    // Step 1: Install dependencies
    if (!skipInstall) {
      const installResult = await installDependencies(
        projectPath,
        context.packageManager
      );
      result.installed = installResult.success;

      if (!installResult.success) {
        logger.warn(
          '⚠️  Dependency installation failed, but project was created'
        );
        logger.info('💡 You can install manually by running:');
        logger.info(`   cd ${context.projectName}`);
        logger.info(`   ${context.packageManager} install`);
      }
    }

    // Step 2: Validate project
    if (!skipValidation && result.installed) {
      const validationResult = await validateProject(projectPath);
      result.validated = validationResult.valid;

      if (!validationResult.valid) {
        logger.warn('⚠️  Project validation failed:');
        validationResult.errors.forEach((err) => logger.warn(`   - ${err}`));
      }
    }

    // Step 3: Setup Walrus deployment (interactive prompt)
    if (result.installed) {
      await setupWalrusDeploy(projectPath, context);
    }

    // Display success message
    displaySuccess(context);

    return result;
  } catch (error) {
    result.success = false;
    result.error = error as Error;

    displayError(error as Error, context);

    return result;
  }
}
