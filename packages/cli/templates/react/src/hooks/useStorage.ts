import { useMutation, useQuery } from '@tanstack/react-query';
import { useStorageAdapter } from './useStorageAdapter.js';
import type { UploadOptions } from '../adapters/storage.js';

export function useUpload() {
  const adapter = useStorageAdapter();

  return useMutation({
    mutationFn: async ({
      file,
      options,
    }: {
      file: File;
      options?: UploadOptions;
    }) => {
      const blobId = await adapter.upload(file, options);
      return { blobId, file };
    },
  });
}

export function useDownload(blobId: string | null) {
  const adapter = useStorageAdapter();

  return useQuery({
    queryKey: ['blob', blobId],
    queryFn: async () => {
      if (!blobId) throw new Error('No blob ID provided');
      return await adapter.download(blobId);
    },
    enabled: !!blobId,
  });
}

export function useMetadata(blobId: string | null) {
  const adapter = useStorageAdapter();

  return useQuery({
    queryKey: ['metadata', blobId],
    queryFn: async () => {
      if (!blobId) throw new Error('No blob ID provided');
      return await adapter.getMetadata(blobId);
    },
    enabled: !!blobId,
  });
}
