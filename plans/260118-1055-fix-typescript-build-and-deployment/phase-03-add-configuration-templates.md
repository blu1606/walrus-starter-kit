# Phase 03: Add Configuration File Templates

**Priority:** P2
**Status:** Partially Complete
**Effort:** 1h
**Note:** sites-config.yaml and .env.example already exist in all presets. Need to add to base templates and update generator.

## Context Links

- **Diagnostic Report:** [Missing Configuration Files](../../plans/reports/debugger-260118-1038-typescript-build-errors.md#root-cause-3-missing-configuration-files)
- **User Symptoms:** Missing sites-config.yaml, Missing Walrus client config

## Overview

**CURRENT STATUS:** Configuration files already exist in all presets but missing from base templates.

### What's Already Done
- ✅ `sites-config.yaml` exists in all 3 presets (react-mysten-gallery, react-mysten-simple-upload, react-mysten-simple-upload-enoki)
- ✅ `.env.example` exists in all 3 presets
- ✅ `.env.example` exists in `packages/cli/templates/base/`

### What Still Needs to Be Done
- ❌ Copy `sites-config.yaml` to `packages/cli/templates/base/`
- ❌ Copy `sites-config.yaml` to `templates/base/` (reference)
- ❌ Copy `.env.example` to `templates/base/` (reference)
- ❌ Create `WALRUS_SETUP.md` documentation
- ❌ Update generator to copy config files to scaffolded projects
- ❌ Update preset README.md files with configuration instructions

Scaffolded projects lack critical configuration files for Walrus deployment and SDK initialization. Users must manually create these files, causing deployment failures and initialization errors.

## Key Insights

**Missing Configuration #1: sites-config.yaml**
```bash
find . -name "sites-config.yaml"
# Result: No files found
```
**Impact:** Walrus Sites deployment configuration unavailable

**Missing Configuration #2: Walrus Client Config**
```bash
test -f ~/.config/walrus/client_config.yaml
# Result: NOT found
```
**Impact:** Walrus SDK cannot initialize without this config

**User-Reported Symptoms:**
- "Missing sites-config.yaml"
- "Missing Walrus Client config at ~/.config/walrus/client_config.yaml"

## Requirements

### Functional
- Include sites-config.yaml template in all presets
- Provide .env.example with required Walrus variables
- Document Walrus client setup process
- Auto-configure for testnet by default

### Non-Functional
- Configuration files must be environment-agnostic
- Clear comments explaining each setting
- Support both development and production modes
- Follow Walrus SDK documentation standards

## Architecture

**Configuration File Hierarchy:**
```
scaffolded-project/
├── .env.example                    # Environment variables template
├── sites-config.yaml               # Walrus Sites deployment config
├── walrus.config.js                # SDK configuration (if needed)
└── README.md                       # Updated with setup instructions
```

**Generator Integration:**
```
Template Layer → Base Config Files → Preset-Specific Overrides → Final Project
```

## Related Code Files

### Files to Create

**Templates (Source of Truth):**
1. `d:\Sui\walrus-starter-kit\packages\cli\templates\base\sites-config.yaml`
2. `d:\Sui\walrus-starter-kit\packages\cli\templates\base\.env.example`

**Root Templates (Reference Copies):**
3. `d:\Sui\walrus-starter-kit\templates\base\sites-config.yaml`
4. `d:\Sui\walrus-starter-kit\templates\base\.env.example`

### Files to Modify

**Generator:**
- `d:\Sui\walrus-starter-kit\packages\cli\src\generator\index.ts` - Add config file copying
- `d:\Sui\walrus-starter-kit\packages\cli\src\generator\file-ops.ts` - Add template processing

**Documentation:**
- All preset README.md files - Add setup instructions
- `d:\Sui\walrus-starter-kit\README.md` - Document configuration

## Implementation Steps

### Step 1: Copy Existing sites-config.yaml to Base Templates (5m)

**Action:** Use existing file from presets as the base template.

```bash
# Copy from an existing preset to base templates
cp packages/cli/presets/react-mysten-simple-upload/sites-config.yaml packages/cli/templates/base/

# Create reference copy for root templates
mkdir -p templates/base
cp packages/cli/presets/react-mysten-simple-upload/sites-config.yaml templates/base/
```

**Verification:**
```bash
test -f packages/cli/templates/base/sites-config.yaml && echo "✓ Base template created"
test -f templates/base/sites-config.yaml && echo "✓ Reference copy created"
```

### Step 2: Copy .env.example to Root Templates (5m)

**.env.example already exists in `packages/cli/templates/base/`**, just need reference copy:

```bash
# Create reference copy for root templates
cp packages/cli/templates/base/.env.example templates/base/
```

**Verification:**
```bash
test -f templates/base/.env.example && echo "✓ Reference copy created"
```

### Step 3: Create WALRUS_SETUP.md Documentation (15m)

**File:** `packages/cli/templates/base/WALRUS_SETUP.md`

```markdown
# Walrus Client Setup Guide

## Prerequisites

- Walrus CLI installed
- Sui wallet with testnet SUI tokens

## Initialize Walrus Client

### Option 1: Automatic Setup (Recommended)

```bash
walrus init --network testnet
```

This creates `~/.config/walrus/client_config.yaml` with default settings.

### Option 2: Manual Configuration

Create `~/.config/walrus/client_config.yaml`:

```yaml
# Walrus Client Configuration
network: testnet
wallet_config:
  type: sui_keystore
  path: ~/.sui/sui_config/sui.keystore

api_base_url: https://publisher.walrus-testnet.walrus.space
aggregator_url: https://aggregator.walrus-testnet.walrus.space
```

## Verify Setup

```bash
walrus info
# Should show network info without errors
```

## Troubleshooting

**Error: "Missing Walrus Client config"**
- Run `walrus init --network testnet`
- Verify file exists: `cat ~/.config/walrus/client_config.yaml`

**Error: "Permission denied"**
- Check directory permissions: `ls -la ~/.config/walrus/`
- Create directory if missing: `mkdir -p ~/.config/walrus`

## Next Steps

- Copy `.env.example` to `.env`
- Configure environment variables
- Run `npm run dev` to start development server
```

### Step 4: Update Generator to Copy Config Files (20m)

**Modify:** `packages/cli/src/generator/index.ts`

```typescript
async function generateProject(options: GenerateOptions): Promise<void> {
  // ... existing code ...

  // Copy base configuration files
  const baseConfigFiles = [
    'sites-config.yaml',
    '.env.example',
    'WALRUS_SETUP.md'
  ];

  for (const configFile of baseConfigFiles) {
    const srcPath = path.join(templatesDir, 'base', configFile);
    const destPath = path.join(targetDir, configFile);

    if (fs.existsSync(srcPath)) {
      await copyFile(srcPath, destPath);
      console.log(`✓ Created ${configFile}`);
    }
  }

  // Copy .env.example to .env if --no-skip-install
  if (!options.skipInstall) {
    const envExamplePath = path.join(targetDir, '.env.example');
    const envPath = path.join(targetDir, '.env');

    if (fs.existsSync(envExamplePath) && !fs.existsSync(envPath)) {
      await copyFile(envExamplePath, envPath);
      console.log('✓ Created .env from template');
    }
  }

  // ... existing code ...
}
```

### Step 5: Update Preset README Templates (15m)

**Add to all preset README.md files:**

```markdown
## Configuration

### 1. Environment Variables

Copy the environment template:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and configure:
- Walrus network settings
- Sui network configuration
- API keys (if using Enoki)

### 2. Walrus Client Setup

Initialize Walrus client:

\`\`\`bash
walrus init --network testnet
\`\`\`

See [WALRUS_SETUP.md](./WALRUS_SETUP.md) for detailed instructions.

### 3. Sites Configuration

Review and customize `sites-config.yaml` for deployment settings.
```

**Update these files:**
- `packages/cli/presets/react-mysten-gallery/README.md`
- `packages/cli/presets/react-mysten-simple-upload/README.md`
- `packages/cli/presets/react-mysten-simple-upload-enoki/README.md`

## Todo List

- [x] sites-config.yaml exists in all presets
- [x] .env.example exists in all presets
- [x] .env.example exists in packages/cli/templates/base/
- [ ] Copy sites-config.yaml to packages/cli/templates/base/
- [ ] Copy sites-config.yaml to templates/base/ (reference)
- [ ] Copy .env.example to templates/base/ (reference)
- [ ] Create packages/cli/templates/base/WALRUS_SETUP.md
- [ ] Copy WALRUS_SETUP.md to templates/base/ (reference)
- [ ] Update generator/index.ts to copy base config files to scaffolded projects
- [ ] Add logic to copy .env.example → .env during generation
- [ ] Update react-mysten-gallery README.md with config instructions
- [ ] Update react-mysten-simple-upload README.md with config instructions
- [ ] Update react-mysten-simple-upload-enoki README.md with config instructions
- [ ] Test config file generation in scaffolded project
- [ ] Verify sites-config.yaml format with Walrus CLI
- [ ] Verify .env variables work with Vite

## Success Criteria

### Configuration Files Present
```bash
cd /tmp/test-config
node .../cli/dist/index.js test-config --preset react-mysten-simple-upload --skip-install
ls -la test-config/
# MUST show: sites-config.yaml, .env.example, WALRUS_SETUP.md
```

### Valid YAML Syntax
```bash
# Validate sites-config.yaml
cd test-config
yamllint sites-config.yaml  # If available
# OR
python -c "import yaml; yaml.safe_load(open('sites-config.yaml'))"
# MUST: No syntax errors
```

### Environment Variables Load
```bash
cd test-config
cp .env.example .env
npm run dev
# MUST: Vite loads variables, no "undefined" in import.meta.env
```

### Walrus SDK Initialization
```bash
# After walrus client setup
npm run dev
# Check browser console
# MUST: No "Missing Walrus Client config" errors
```

## Risk Assessment

**Low Risk:**
- Config templates may need updates as Walrus SDK evolves
- **Mitigation:** Version config templates with SDK version, add comments

**Low Risk:**
- Users may skip .env setup step
- **Mitigation:** Add validation in app startup, show clear error messages

**Low Risk:**
- YAML syntax errors if users modify config
- **Mitigation:** Add YAML validation to generator, provide schema

## Security Considerations

**Sensitive Data:**
- Never include actual API keys in .env.example
- Add .env to .gitignore (should already be there)
- Document secure key management practices

**Example .gitignore check:**
```bash
grep -q "^\.env$" .gitignore || echo ".env" >> .gitignore
```

**Wallet Configuration:**
- Walrus client config may contain wallet paths
- Document permission best practices
- Warn against committing wallet keystores

## Next Steps

**Immediate:**
- Phase 04: Fix TypeScript type issues (after dependencies stable)
- Phase 05: Testing protocol

**Follow-up:**
- Add config validation to CLI
- Create interactive config setup wizard
- Add config migration scripts for version updates

## Unresolved Questions

1. Should we create ~/.config/walrus/client_config.yaml automatically?
2. What are default Walrus client config values for different networks?
3. Should .env be auto-created or require manual copy?
4. Should we add JSON schema for sites-config.yaml validation?
5. How do we handle config migration when Walrus SDK updates?
