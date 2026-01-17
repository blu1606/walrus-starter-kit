export type WalrusNetwork = 'testnet' | 'mainnet' | 'devnet';

export interface WalrusConfig {
  network: WalrusNetwork;
  publisherUrl: string;
  aggregatorUrl: string;
  suiRpcUrl: string;
}

export interface BlobInfo {
  blobId: string;
  name?: string;
  size: number;
  contentType?: string;
  uploadedAt: number;
}

export interface StorageStats {
  totalBlobs: number;
  totalSize: number;
  usedEpochs: number;
}
