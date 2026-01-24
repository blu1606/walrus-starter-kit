import { ReactNode } from 'react';
import { WalletConnect } from '../features/wallet-connect.js';

interface LayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: LayoutProps) {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1><span className="text-secondary">🌊</span> <span className="text-accent">Walrus</span> App</h1>
        <WalletConnect />
      </header>
      <main className="app-main">{children}</main>
      <footer className="app-footer">
        <p className="text-secondary">Powered by <span className="text-accent">Walrus</span> & <span style={{ color: 'var(--walrus-accent-blue)' }}>Sui</span></p>
      </footer>
    </div>
  );
}
