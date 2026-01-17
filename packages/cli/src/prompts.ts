import prompts from 'prompts';
import { Context } from './types.js';
import { COMPATIBILITY_MATRIX, SDK_METADATA } from './matrix.js';
import { validateProjectName } from './validator.js';

export async function runPrompts(
  initial: Partial<Context> = {}
): Promise<Partial<Context>> {
  const response = await prompts(
    [
      {
        type: 'text',
        name: 'projectName',
        message: 'Project name:',
        initial: initial.projectName || 'my-walrus-app',
        validate: validateProjectName,
      },
      {
        type: 'select',
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
        type: 'select',
        name: 'framework',
        message: 'Choose framework:',
        choices: (prev) => {
          const frameworks =
            COMPATIBILITY_MATRIX[prev as keyof typeof COMPATIBILITY_MATRIX]
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
        type: 'select',
        name: 'useCase',
        message: 'Choose use case:',
        choices: (prev, answers) => {
          const useCases =
            COMPATIBILITY_MATRIX[answers.sdk as keyof typeof COMPATIBILITY_MATRIX]
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
        type: 'confirm',
        name: 'analytics',
        message: 'Include Blockberry analytics?',
        initial: false,
      },
      {
        type: 'confirm',
        name: 'tailwind',
        message: 'Include Tailwind CSS?',
        initial: true,
      },
    ],
    {
      onCancel: () => {
        console.log('\nOperation cancelled.');
        process.exit(0);
      },
    }
  );

  // Handle Ctrl+C
  if (!response.projectName) {
    console.log('\nOperation cancelled.');
    process.exit(0);
  }

  return response;
}
