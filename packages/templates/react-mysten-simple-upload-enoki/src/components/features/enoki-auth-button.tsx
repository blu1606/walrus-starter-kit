import { useEnokiAuth } from '../../hooks/use-enoki-auth.js';

/**
 * Google OAuth login/logout button for zkLogin
 *
 * Shows login button when disconnected, logout button when connected
 */
export function EnokiAuthButton() {
  const { isEnokiConnected, enokiAddress, login, logout } = useEnokiAuth();

  if (isEnokiConnected) {
    return (
      <div className="enoki-auth">
        <span className="enoki-address">
          zkLogin: {enokiAddress?.slice(0, 6)}...{enokiAddress?.slice(-4)}
        </span>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
    );
  }

  return (
    <button onClick={login} className="google-login-btn">
      🔐 Login with Google
    </button>
  );
}
