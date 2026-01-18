# Enoki zkLogin Template Layer

Provider setup for social authentication and sponsored transactions.

## Features
- Google OAuth login (zkLogin)
- Gasless transactions via Enoki sponsorship
- Dual wallet support (zkLogin + standard wallets)
- SessionStorage persistence (tab-isolated)

## Environment Setup
Copy `.env.example` and fill in:
- NEXT_PUBLIC_ENOKI_API_KEY (from Enoki Console)
- NEXT_PUBLIC_GOOGLE_CLIENT_ID (from Google Cloud Console)

## Usage
Replace `WalletProvider` with `EnokiProvider` in `main.tsx`:
```tsx
import { EnokiProvider } from './providers/EnokiProvider';

<EnokiProvider>
  <App />
</EnokiProvider>
```

## TODO
- [ ] Implement EnokiProvider.tsx
- [ ] Implement constants.ts with Zod validation
- [ ] Implement storage-adapter.ts
- [ ] Add barrel exports
- [ ] Update compatibility matrix
