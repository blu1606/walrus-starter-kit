#!/usr/bin/env node

import { program } from 'commander';
import { runPrompts } from './prompts.js';
import { buildContext } from './context.js';
import { validateContext } from './validator.js';
import { logger } from './utils/logger.js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, '../package.json'), 'utf-8')
);

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
  .option('--analytics', 'Include Blockberry analytics', false)
  .option('--no-tailwind', 'Exclude Tailwind CSS')
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

      // TODO: Phase 7 - Generate template
      logger.info('🏗️  Template generation coming in Phase 7!');
    } catch (error) {
      // Sanitize error messages - don't expose stack traces to users
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      logger.error(`Failed to create project: ${message}`);
      process.exit(1);
    }
  });

// Handle cleanup on abort
process.on('SIGINT', () => {
  logger.warn('\n\nOperation cancelled by user.');
  // TODO: Clean up partial state
  process.exit(0);
});

program.parse();
