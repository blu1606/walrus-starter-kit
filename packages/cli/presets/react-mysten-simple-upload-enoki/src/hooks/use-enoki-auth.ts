import { useEnokiFlow, useZkLogin } from '@mysten/enoki/react';
import { enokiConfig } from '../lib/enoki/index.js';

/**
 * Enoki authentication hook
 *
 * Provides Google OAuth login/logout, zkLogin state, and unified signer interface
 */
export function useEnokiAuth() {
  const enokiFlow = useEnokiFlow();
  const { address } = useZkLogin();

  const login = async () => {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const redirectUrl = `${protocol}//${host}/auth`;

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
