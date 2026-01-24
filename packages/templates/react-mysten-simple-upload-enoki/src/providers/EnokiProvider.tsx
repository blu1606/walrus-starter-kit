import { EnokiFlowProvider } from '@mysten/enoki/react';
import { ReactNode } from 'react';
import { enokiConfig, sessionStorageAdapter } from '../lib/enoki/index.js';

/**
 * EnokiProvider wraps the app with zkLogin authentication support
 *
 * Features:
 * - Google OAuth via Enoki zkLogin
 * - Tab-isolated sessions (sessionStorage)
 * - Environment validation with Zod
 *
 * Architecture Note:
 * This provider handles the entire authentication lifecycle (login, session management,
 * logout). It uses a storage adapter to persist session keys.
 */
export function EnokiProvider({ children }: { children: ReactNode }) {
  return (
    <EnokiFlowProvider
      apiKey={enokiConfig.VITE_ENOKI_API_KEY}
      // We use sessionStorage to ensure keys are cleared when the tab is closed.
      // This is a security best practice for ephemeral dApps.
      storageAdapter={sessionStorageAdapter}
      storageKey="enoki:walrus-upload"
    >
      {children}
    </EnokiFlowProvider>
  );
}
