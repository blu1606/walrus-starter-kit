import prompts from 'prompts';
import { Context } from './types.js';
import { COMPATIBILITY_MATRIX, SDK_METADATA } from './matrix.js';
import { validateProjectName } from './validator.js';
import { detectPackageManager } from './utils/detect-pm.js';

export async function runPrompts(
  initial: Partial<Context> = {}
): Promise<Partial<Context>> {
  const response = await prompts(
    [
      {
        type: initial.projectName ? null : 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: initial.projectName || 'my-walrus-app',
        validate: validateProjectName,
      },
      {
        type: initial.sdk ? null : 'select',
        name: 'sdk',
        message: 'Choose Walrus SDK:',
        choices: [
          {
            title: `${SDK_METADATA.mysten.name} - ${SDK_METADATA.mysten.description}`,
            value: 'mysten',
          },
          {
            title: `${SDK_METADATA.tusky.name} - ${SDK_METADATA.tusky.description}`,
            value: 'tusky',
          },
          {
            title: `${SDK_METADATA.hibernuts.name} - ${SDK_METADATA.hibernuts.description}`,
            value: 'hibernuts',
          },
        ],
        initial: 0,
      },
      {
        type: initial.framework ? null : 'select',
        name: 'framework',
        message: 'Choose framework:',
        choices: (prev) => {
          const sdk = initial.sdk || prev;
          const frameworks =
            COMPATIBILITY_MATRIX[sdk as keyof typeof COMPATIBILITY_MATRIX]
              .frameworks;
          return frameworks.map((f) => ({
            title:
              f === 'react'
                ? 'React + Vite'
                : f === 'vue'
                  ? 'Vue + Vite'
                  : 'Plain TypeScript',
            value: f,
          }));
        },
      },
      {
        type: initial.useCase ? null : 'select',
        name: 'useCase',
        message: 'Choose use case:',
        choices: (prev, answers) => {
          const sdk = initial.sdk || answers.sdk;
          const useCases =
            COMPATIBILITY_MATRIX[sdk as keyof typeof COMPATIBILITY_MATRIX]
              .useCases;
          return useCases.map((uc) => ({
            title:
              uc === 'simple-upload'
                ? 'Simple Upload (Single file)'
                : uc === 'gallery'
                  ? 'File Gallery (Multiple files)'
                  : 'DeFi/NFT Metadata',
            value: uc,
          }));
        },
      },
      {
        type: initial.analytics !== undefined ? null : 'confirm',
        name: 'analytics',
        message: 'Include Blockberry analytics?',
        initial: false,
      },
      {
        type: initial.tailwind !== undefined ? null : 'confirm',
        name: 'tailwind',
        message: 'Include Tailwind CSS?',
        initial: true,
      },
      {
        type: initial.packageManager ? null : 'select',
        name: 'packageManager',
        message: 'Choose package manager:',
        choices: [
          { title: 'npm', value: 'npm' },
          { title: 'pnpm', value: 'pnpm' },
          { title: 'yarn', value: 'yarn' },
          { title: 'bun', value: 'bun' },
        ],
        initial: () => {
          const detected = detectPackageManager();
          const index = ['npm', 'pnpm', 'yarn', 'bun'].indexOf(detected);
          return index !== -1 ? index : 0;
        },
      },
    ],
    {
      onCancel: () => {
        console.log('\nOperation cancelled.');
        process.exit(0);
      },
    }
  );

  if (!response.projectName && !initial.projectName) {
    console.log('\nOperation cancelled.');
    process.exit(0);
  }

  return { ...initial, ...response };
}
