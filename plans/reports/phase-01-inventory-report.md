# Phase 01 Asset Mapping Report

Generated on: 2026-01-24

## 1. Asset Mapping Table

| Existing Asset Path                                                   | Proposed Slice Category/Name | Notes                              |
| :-------------------------------------------------------------------- | :--------------------------- | :--------------------------------- |
| `templates/base/package.json`                                         | `base`                       | Root configuration and scripts     |
| `templates/base/tsconfig.json`                                        | `base`                       | Shared TypeScript settings         |
| `templates/base/src/utils/env.ts`                                     | `base`                       | Environment validation logic       |
| `templates/react/src/providers/QueryProvider.tsx`                     | `framework/react`            | TanStack Query setup               |
| `templates/react/src/components/layout/app-layout.tsx`                | `framework/react`            | Shared layout shell                |
| `packages/templates/react-mysten-simple-upload/src/lib/walrus/*`      | `capability/storage/mysten`  | Updated Walrus SDK adapter (V2)    |
| `packages/templates/react-mysten-simple-upload-enoki/src/lib/enoki/*` | `capability/auth/enoki`      | Enoki zkLogin adapter/constants    |
| `templates/simple-upload/src/components/features/*`                   | `feature/simple-upload`      | UploadForm, FilePreview components |
| `templates/gallery/src/components/features/*`                         | `feature/gallery`            | GalleryGrid, FileCard components   |
| `templates/gallery/src/utils/index-manager.ts`                        | `feature/gallery`            | LocalStorage indexing logic        |
| `packages/templates/*/scripts/setup-walrus-deploy.sh`                 | `addon/deploy-walrus`        | Reusable deployment automation     |

## 2. Unification Findings

- **Scripts**: All scripts (`run-portal.sh`, `setup-walrus-deploy.sh`) are identical across all presets.
- **Framework**: All presets use the same Vite + React configuration.
- **Auth**: Enoki is an optional layer on top of the standard Mysten SDK.
- **Gallery**: Modernized to use `dapp-kit` in `react-mysten-gallery-new`.

## 3. Cleanup Items

- [ ] Remove broken symlink `packages/templates/react-mysten-gallery`
- [ ] Consolidate identical `scripts/` into `base` or `addons`
- [ ] Move shared `src/utils/` to `base`
