#!/usr/bin/env node

import { program } from 'commander';
import { runPrompts } from './prompts.js';
import { buildContext } from './context.js';
import { validateContext } from './validator.js';
import { logger } from './utils/logger.js';
import { generateProject } from './generator/index.js';
import { runPostInstall } from './post-install/index.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fs from 'fs-extra';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

// Track current generation path for cleanup on interrupt
let currentGenerationPath: string | null = null;

program
  .name('create-walrus-app')
  .description('Interactive CLI for scaffolding Walrus applications')
  .version(packageJson.version)
  .argument('[project-name]', 'Project directory name')
  .option('--sdk <sdk>', 'SDK to use (mysten | tusky | hibernuts)')
  .option('--framework <framework>', 'Framework (react | vue | plain-ts)')
  .option(
    '--use-case <use-case>',
    'Use case (simple-upload | gallery | defi-nft)'
  )
  // TODO: Re-enable when templates are implemented
  // .option('--analytics', 'Include Blockberry analytics', false)
  // .option('--no-tailwind', 'Exclude Tailwind CSS')
  .option('--skip-install', 'Skip dependency installation', false)
  .option('--skip-git', '[DEPRECATED] No longer used - git initialization removed', false)
  .option('--skip-validation', 'Skip project validation', false)
  .option(
    '-p, --package-manager <pm>',
    'Package manager to use (npm | pnpm | yarn | bun)'
  )
  .action(async (projectNameArg, options) => {
    try {
      logger.info('🚀 Welcome to Walrus Starter Kit!');

      // Build initial context from args
      const initialContext = {
        projectName: projectNameArg,
        ...options,
      };

      // Run interactive prompts (skips questions with provided args)
      const promptResults = await runPrompts(initialContext);

      // Build final context
      const context = buildContext(options, promptResults);

      // Validate compatibility
      const validation = validateContext(context);
      if (!validation.valid) {
        logger.error(validation.error!);
        if (validation.suggestion) {
          logger.info(`💡 ${validation.suggestion}`);
        }
        process.exit(1);
      }

      logger.success('✓ Configuration valid!');
      console.log('\nContext:', context);

      // Track generation path for cleanup on interrupt
      currentGenerationPath = context.projectPath;

      // Generate project
      logger.info('\n🏗️  Generating your Walrus application...\n');

      const result = await generateProject({
        context,
        templateDir: join(__dirname, '../templates'),
        targetDir: context.projectPath,
      });

      // Clear tracking after completion
      currentGenerationPath = null;

      if (!result.success) {
        logger.error('❌ Project generation failed');
        process.exit(1);
      }

      // Post-install tasks
      const postInstallResult = await runPostInstall({
        context,
        projectPath: context.projectPath,
        skipInstall: options.skipInstall,
        skipGit: options.skipGit,
        skipValidation: options.skipValidation,
      });

      if (!postInstallResult.success) {
        logger.warn('⚠️  Post-install tasks completed with warnings');
      }
    } catch (error) {
      // Sanitize error messages - don't expose stack traces to users
      const message =
        error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Failed to create project: ${message}`);
      process.exit(1);
    }
  });

// Handle cleanup on abort
process.on('SIGINT', async () => {
  logger.warn('\n\nOperation cancelled by user.');

  // Clean up partial generation if in progress
  if (currentGenerationPath) {
    logger.info(`🧹 Cleaning up partial generation: ${currentGenerationPath}`);
    try {
      await fs.remove(currentGenerationPath);
      logger.success('✓ Cleanup completed');
    } catch (error) {
      logger.error(`Failed to cleanup: ${error}`);
      logger.warn(`⚠️  Please manually delete: ${currentGenerationPath}`);
    }
  }

  process.exit(0);
});

program.parse();
