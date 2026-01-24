# {{projectName}}

Simple Upload Walrus application with Enoki zkLogin authentication.

## Features

- 🔐 **Google OAuth zkLogin** - Sign in with your Google account using Enoki zkLogin
- 📤 **Upload to Walrus** - Upload any file to decentralized storage
- 📥 **Download Files** - Retrieve files by Blob ID
- 💰 **Gasless Transactions** - Sponsored transactions via Enoki (no SUI required)
- 🔄 **Dual Wallet Support** - zkLogin or standard Sui wallet fallback
- 🔒 **Tab-Isolated Sessions** - sessionStorage auto-cleanup on tab close

## Prerequisites

Before starting, you'll need:

1. **Enoki Account** - Create project at [portal.enoki.mystenlabs.com](https://portal.enoki.mystenlabs.com/)
2. **Google OAuth Credentials** - Set up at [console.cloud.google.com](https://console.cloud.google.com/)
3. **Node.js 18+** and **pnpm** installed
4. **Testnet SUI** (for wallet fallback) - Get from [faucet.testnet.sui.io](https://faucet.testnet.sui.io/)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Setup Environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials (see Setup Guides below):

```env
# Enoki zkLogin Authentication
VITE_ENOKI_API_KEY=enoki_public_xxxxxxxxxxxxxxxx
VITE_GOOGLE_CLIENT_ID=xxxxxxxxx.apps.googleusercontent.com

# Walrus Network Settings
VITE_WALRUS_NETWORK=testnet
VITE_WALRUS_AGGREGATOR=https://aggregator.walrus-testnet.walrus.space
VITE_WALRUS_PUBLISHER=https://publisher.walrus-testnet.walrus.space

# Sui Blockchain Settings
VITE_SUI_NETWORK=testnet
VITE_SUI_RPC=https://fullnode.testnet.sui.io:443

# Optional: Blockberry Analytics (leave empty to disable)
VITE_BLOCKBERRY_KEY=
```

### 3. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Setup Guides

### Enoki Console Configuration

1. Visit [portal.enoki.mystenlabs.com](https://portal.enoki.mystenlabs.com/) and sign in
2. Click **Create Project** and name it (e.g., "Walrus Upload")
3. Copy the **Public API Key** (starts with `enoki_public_`)
4. Navigate to **OAuth Providers** → Enable **Google**
5. Add redirect URIs:
   - Development: `http://localhost:5173/auth`
   - Production: `https://yourdomain.com/auth` (update when deploying)
6. Save configuration

### Google OAuth Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **OAuth consent screen**
   - User Type: External
   - App name: Your app name
   - Add your email as test user
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:5173/auth` (development)
     - `https://yourdomain.com/auth` (production)
5. Copy the **Client ID** (ends with `.apps.googleusercontent.com`)

### Environment Variables Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_ENOKI_API_KEY` | **Yes** | Public API key from Enoki Console | `enoki_public_xxx` |
| `VITE_GOOGLE_CLIENT_ID` | **Yes** | OAuth Client ID from Google Cloud | `xxx.apps.googleusercontent.com` |
| `VITE_WALRUS_NETWORK` | **Yes** | Walrus network environment | `testnet`, `mainnet`, `devnet` |
| `VITE_WALRUS_AGGREGATOR` | **Yes** | Walrus aggregator URL for downloads | `https://aggregator.walrus-testnet.walrus.space` |
| `VITE_WALRUS_PUBLISHER` | **Yes** | Walrus publisher URL for uploads | `https://publisher.walrus-testnet.walrus.space` |
| `VITE_SUI_NETWORK` | **Yes** | Sui network environment | `testnet`, `mainnet`, `devnet` |
| `VITE_SUI_RPC` | No | Custom Sui RPC endpoint (optional) | `https://fullnode.testnet.sui.io:443` |
| `VITE_BLOCKBERRY_KEY` | No | Blockberry Analytics API key (optional) | Leave empty to disable |

**Security Note:** Never commit `.env` files to version control. The `.env.example` file is provided as a template.

---

## Usage

### Authentication Flow

This app supports two authentication methods (automatically prioritizes zkLogin):

1. **Google zkLogin (Recommended)**
   - Click **"🔐 Login with Google"** button
   - Authorize with your Google account
   - Redirected back to app with zkLogin session active
   - Keys stored in sessionStorage (tab-isolated, auto-cleanup on tab close)

2. **Standard Sui Wallet (Fallback)**
   - If not logged in with Google, click **"Connect Wallet"**
   - Select your preferred Sui wallet extension (Sui Wallet, Suiet, etc.)
   - Approve connection request

### Upload Files

1. Ensure you're authenticated (Google or wallet)
2. Click **"Choose File"** and select any file
3. Click **"Upload to Walrus"**
4. Transaction is signed and submitted (gasless with Enoki zkLogin)
5. Copy the **Blob ID** from the success message

### Download Files

1. Paste a Blob ID in the download section
2. Click **"Download File"**
3. File will be retrieved from Walrus and downloaded

### Logout

- If using Google zkLogin: Click the **"Logout"** button next to your address
- If using wallet: Use your wallet extension to disconnect

---

## Troubleshooting

### "VITE_ENOKI_API_KEY is required"

**Cause:** Missing or invalid environment variable

**Solution:**
1. Ensure `.env` file exists in project root
2. Verify `VITE_ENOKI_API_KEY` is set and starts with `enoki_public_`
3. Restart the development server (`pnpm dev`)

### "Redirect URI mismatch" OAuth Error

**Cause:** Google OAuth redirect URI doesn't match configuration

**Solution:**
1. Verify redirect URI in Google Cloud Console exactly matches:
   - Development: `http://localhost:5173/auth`
   - Production: `https://yourdomain.com/auth`
2. No trailing slashes
3. Protocol must match (http vs https)
4. Wait 5-10 minutes after changing Google Console settings

### Upload Fails with zkLogin

**Cause:** Enoki sponsorship balance depleted or network mismatch

**Solution:**
1. Check [Enoki Console](https://portal.enoki.mystenlabs.com/) sponsorship balance
2. Verify `VITE_SUI_NETWORK` in `.env` matches your Enoki project network
3. Ensure your Enoki project has the correct network configured

### "No wallet connected" Error

**Cause:** Neither zkLogin nor wallet is connected

**Solution:**
1. Click "Login with Google" for zkLogin authentication
2. Or click "Connect Wallet" and approve wallet connection
3. Refresh page if session was lost

### TypeScript / Build Errors

**Cause:** Dependencies not installed or outdated

**Solution:**
```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
pnpm build
```

---

## Code Structure

```
src/
├── components/
│   ├── features/
│   │   ├── upload-form.tsx         # File upload UI with drag-drop
│   │   ├── file-preview.tsx        # Download UI by Blob ID
│   │   ├── wallet-connect.tsx      # Dual auth UI (zkLogin + wallet)
│   │   └── enoki-auth-button.tsx   # Google login/logout button
│   └── layout/
│       └── app-layout.tsx          # Main layout wrapper
├── hooks/
│   ├── use-upload.ts               # Upload mutation with dual auth
│   ├── use-enoki-auth.ts           # Google OAuth state & signer
│   └── use-wallet.ts               # Standard wallet state & signer
├── providers/
│   ├── EnokiProvider.tsx           # Enoki zkLogin provider
│   ├── WalletProvider.tsx          # Sui wallet provider
│   ├── QueryProvider.tsx           # React Query provider
│   └── index.ts                    # Barrel exports
├── lib/
│   ├── enoki/
│   │   ├── constants.ts            # Env validation with Zod
│   │   ├── storage-adapter.ts      # sessionStorage wrapper
│   │   └── index.ts                # Barrel exports
│   └── walrus/
│       ├── storage-adapter.ts      # Upload/download logic
│       ├── types.ts                # TypeScript interfaces
│       └── index.ts                # Barrel exports
├── App.tsx                         # Main app component
└── main.tsx                        # Entry point with providers
```

---

## Deploy to Walrus Sites

### First-time Setup

```bash
pnpm setup-walrus-deploy
```

This automatically:
- Installs Bun (if not installed)
- Downloads site-builder binary for your OS
- Clones Walrus Sites portal to `~/.walrus/portal`
- Adds deployment scripts to package.json

### Configure SUI Private Key

Edit the portal configuration:

**Linux/macOS:**
```bash
nano ~/.walrus/portal/.env
```

**Windows:**
```bash
notepad %USERPROFILE%\.walrus\portal\.env
```

Add your private key:
```env
SUI_PRIVATE_KEY=0x...
WALRUS_NETWORK=testnet
```

### Update OAuth Redirect URI for Production

**IMPORTANT:** Before deploying, update your Google OAuth redirect URI:

1. Deploy once to get your Walrus Sites URL (e.g., `https://abcd1234.walrus.site`)
2. Add this URL + `/auth` to Google Cloud Console:
   - Go to [console.cloud.google.com](https://console.cloud.google.com/)
   - Navigate to **Credentials** → Select your OAuth Client
   - Add `https://your-site-id.walrus.site/auth` to Authorized redirect URIs
3. Also add to Enoki Console redirect URIs

### Build & Deploy

```bash
# Build production bundle
pnpm build

# Deploy to Walrus Sites (testnet, 10 epochs)
pnpm deploy:walrus
```

After deployment, you'll receive a URL like `https://abcd1234.walrus.site`

### Preview Locally

```bash
pnpm walrus:portal
```

This starts the local portal server to preview your deployed site.

---

## Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start development server (http://localhost:5173) |
| `pnpm build` | Build for production (output: `dist/`) |
| `pnpm preview` | Preview production build locally |
| `pnpm setup-walrus-deploy` | One-time Walrus Sites deployment setup |
| `pnpm deploy:walrus` | Deploy to Walrus Sites (testnet, 10 epochs) |
| `pnpm walrus:portal` | Start local portal server to preview deployed site |

---

## External Documentation

- **Enoki Documentation:** [docs.enoki.mystenlabs.com](https://docs.enoki.mystenlabs.com/)
- **Walrus Documentation:** [docs.walrus.site](https://docs.walrus.site/)
- **Google OAuth Guide:** [developers.google.com/identity/protocols/oauth2](https://developers.google.com/identity/protocols/oauth2)
- **Sui Documentation:** [docs.sui.io](https://docs.sui.io/)
- **@mysten/dapp-kit:** [sdk.mystenlabs.com/dapp-kit](https://sdk.mystenlabs.com/dapp-kit)

---

## License

MIT
