import { storageAdapter } from '../lib/walrus/adapter.js';
import { loadEnv } from './env.js';

// Walrus aggregator URLs for direct HTTP access
const AGGREGATOR_URLS = {
  testnet: 'https://aggregator.walrus-testnet.walrus.space',
  mainnet: 'https://aggregator.walrus.space',
};

/**
 * Get the aggregator URL based on current network configuration
 */
function getAggregatorUrl(): string {
  const env = loadEnv();
  // Use environment override if available
  if (env.walrusAggregator) {
    return env.walrusAggregator;
  }
  // Default to testnet
  const network = env.walrusNetwork === 'mainnet' ? 'mainnet' : 'testnet';
  return AGGREGATOR_URLS[network];
}

/**
 * Generate a preview URL by fetching directly from Walrus aggregator HTTP API
 * This is faster than using the SDK as it makes a direct HTTP request
 *
 * @param blobId - The Walrus blob ID
 * @param contentType - MIME type of the content (e.g., 'image/jpeg')
 * @returns Object URL that can be used in <img> src
 */
async function generatePreviewUrlDirect(
  blobId: string,
  contentType: string
): Promise<string> {
  const aggregatorUrl = getAggregatorUrl();

  // Fetch blob data directly from aggregator
  // Using the /v1/blobs/{blobId} endpoint which returns the full blob
  const response = await fetch(`${aggregatorUrl}/v1/blobs/${blobId}`, {
    headers: {
      'Accept': 'application/octet-stream',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  // Get blob data and create object URL
  const blobData = await response.blob();

  // Create a new blob with correct content type
  const typedBlob = new Blob([blobData], { type: contentType });
  const objectUrl = URL.createObjectURL(typedBlob);

  return objectUrl;
}

/**
 * Fallback: Generate preview using SDK download method
 */
async function generatePreviewUrlFallback(
  blobId: string,
  contentType: string
): Promise<string> {
  // Download blob data as bytes via SDK
  const bytes = await storageAdapter.download(blobId);

  if (!(bytes instanceof Uint8Array)) {
    throw new Error('Expected Uint8Array from download');
  }

  // Create a Blob from the bytes with correct content type
  const buffer = new ArrayBuffer(bytes.length);
  const view = new Uint8Array(buffer);
  view.set(bytes);
  const blob = new Blob([buffer], { type: contentType });

  // Create and return object URL
  const objectUrl = URL.createObjectURL(blob);

  return objectUrl;
}

/**
 * Generate a preview URL from blob ID
 * Tries direct HTTP fetch first (faster), falls back to SDK if it fails
 *
 * @param blobId - The Walrus blob ID
 * @param contentType - MIME type of the content (e.g., 'image/jpeg')
 * @returns Object URL that can be used in <img> src
 */
export async function generatePreviewUrl(
  blobId: string,
  contentType: string
): Promise<string> {
  try {
    // Try direct HTTP fetch first (faster)
    console.log(`[Preview] Attempting direct fetch for ${blobId.slice(0, 16)}...`);
    const url = await generatePreviewUrlDirect(blobId, contentType);
    console.log(`[Preview] Direct fetch successful`);
    return url;
  } catch (directError) {
    console.warn(`[Preview] Direct fetch failed, falling back to SDK:`, directError);

    try {
      // Fallback to SDK method
      const url = await generatePreviewUrlFallback(blobId, contentType);
      console.log(`[Preview] SDK fallback successful`);
      return url;
    } catch (fallbackError) {
      console.error(`[Preview] Both methods failed for ${blobId}:`, fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Check if content type is an image that can be displayed
 */
export function isImageType(contentType: string): boolean {
  return contentType.startsWith('image/');
}

/**
 * Revoke object URL to free memory
 * Call this when the component unmounts or the URL is no longer needed
 */
export function revokePreviewUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}
