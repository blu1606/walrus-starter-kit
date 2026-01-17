# Project Overview & PDR (Product Development Requirements)

**Project Name:** Walrus Starter Kit
**CLI Tool:** `create-walrus-app`
**Version:** 0.1.0
**Status:** In Progress (Phase 8 Complete - Core MVP & Testing Ready)

## 1. Executive Summary

Walrus Starter Kit is a production-grade interactive CLI tool designed to simplify the development of applications on the Walrus Protocol (Sui blockchain). It provides a modular scaffolding system using a **Base + Layer + Adapter Pattern**, allowing developers to choose from various SDKs, frameworks, and use cases. The project has completed Phase 8 (Testing and Validation), verifying the CLI engine's reliability across multiple template combinations.

## 2. Product Vision

The goal is to provide the "create-next-app" experience for the Walrus ecosystem.

- **Interactive Wizard:** A 6-step CLI flow to configure the project.
- **Modular Architecture:** Deep merging of templates (Base + SDK + Framework + Use Case).
- **SDK Agnostic:** Use case logic works across different Walrus SDKs via an Adapter Pattern.
- **Production Ready:** Includes best practices for styling (Tailwind), linting, and TypeScript.

## 3. Target Audience

- **Frontend DApp Developers:** Primarily React/TS developers looking to integrate Walrus storage.
- **Full-Stack Developers:** Building dashboards and backends that interact with Walrus.
- **Protocol Explorers:** Developers wanting to quickly prototype with different Walrus SDKs.

## 4. Key Requirements (PDR)

### 4.1 Functional Requirements

- **Interactive CLI:**
  1. Project name selection.
  2. SDK selection (e.g., `@mysten/walrus`).
  3. Framework selection (e.g., React, Vue, Plain TS).
  4. Use Case selection (e.g., Simple Upload, File Gallery, DeFi/NFT).
  5. Optional features (Tailwind CSS, Analytics).
- **Template Generation:**
  - Deep merge `package.json` dependencies and scripts.
  - Resolve conflicts in configuration files (tsconfig, etc.).
  - Maintain a compatibility matrix between SDKs and frameworks.
- **Post-Install Automation:**
  - Automatic dependency installation (detecting pnpm, npm, yarn, bun).
  - Git repository initialization and initial commit.
  - Project validation (package.json, node_modules, TypeScript compilation).
  - Clear success UI with next steps and helpful resources.

### 4.2 Non-Functional Requirements

- **Performance:** CLI should be fast and lightweight.
- **Reliability:** Validated template combinations to ensure "zero broken templates".
- **Extensibility:** Easy to add new SDKs or frameworks as layers.
- **UX/UI:** Follows "Arctic Shipyard" design language for CLI and "Deep Ocean Glass" for templates.

## 5. Technical Constraints

- **Node.js:** ^20.0.0 || ^22.0.0 || >=24.0.0
- **Package Manager:** pnpm >= 9.0.0 (for monorepo management)
- **Language:** TypeScript for all core components and templates.

## 6. Success Metrics

- Successful scaffolding of all 18+ possible template combinations.
- Adoption by the Sui/Walrus developer community.
- Positive feedback on the developer experience (DX).
