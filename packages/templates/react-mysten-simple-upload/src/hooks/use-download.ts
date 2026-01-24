import { useQuery } from '@tanstack/react-query';
import { storageAdapter } from '../lib/walrus/index.js';

export function useDownload(blobId: string | null) {
  return useQuery({
    queryKey: ['blob', blobId],
    queryFn: async () => {
      if (!blobId) throw new Error('No blob ID provided');
      return await storageAdapter.download(blobId);
    },
    enabled: !!blobId,
  });
}

export function useMetadata(blobId: string | null) {
  return useQuery({
    queryKey: ['metadata', blobId],
    queryFn: async () => {
      if (!blobId) throw new Error('No blob ID provided');
      return await storageAdapter.getMetadata(blobId);
    },
    enabled: !!blobId,
  });
}
