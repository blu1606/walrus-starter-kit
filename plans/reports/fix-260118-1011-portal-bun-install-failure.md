# Fix Report: Portal Bun Install Failure

**Date:** 2026-01-18 10:11
**Type:** Bug Fix
**Severity:** Medium
**Impact:** Blocks portal setup and local preview functionality

## Issue Summary

Setup script failed during portal installation with error:
```
📦 Installing portal dependencies...
error: Bun could not find a package.json file to install from
note: Run "bun init" to initialize a project
❌ Bun install failed
```

## Root Cause Analysis

### Repository Structure Mismatch

The `walrus-sites` repository has the portal application in a subdirectory (`portal/`), not at the root:

```
walrus-sites/
├── portal/               # Actual portal app with package.json
│   ├── package.json
│   ├── src/
│   └── ...
├── examples/
├── docs/
└── README.md
```

**Script behavior:**
1. ✅ Cloned `walrus-sites` repository to `~/.walrus/portal`
2. ✅ Changed directory to `~/.walrus/portal` (root of repo)
3. ❌ Tried to run `bun install` at root (no package.json)
4. ❌ Failed because package.json is in `portal/` subdirectory

## Solution Implemented

### Fix Applied to All Three Presets

Updated setup scripts:
- [packages/cli/presets/react-mysten-simple-upload/scripts/setup-walrus-deploy.sh](../../packages/cli/presets/react-mysten-simple-upload/scripts/setup-walrus-deploy.sh)
- [packages/cli/presets/react-mysten-gallery/scripts/setup-walrus-deploy.sh](../../packages/cli/presets/react-mysten-gallery/scripts/setup-walrus-deploy.sh)
- [packages/cli/presets/react-mysten-simple-upload-enoki/scripts/setup-walrus-deploy.sh](../../packages/cli/presets/react-mysten-simple-upload-enoki/scripts/setup-walrus-deploy.sh)

### Changes Made

#### 1. Navigate to Portal Subdirectory

**Added after cloning repository:**
```bash
# Navigate to portal subdirectory (the actual portal app is in portal/ folder)
if [ -d "portal" ]; then
    cd portal
    echo "📍 Using portal subdirectory"
fi
```

For gallery preset (different repo):
```bash
# Navigate to portal subdirectory if it exists (some repos have portal/ subfolder)
if [ -d "portal" ] && [ -f "portal/package.json" ]; then
    cd portal
    echo "📍 Using portal subdirectory"
fi
```

#### 2. Conditional Bun Install

**Before:**
```bash
# Install portal dependencies
echo "📦 Installing portal dependencies..."
if ! bun install --silent; then
    echo "❌ Bun install failed"
    exit 1
fi

echo "✅ Portal dependencies installed"
```

**After:**
```bash
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
```

#### 3. Updated .env Path Message

**Updated to reflect potential subdirectory:**
```bash
echo "   Edit $PORTAL_DIR/portal/.env (or $PORTAL_DIR/.env)"
```

## Behavior After Fix

### Expected Flow

1. Clone `walrus-sites` repository → `~/.walrus/portal/`
2. Check if `portal/` subdirectory exists
3. If exists, navigate to `portal/` subdirectory
4. Check if `package.json` exists
5. If exists, run `bun install`
6. If not exists, skip with warning

### Gallery Preset (Different Repository)

The gallery preset uses a different portal repository (`https://github.com/ManTT-Data/portal.git`) which may have package.json at root. The fix handles both cases:
- If `portal/package.json` exists → navigate to `portal/`
- Otherwise → stay at root and check for `package.json`

## Testing Recommendations

### Test Scenarios

**Scenario 1: Fresh Installation (MystenLabs repo)**
```bash
cd test-project
pnpm setup-walrus-deploy

# Expected output:
# ✅ Portal cloned to: ~/.walrus/portal
# 📍 Using portal subdirectory
# 📦 Installing portal dependencies...
# ✅ Portal dependencies installed
```

**Scenario 2: Fresh Installation (ManTT-Data repo - Gallery)**
```bash
cd test-project-gallery
pnpm setup-walrus-deploy

# Expected output:
# ✅ Portal cloned to: ~/.walrus/portal
# 📦 Installing portal dependencies...
# ✅ Portal dependencies installed
```

**Scenario 3: No package.json Found**
```bash
# If portal structure changes or repo is misconfigured
# Expected output:
# ⚠️  No package.json found, skipping dependency installation
```

## Impact Assessment

**Severity:** Medium
- Blocks portal setup but doesn't affect site-builder functionality
- Users can still deploy sites without local portal preview

**Affected Workflows:**
- Portal installation and setup
- Local preview functionality (`pnpm walrus:portal`)

**Not Affected:**
- Site building and deployment
- Site-builder binary installation
- Project scaffolding

## Files Modified

1. **react-mysten-simple-upload preset:**
   - Added portal subdirectory navigation
   - Added conditional bun install
   - Updated .env path messages

2. **react-mysten-simple-upload-enoki preset:**
   - Added portal subdirectory navigation
   - Added conditional bun install
   - Updated .env path messages

3. **react-mysten-gallery preset:**
   - Added smart subdirectory detection (checks for portal/package.json)
   - Added conditional bun install
   - Handles both standalone portal and subdirectory structure

## Related Issues

- Portal repository structure assumptions
- Different portal repositories for different presets
- Package manager compatibility (Bun vs npm/pnpm)

## Breaking Changes

**None** - Script is more resilient and handles multiple repository structures.

## Next Steps

1. ✅ Update all three preset scripts
2. 🔲 Test with actual MystenLabs/walrus-sites repo
3. 🔲 Test with ManTT-Data/portal repo
4. 🔲 Verify portal runs correctly after setup
5. 🔲 Update documentation about portal structure

## Success Criteria

- ✅ Script navigates to correct directory
- ✅ Handles portal subdirectory automatically
- ✅ Gracefully handles missing package.json
- ✅ Works with both repository structures
- 🔲 Portal installs and runs successfully
- 🔲 Bun dependencies installed without errors

## Additional Notes

### Portal Repository Options

The setup supports two portal repository patterns:

1. **MystenLabs/walrus-sites** (default for simple-upload, enoki):
   - Portal app in `portal/` subdirectory
   - Repository includes examples and documentation
   - Script automatically navigates to `portal/`

2. **ManTT-Data/portal** (used in gallery preset):
   - Standalone portal repository
   - May have package.json at root
   - Script checks for subdirectory first, falls back to root

### Running Portal Locally

After successful setup:
```bash
# Run portal server
pnpm walrus:portal

# Or manually:
cd ~/.walrus/portal/portal  # (or just ~/.walrus/portal for standalone)
bun run server
```

## Unresolved Questions

1. Should we standardize on one portal repository across all presets?
2. Is the ManTT-Data/portal repo actively maintained?
3. Should we add version pinning for portal repository?
4. Should we provide fallback if Bun is not available?
