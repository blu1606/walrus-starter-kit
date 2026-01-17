export const COMPATIBILITY_MATRIX = {
  mysten: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery', 'defi-nft'],
  },
  tusky: {
    frameworks: ['react', 'vue', 'plain-ts'],
    useCases: ['simple-upload', 'gallery'],
  },
  hibernuts: {
    frameworks: ['react', 'plain-ts'],
    useCases: ['simple-upload'],
  },
} as const;

export const SDK_METADATA = {
  mysten: {
    name: '@mysten/walrus',
    description: 'Official Mysten Labs SDK (Testnet stable)',
    docs: 'https://docs.walrus.site',
  },
  tusky: {
    name: '@tusky-io/ts-sdk',
    description: 'Community TypeScript SDK',
    docs: 'https://github.com/tusky-io',
  },
  hibernuts: {
    name: '@hibernuts/walrus-sdk',
    description: 'Alternative Walrus SDK',
    docs: 'https://github.com/hibernuts',
  },
} as const;
