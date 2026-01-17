/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Format blob ID for display (truncate middle)
 */
export function formatBlobId(blobId: string, length = 12): string {
  if (blobId.length <= length) return blobId;

  const part = Math.floor((length - 3) / 2);
  return `${blobId.slice(0, part)}...${blobId.slice(-part)}`;
}

/**
 * Format timestamp to locale string
 */
export function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}
