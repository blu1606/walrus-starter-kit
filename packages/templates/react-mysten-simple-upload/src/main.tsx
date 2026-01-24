import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryProvider } from './providers/QueryProvider.js';
import { WalletProvider } from './providers/WalletProvider.js';
import App from './App.js';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryProvider>
      <WalletProvider>
        <App />
      </WalletProvider>
    </QueryProvider>
  </React.StrictMode>
);
