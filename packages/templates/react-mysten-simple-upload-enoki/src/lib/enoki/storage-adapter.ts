/**
 * SessionStorage adapter for Enoki zkLogin wallet persistence
 *
 * Benefits:
 * - Tab-isolated sessions (auto-cleanup on tab close)
 * - Enhanced security vs localStorage
 * - SSR-safe with browser detection
 */

export interface StorageAdapter {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

export const sessionStorageAdapter: StorageAdapter = {
  async getItem(key: string): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key);
  },

  async setItem(key: string, value: string): Promise<void> {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(key, value);
  },

  async removeItem(key: string): Promise<void> {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(key);
  },
};
