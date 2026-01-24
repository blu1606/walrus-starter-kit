# Fix Report: Site-Builder Download URL and System Architecture

**Date:** 2026-01-18 10:06
**Type:** Bug Fix
**Severity:** High
**Impact:** Blocks deployment setup on all platforms

## Issue Summary

Setup script failed to download `site-builder` binary with error:
```
curl: (22) The requested URL returned error: 404
❌ Failed to download site-builder from: https://github.com/MystenLabs/walrus-sites/releases/latest/download/site-builder-linux
```

## Root Cause Analysis

### 1. Incorrect Download Source
Script used non-existent GitHub releases URL instead of official Google Cloud Storage.

**Wrong:** `https://github.com/MystenLabs/walrus-sites/releases/latest/download/site-builder-linux`
**Correct:** `https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-$SYSTEM`

### 2. Incorrect System Naming
Used simplified names (`site-builder-linux`, `site-builder-macos`) instead of official naming convention.

**Official naming from Walrus docs:**
- Linux: `site-builder-testnet-latest-ubuntu-x86_64`
- macOS Intel: `site-builder-testnet-latest-macos-x86_64`
- macOS ARM: `site-builder-testnet-latest-macos-arm64`
- Windows: `site-builder-testnet-latest-windows-x86_64.exe`

### 3. Missing Architecture Detection
Script didn't differentiate between x86_64 and ARM architectures for macOS.

### 4. Inconsistent Installation Paths
`react-mysten-gallery` preset used different paths (`~/bin` vs `~/.walrus/bin`)

## Solution Implemented

### Changes Applied to All Three Presets

Updated setup scripts:
- [packages/cli/presets/react-mysten-simple-upload/scripts/setup-walrus-deploy.sh](../../packages/cli/presets/react-mysten-simple-upload/scripts/setup-walrus-deploy.sh)
- [packages/cli/presets/react-mysten-gallery/scripts/setup-walrus-deploy.sh](../../packages/cli/presets/react-mysten-gallery/scripts/setup-walrus-deploy.sh)
- [packages/cli/presets/react-mysten-simple-upload-enoki/scripts/setup-walrus-deploy.sh](../../packages/cli/presets/react-mysten-simple-upload-enoki/scripts/setup-walrus-deploy.sh)

### Fix #1: Correct Download URL

**Before:**
```bash
DOWNLOAD_URL="https://github.com/MystenLabs/walrus-sites/releases/latest/download/$BINARY_NAME"
```

**After:**
```bash
# Use official Google Cloud Storage URL (testnet)
DOWNLOAD_URL="https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-$SYSTEM"
```

### Fix #2: Architecture-Aware System Detection

**Before:**
```bash
case "$OS_TYPE" in
    linux)   BINARY_NAME="site-builder-linux" ;;
    macos)   BINARY_NAME="site-builder-macos" ;;
    windows) BINARY_NAME="site-builder-windows.exe" ;;
esac
```

**After:**
```bash
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
```

### Fix #3: Enhanced Error Reporting

**Added diagnostic information on download failure:**
```bash
if ! curl -fsSL -o "$SITE_BUILDER" "$DOWNLOAD_URL"; then
    echo "❌ Failed to download site-builder from: $DOWNLOAD_URL"
    echo "   System detected: $OS_TYPE ($ARCH)"
    echo "   Binary variant: $SYSTEM"
    exit 1
fi
```

### Fix #4: Standardized Installation Paths

**Unified all presets to use `.walrus` directory:**
- Binary: `~/.walrus/bin/site-builder` (or `%USERPROFILE%/.walrus/bin/site-builder.exe` on Windows)
- Portal: `~/.walrus/portal`
- Package.json scripts updated to reference correct paths

## Testing Recommendations

### Manual Testing

Test on each platform:

**Linux (Ubuntu x86_64):**
```bash
cd test-project
pnpm setup-walrus-deploy
# Verify: ~/.walrus/bin/site-builder exists
~/.walrus/bin/site-builder --help
```

**macOS (Intel):**
```bash
cd test-project
pnpm setup-walrus-deploy
# Verify: ~/.walrus/bin/site-builder exists
~/.walrus/bin/site-builder --help
```

**macOS (ARM/M1/M2):**
```bash
cd test-project
pnpm setup-walrus-deploy
# Verify: ~/.walrus/bin/site-builder exists
~/.walrus/bin/site-builder --help
```

**Windows (Git Bash):**
```powershell
cd test-project
pnpm setup-walrus-deploy
# Verify: %USERPROFILE%\.walrus\bin\site-builder.exe exists
"%USERPROFILE%\.walrus\bin\site-builder.exe" --help
```

### Expected Behavior

1. ✅ Binary downloads successfully from Google Cloud Storage
2. ✅ Correct architecture variant selected automatically
3. ✅ Binary installed to `~/.walrus/bin/`
4. ✅ Portal cloned to `~/.walrus/portal/`
5. ✅ Package.json scripts added with correct paths
6. ✅ Setup completes without errors

## Impact Assessment

**Affected Components:**
- All three preset templates
- Setup workflow for new projects
- Site-builder binary installation
- Package.json script generation

**Severity:** High - Complete blocker for deployment setup

**User Impact:**
- Existing users: Must re-run setup script or manually update paths
- New users: Setup will work correctly after update

## Files Modified

### All Presets - Updated Download Logic:
1. `packages/cli/presets/react-mysten-simple-upload/scripts/setup-walrus-deploy.sh`
   - Fixed download URL
   - Added architecture detection
   - Enhanced error messages

2. `packages/cli/presets/react-mysten-gallery/scripts/setup-walrus-deploy.sh`
   - Fixed download URL
   - Added architecture detection
   - Standardized paths to `~/.walrus/`
   - Fixed package.json script paths

3. `packages/cli/presets/react-mysten-simple-upload-enoki/scripts/setup-walrus-deploy.sh`
   - Fixed download URL
   - Added architecture detection
   - Enhanced error messages

## Related Documentation

**Official Walrus Documentation:**
- Binary download URLs: https://storage.googleapis.com/mysten-walrus-binaries/
- Naming conventions: `site-builder-{mainnet|testnet}-latest-{system}`
- Supported systems: `ubuntu-x86_64`, `macos-arm64`, `macos-x86_64`, `windows-x86_64.exe`

## Breaking Changes

**None** - Paths changed but setup script auto-creates correct structure.

Users who manually installed to old paths (`~/bin`) should:
1. Remove old installation: `rm ~/bin/site-builder`
2. Re-run setup: `pnpm setup-walrus-deploy`

## Next Steps

1. ✅ Update all three preset scripts
2. 🔲 Test on Windows (Git Bash)
3. 🔲 Test on macOS (Intel and ARM)
4. 🔲 Test on Linux (Ubuntu)
5. 🔲 Update CLI documentation if needed
6. 🔲 Consider adding automated tests for download logic

## Success Criteria

- ✅ Correct Google Cloud Storage URL used
- ✅ Architecture-specific binaries downloaded
- ✅ Consistent `.walrus` directory structure
- ✅ Enhanced error diagnostics
- 🔲 Verified working on all platforms

## Reference

**Official Walrus Site-Builder Installation:**
```bash
# Testnet (current implementation)
SYSTEM="ubuntu-x86_64"  # or macos-arm64, macos-x86_64, windows-x86_64.exe
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-testnet-latest-$SYSTEM -o site-builder
chmod +x site-builder

# Mainnet (for future reference)
curl https://storage.googleapis.com/mysten-walrus-binaries/site-builder-mainnet-latest-$SYSTEM -o site-builder
chmod +x site-builder
```
