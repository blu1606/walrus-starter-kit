import { useEnokiFlow, useZkLogin } from '@mysten/enoki/react';
import { enokiConfig } from '../lib/enoki/index.js';

/**
 * Enoki authentication hook
 *
 * Provides Google OAuth login/logout, zkLogin state, and unified signer interface.
 * This abstracts away the complexity of OIDC flows.
 */
export function useEnokiAuth() {
  const enokiFlow = useEnokiFlow();
  const { address } = useZkLogin();

  const login = async () => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const redirectUrl = `${protocol}//${host}/auth`;

    // Initialize OAuth Flow:
    // This generates the authorization URL for Google.
    // The user will be redirected to Google, and then back to `redirectUrl`.
    const authUrl = await enokiFlow.createAuthorizationURL({
      provider: 'google',
      clientId: enokiConfig.VITE_GOOGLE_CLIENT_ID,
      redirectUrl,
    });

    window.location.href = authUrl;
  };

  const logout = () => {
    enokiFlow.logout();
  };

  // Signer Factory:
  // Creates a signer object compatible with the Walrus SDK.
  // This allows the Walrus SDK to sign transactions using the ephemeral keys
  // managed by Enoki/zkLogin.
  const getSigner = () => {
    if (!address || !enokiFlow) return null;

    return {
      address,
      signAndExecuteTransaction: async (args: any) => {
        const result = await enokiFlow.signAndExecuteTransaction({
          transaction: args.transaction,
        });
        return { digest: result.digest };
      },
    };
  };

  return {
    isEnokiConnected: !!address,
    enokiAddress: address,
    login,
    logout,
    getSigner,
  };
}
