/**
 * MIME type detection from file extensions
 * Handles common file types that browsers may not auto-detect
 */

const MIME_TYPES: Record<string, string> = {
  // Text formats
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.markdown': 'text/markdown',
  '.csv': 'text/csv',
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.ts': 'text/typescript',
  '.json': 'application/json',
  '.xml': 'application/xml',

  // Images
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',

  // Documents
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Archives
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
  '.tar': 'application/x-tar',
  '.gz': 'application/gzip',
  '.7z': 'application/x-7z-compressed',

  // Audio
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',

  // Video
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.avi': 'video/x-msvideo',
  '.mov': 'video/quicktime',
};

/**
 * Detect MIME type from filename
 * @param fileName - File name with extension
 * @returns MIME type or null if not found
 */
export function getMimeTypeFromFileName(fileName: string): string | null {
  const extension = fileName.toLowerCase().match(/\.[^.]+$/)?.[0];
  if (!extension) return null;

  return MIME_TYPES[extension] || null;
}

/**
 * Get content type with fallback logic
 * Priority: explicit contentType > File.type > extension detection > fallback
 * @param file - File object, Uint8Array, or filename
 * @param explicitType - Explicitly provided content type
 * @returns Best-match content type
 */
export function getContentType(
  file: File | Uint8Array | string,
  explicitType?: string
): string {
  // Priority 1: Explicit content type
  if (explicitType) return explicitType;

  // Priority 2: File.type (if not empty and not generic)
  if (file instanceof File && file.type && file.type !== 'application/octet-stream') {
    return file.type;
  }

  // Priority 3: Detect from filename extension
  const fileName = typeof file === 'string' ? file : file instanceof File ? file.name : '';
  if (fileName) {
    const detectedType = getMimeTypeFromFileName(fileName);
    if (detectedType) return detectedType;
  }

  // Fallback: Generic binary
  return 'application/octet-stream';
}
