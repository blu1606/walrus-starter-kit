#!/bin/bash
# setup-walrus-deploy.sh - Zero-config Walrus Sites deployment setup (testnet)
# Auto-installs dependencies, downloads tools, clones portal
# Supports: Linux, macOS, Windows (Git Bash/WSL)

set -e  # Exit on error

echo "🦭 Walrus Sites Zero-Config Setup (testnet)"
echo ""

# ============================================================================
# 1. Detect OS & Architecture
# ============================================================================
detect_os() {
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)

    case "$OS" in
        linux*)   OS_TYPE="linux" ;;
        darwin*)  OS_TYPE="macos" ;;
        mingw*|msys*|cygwin*) OS_TYPE="windows" ;;
        *)
            echo "❌ Unsupported OS: $OS"
            exit 1
            ;;
    esac

    echo "✅ Detected: $OS_TYPE ($ARCH)"
}

# ============================================================================
# 2. Auto-install Bun (if not exists)
# ============================================================================
setup_bun() {
    if command -v bun &>/dev/null; then
        echo "✅ Bun already installed: $(bun --version)"
        return 0
    fi

    echo "📥 Installing Bun..."
    if [ "$OS_TYPE" = "windows" ]; then
        # Windows (PowerShell install via Git Bash)
        powershell -c "irm bun.sh/install.ps1 | iex"
    else
        # Linux/macOS
        curl -fsSL https://bun.sh/install | bash
    fi

    # Add to PATH for current session
    if [ "$OS_TYPE" = "windows" ]; then
        export PATH="$USERPROFILE/.bun/bin:$PATH"
    else
        export BUN_INSTALL="$HOME/.bun"
        export PATH="$BUN_INSTALL/bin:$PATH"
    fi

    # Verify installation
    if command -v bun &>/dev/null; then
        echo "✅ Bun installed: $(bun --version)"
    else
        echo "⚠️  Bun installed but not in PATH. Restart terminal or run:"
        echo "   export PATH=\"\$HOME/.bun/bin:\$PATH\""
    fi
}

# ============================================================================
# 3. Download site-builder binary (if not exists)
# ============================================================================
setup_site_builder() {
    # Set install directory based on OS
    if [ "$OS_TYPE" = "windows" ]; then
        WALRUS_BIN="$USERPROFILE/.walrus/bin"
        SITE_BUILDER="$WALRUS_BIN/site-builder.exe"
    else
        WALRUS_BIN="$HOME/.walrus/bin"
        SITE_BUILDER="$WALRUS_BIN/site-builder"
    fi

    # Check if already exists
    if [ -f "$SITE_BUILDER" ]; then
        echo "✅ site-builder already exists: $SITE_BUILDER"
        chmod +x "$SITE_BUILDER" 2>/dev/null || true
        return 0
    fi

    echo "📥 Downloading site-builder for $OS_TYPE..."
    mkdir -p "$WALRUS_BIN"

    # Select binary based on OS and architecture (following official Walrus naming)
    case "$OS_TYPE" in
        linux)
            case "$ARCH" in
                x86_64) SYSTEM="ubuntu-x86_64" ;;
                *)      SYSTEM="ubuntu-x86_64-generic" ;;
            esac
            ;;
        macos)
            case "$ARCH" in
                arm64)  SYSTEM="macos-arm64" ;;
                x86_64) SYSTEM="macos-x86_64" ;;
                *)      SYSTEM="macos-x86_64" ;;
            esac
            ;;
        windows)
            SYSTEM="windows-x86_64.exe"
            ;;
    esac

    # Use official Google Cloud Storage URL (testnet)
    DOWNLOAD_URL="https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-$SYSTEM"

    # Download with retry
    if ! curl -fsSL -o "$SITE_BUILDER" "$DOWNLOAD_URL"; then
        echo "❌ Failed to download site-builder from: $DOWNLOAD_URL"
        echo "   System detected: $OS_TYPE ($ARCH)"
        echo "   Binary variant: $SYSTEM"
        exit 1
    fi

    chmod +x "$SITE_BUILDER"
    echo "✅ site-builder installed: $SITE_BUILDER"

    # Add to PATH hint (won't persist after script)
    if [ "$OS_TYPE" = "windows" ]; then
        export PATH="$USERPROFILE/.walrus/bin:$PATH"
    else
        export PATH="$HOME/.walrus/bin:$PATH"
    fi
}

# ============================================================================
# 4. Clone Walrus Portal (if not exists)
# ============================================================================
setup_portal() {
    if [ "$OS_TYPE" = "windows" ]; then
        PORTAL_DIR="$USERPROFILE/.walrus/portal"
    else
        PORTAL_DIR="$HOME/.walrus/portal"
    fi

    if [ -d "$PORTAL_DIR" ]; then
        echo "✅ Portal already exists: $PORTAL_DIR"
        echo "   Updating..."
        cd "$PORTAL_DIR"
        git pull --quiet || echo "⚠️  Git pull failed (may be offline)"
    else
        echo "📂 Cloning Walrus Sites portal..."
        mkdir -p "$(dirname "$PORTAL_DIR")"

        # Clone with depth=1 for faster download
        if ! git clone --depth=1 https://github.com/MystenLabs/walrus-sites.git "$PORTAL_DIR"; then
            echo "❌ Failed to clone portal repository"
            exit 1
        fi

        cd "$PORTAL_DIR"
        echo "✅ Portal cloned to: $PORTAL_DIR"
    fi

    # Navigate to portal subdirectory (the actual portal app is in portal/ folder)
    if [ -d "portal" ]; then
        cd portal
        echo "📍 Using portal subdirectory"
    fi

    # Setup .env if not exists
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo "✅ Created .env from .env.example"
        else
            # Create minimal .env
            cat > .env << 'EOF'
# Walrus Portal Configuration (Testnet)
WALRUS_NETWORK=testnet
SUI_PRIVATE_KEY=

# Optional: Uncomment to customize
# PORTAL_PORT=3000
EOF
            echo "✅ Created .env template"
        fi

        echo ""
        echo "⚠️  ACTION REQUIRED:"
        echo "   Edit $PORTAL_DIR/portal/.env (or $PORTAL_DIR/.env)"
        echo "   Add your SUI_PRIVATE_KEY=0x..."
        echo ""
    else
        echo "✅ .env already configured"
    fi

    # Install portal dependencies (if package.json exists)
    if [ -f "package.json" ]; then
        echo "📦 Installing portal dependencies..."
        if ! bun install --silent; then
            echo "❌ Bun install failed"
            exit 1
        fi
        echo "✅ Portal dependencies installed"
    else
        echo "⚠️  No package.json found, skipping dependency installation"
    fi
}

# ============================================================================
# 5. Add npm scripts to project package.json
# ============================================================================
add_project_scripts() {
    PROJECT_DIR="${1:-.}"  # Default to current directory
    cd "$PROJECT_DIR" || { echo "❌ Invalid project directory"; exit 1; }

    if [ ! -f "package.json" ]; then
        echo "❌ No package.json found in $PROJECT_DIR"
        exit 1
    fi

    echo "📝 Adding Walrus deploy scripts to package.json..."

    # Use Node.js to safely modify package.json (guaranteed to exist in Node projects)
    # Use NODE_CMD to handle both Unix and Windows (node.exe in Git Bash)
    NODE_CMD=$(command -v node || command -v node.exe)
    "$NODE_CMD" -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

        pkg.scripts = pkg.scripts || {};

        // Add scripts (only if not already exists)
        if (!pkg.scripts['setup-walrus-deploy']) {
            pkg.scripts['setup-walrus-deploy'] = 'bash scripts/setup-walrus-deploy.sh';
        }

        if (!pkg.scripts['deploy:walrus']) {
            const siteBuilderPath = process.platform === 'win32'
                ? '%USERPROFILE%/.walrus/bin/site-builder.exe'
                : '~/.walrus/bin/site-builder';
            pkg.scripts['deploy:walrus'] = siteBuilderPath + ' --context=testnet deploy ./dist --epochs 10';
        }

        if (!pkg.scripts['walrus:portal']) {
            const portalPath = process.platform === 'win32'
                ? 'cd %USERPROFILE%/.walrus/portal'
                : 'cd ~/.walrus/portal';
            pkg.scripts['walrus:portal'] = portalPath + ' && bun run server';
        }

        fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\\n');
    " || {
        echo "❌ Failed to update package.json"
        exit 1
    }

    echo "✅ Scripts added to package.json:"
    echo "   - setup-walrus-deploy"
    echo "   - deploy:walrus"
    echo "   - walrus:portal"
}

# ============================================================================
# Main Execution
# ============================================================================
main() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Trap errors
    trap 'echo "❌ Setup failed at line $LINENO"' ERR

    # Prerequisites check
    if ! command -v git &>/dev/null; then
        echo "❌ Git not found. Install: https://git-scm.com"
        exit 1
    fi

    # Check for Node.js - Windows-compatible
    if ! command -v node &>/dev/null && ! command -v node.exe &>/dev/null; then
        echo "❌ Node.js not found. Install: https://nodejs.org"
        exit 1
    fi

    # Run setup steps
    detect_os
    setup_bun
    setup_site_builder
    setup_portal
    add_project_scripts "$@"

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🎉 Setup Complete!"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure your SUI private key:"
    if [ "$OS_TYPE" = "windows" ]; then
        echo "     notepad %USERPROFILE%\\.walrus\\portal\\.env"
    else
        echo "     nano ~/.walrus/portal/.env"
    fi
    echo "     Add: SUI_PRIVATE_KEY=0x..."
    echo ""
    echo "  2. Build your project:"
    echo "     pnpm build"
    echo ""
    echo "  3. Deploy to Walrus Sites:"
    echo "     pnpm deploy:walrus"
    echo ""
    echo "  4. (Optional) Preview locally:"
    echo "     pnpm walrus:portal"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Run main with all script arguments
main "$@"
