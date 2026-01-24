# CLI Scaffolding Best Practices Research Report

**Date:** 2026-01-18
**Context:** d:\Sui\walrus-starter-kit
**Focus:** Production-grade CLI scaffolding tools analysis for Walrus Starter Kit

## Executive Summary

Walrus Starter Kit (`create-walrus-app`) implements solid fundamentals using Commander.js + Prompts stack. Analysis of 2026 best practices reveals opportunities for enhanced UX, improved error handling, and modern testing patterns.

**Current Stack:**
- Commander v11 (argument parsing)
- Prompts v2 (interactive UX)
- fs-extra v11 (file operations)
- cross-spawn v7 (process execution)
- kleur v4 (colored output)

**Health Score:** 7/10 — Good foundation, needs UX polish + error handling improvements

---

## 1. CLI Architecture Patterns

### Current Implementation (Walrus)
**Pattern:** Pipeline architecture with modular separation
- Entry → Parse → Prompt → Context → Validate → Generate → Post-Install
- **Strengths:** Clear separation of concerns, testable units
- **Gaps:** Limited custom error types, basic validation error messages

### Industry Standards (2026)

**Commander.js Best Practices:**
- ✅ Custom argument validation with `InvalidArgumentError`
- ✅ `exitOverride()` for testing (not used in Walrus)
- ✅ Custom output streams via `configureOutput()` (not used)
- ❌ Walrus uses basic try-catch without custom error types

**Example from Commander docs:**
```js
function myParseInt(value) {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new commander.InvalidArgumentError('Not a number.');
  }
  return parsedValue;
}
```

**Gap Analysis:**
- Walrus uses simple string validation for project names
- No custom error classes extending `CommanderError`
- Missing `exitOverride()` for testability (only 1 e2e test found)

---

## 2. Interactive Prompt UX Best Practices

### Current Implementation
**Library:** Prompts v2.4.2
- Dynamic choice filtering based on compatibility matrix
- Auto-detection of package manager with fallback
- Conditional prompts (e.g., zkLogin only for mysten+simple-upload)
- Cancel handling with process.exit(1)

**Strengths:**
- Smart defaults (PM auto-detection)
- Dynamic choices prevent invalid combinations
- Non-TTY detection for CI/CD mode

**Weaknesses:**
- Basic error messages ("Operation cancelled")
- No progress indicators during file operations
- Limited visual feedback (only kleur colored text)

### Modern Alternatives (2026)

**Emerging Libraries:**
- **@clack/prompts** — Better UX, themed components, spinners
- **cleye** — Lightweight, TypeScript-first
- **enquirer** — Enhanced styling over prompts

**Missing UX Patterns:**
- Progress bars for file copying (current: silent operation)
- Spinners for long operations (npm install shows raw output)
- Confirmation prompts before overwrite/rollback
- Estimated time remaining for large presets

---

## 3. Template Generation & Transformation

### Current Implementation
**Pattern:** Simple regex-based variable substitution
```ts
// transform.ts
return content
  .replace(/\{\{projectName\}\}/g, vars.projectName)
  .replace(/\{\{sdkName\}\}/g, vars.sdkName)
  // ...
```

**Supported Extensions:** `.md`, `.json`, `.html`, `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.scss`, `.vue`

**Strengths:**
- Zero dependencies (no Handlebars/Mustache)
- Fast and predictable
- Sufficient for current use cases (4 variables)

**Limitations:**
- No conditional logic (e.g., `{{#if useZkLogin}}`)
- No loops/iteration
- No filters/helpers (e.g., `{{projectName | kebabCase}}`)

### Industry Patterns

**Template Engines (2026):**
- **Handlebars** — Logic-less, widely adopted
- **EJS** — Embedded JS, full logic support
- **Plop** — Micro-generator framework with Handlebars
- **Hygen** — Fast, scalable code generation

**Trade-offs:**
- Walrus approach: Simple, maintainable, but inflexible
- Handlebars approach: Complex conditionals, steeper learning curve
- **Recommendation:** Current approach sufficient unless adding conditional layers (e.g., optional Tailwind/Analytics)

---

## 4. Package Manager Detection

### Current Implementation
```ts
// detect-pm.ts
export function detectPackageManager(): PackageManager {
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent?.includes('pnpm')) return 'pnpm';
  if (userAgent?.includes('yarn')) return 'yarn';
  if (userAgent?.includes('bun')) return 'bun';
  return 'npm';
}
```

**Strengths:**
- Standard approach (npm_config_user_agent)
- Supports all major PMs (npm, pnpm, yarn, bun)

**Gaps:**
- No lockfile detection (package-lock.json, pnpm-lock.yaml, yarn.lock, bun.lockb)
- No version checking (e.g., pnpm >= 9.0.0 required)
- No fallback warning if detected PM not installed

### Best Practices (2026)

**Multi-tier Detection:**
1. CLI flag (highest priority) ✅
2. npm_config_user_agent ✅
3. Lockfile detection ❌
4. PM availability check ❌
5. Default to npm ✅

**Example Enhancement:**
```ts
async function detectPackageManager(): Promise<PackageManager> {
  // 1. Check user agent
  const userAgent = process.env.npm_config_user_agent;
  if (userAgent?.includes('pnpm')) return validatePM('pnpm');

  // 2. Check lockfiles in cwd
  if (await fs.pathExists('pnpm-lock.yaml')) return validatePM('pnpm');
  if (await fs.pathExists('yarn.lock')) return validatePM('yarn');

  // 3. Validate availability
  return validatePM('npm');
}

async function validatePM(pm: PackageManager): Promise<PackageManager> {
  try {
    await execa(pm, ['--version']);
    return pm;
  } catch {
    logger.warn(`${pm} not found, falling back to npm`);
    return 'npm';
  }
}
```

---

## 5. Error Handling & User Feedback

### Current Implementation

**Error Handling:**
- Basic try-catch with message extraction
- Rollback on generation failure (deletes partial directory)
- SIGINT handler for graceful cleanup
- Non-critical failure handling (env copy, validation)

**Example:**
```ts
// index.ts line 106-112
catch (error) {
  const message = error instanceof Error
    ? error.message
    : 'Unknown error occurred';
  logger.error(`Failed to create project: ${message}`);
  process.exit(1);
}
```

**Strengths:**
- Atomic operations (all-or-nothing generation)
- Cleanup on abort (SIGINT)
- Non-blocking warnings for non-critical steps

**Weaknesses:**
- Stack traces hidden from users (debugging difficulty)
- Generic error messages ("Failed to create project")
- No error codes or categorization
- No debug mode (--verbose flag)

### Best Practices (2026)

**Graceful Degradation:**
- ✅ Non-critical step handling (env copy, validation)
- ❌ No fallback for missing dependencies
- ❌ No retry logic for network operations

**User Feedback Quality:**
- ❌ No actionable suggestions (e.g., "Run `npm install` manually")
- ⚠️ Some suggestions present ("💡 You can install manually...")
- ❌ No error categorization (user error vs system error)

**Commander.js Error Patterns:**
```js
// Custom error with exit codes
program.error('Password must be longer than four characters', {
  exitCode: 2,
  code: 'my.custom.error'
});

// Testing with exitOverride
program.exitOverride();
try {
  program.parse();
} catch (err) {
  if (err instanceof CommanderError) {
    console.error('Code:', err.code, 'Message:', err.message);
  }
}
```

**Gap:** Walrus doesn't use custom CommanderError codes for different failure types (validation, generation, post-install)

---

## 6. Testing Strategies

### Current Implementation

**Coverage:**
- Unit tests: 11 files (`*.test.ts`) with Vitest
- Integration tests: 1 e2e test (`cli.e2e.test.mjs`)
- Test helpers: Adapter compliance, fixtures, fs-helpers
- Coverage tool: Vitest + v8 provider

**Vitest Config:**
```ts
testTimeout: 60_000,
hookTimeout: 30_000,
coverage: { provider: 'v8', reporter: ['text', 'json', 'html'] }
```

**Gaps:**
- Only 1 e2e test (limited end-to-end coverage)
- No `exitOverride()` usage for testing Commander flows
- No snapshot testing for generated projects
- No CI/CD mode testing (non-TTY scenarios)

### Best Practices (2026)

**Testing Pyramid:**
1. **Unit Tests:** ✅ Good coverage (11 files)
2. **Integration Tests:** ⚠️ Limited (1 e2e test)
3. **Snapshot Tests:** ❌ Missing (compare generated output)
4. **CLI Contract Tests:** ❌ Missing (test all flag combinations)

**Commander Testing Pattern:**
```js
// Using exitOverride for testability
const program = new Command();
program.exitOverride(); // Throw instead of exit

test('invalid argument throws error', () => {
  expect(() => {
    program.parse(['node', 'test', 'invalid']);
  }).toThrow(CommanderError);
});
```

**Recommended Additions:**
- Snapshot tests for each preset (react-mysten-simple-upload, etc.)
- CLI flag combination tests (--sdk mysten --framework react --use-case gallery)
- Non-interactive mode tests (CI/CD scenarios)
- Rollback/cleanup tests (SIGINT, generation failure)

---

## Comparison Matrix: Walrus vs Industry Standards

| Feature                     | Walrus Status | Industry Standard | Gap Priority |
|-----------------------------|---------------|-------------------|--------------|
| **Architecture**            |               |                   |              |
| Modular pipeline            | ✅ Good       | ✅ Standard       | None         |
| Custom error types          | ❌ Missing    | ✅ Recommended    | **High**     |
| exitOverride for testing    | ❌ Missing    | ✅ Best practice  | Medium       |
| **Interactive UX**          |               |                   |              |
| Dynamic prompts             | ✅ Good       | ✅ Standard       | None         |
| Progress indicators         | ❌ Missing    | ✅ Expected       | **High**     |
| Spinners for long ops       | ❌ Missing    | ✅ Expected       | Medium       |
| Cancellation handling       | ⚠️ Basic      | ✅ Graceful       | Low          |
| **Template Engine**         |               |                   |              |
| Variable substitution       | ✅ Good       | ✅ Standard       | None         |
| Conditional logic           | ❌ Missing    | ⚠️ Optional       | Low          |
| Filters/helpers             | ❌ Missing    | ⚠️ Optional       | Low          |
| **Package Manager**         |               |                   |              |
| User agent detection        | ✅ Good       | ✅ Standard       | None         |
| Lockfile detection          | ❌ Missing    | ✅ Recommended    | Medium       |
| Version validation          | ❌ Missing    | ✅ Recommended    | Low          |
| Availability check          | ❌ Missing    | ✅ Best practice  | **High**     |
| **Error Handling**          |               |                   |              |
| Atomic operations           | ✅ Good       | ✅ Best practice  | None         |
| Rollback on failure         | ✅ Good       | ✅ Best practice  | None         |
| SIGINT cleanup              | ✅ Good       | ✅ Best practice  | None         |
| Error categorization        | ❌ Missing    | ✅ Recommended    | **High**     |
| Debug/verbose mode          | ❌ Missing    | ✅ Expected       | Medium       |
| Actionable suggestions      | ⚠️ Partial    | ✅ Expected       | Medium       |
| **Testing**                 |               |                   |              |
| Unit tests                  | ✅ Good       | ✅ Standard       | None         |
| E2E tests                   | ⚠️ Limited    | ✅ Expected       | **High**     |
| Snapshot tests              | ❌ Missing    | ✅ Recommended    | Medium       |
| CLI contract tests          | ❌ Missing    | ✅ Recommended    | Medium       |

---

## Prioritized Improvement Opportunities

### High Priority (Immediate Impact)

1. **Custom Error Types** — Extend `CommanderError` for validation, generation, post-install failures
   - Enable better error handling in tests
   - Provide error codes for programmatic handling
   - Improve debugging with categorized errors

2. **Progress Indicators** — Add spinners/progress bars for:
   - File copying operations (currently silent)
   - Dependency installation (raw npm output)
   - Project validation steps

3. **Package Manager Validation** — Check if detected PM is actually installed
   - Prevent runtime failures during `pnpm install` if pnpm missing
   - Fallback to npm with warning

4. **E2E Test Coverage** — Expand from 1 test to comprehensive suite:
   - Test all preset combinations
   - Test CLI flags vs interactive mode
   - Test non-TTY (CI/CD) scenarios
   - Test rollback/cleanup flows

### Medium Priority (Quality of Life)

5. **Verbose/Debug Mode** — Add `--verbose` flag for troubleshooting
   - Show full stack traces
   - Log template resolution paths
   - Display merge operation details

6. **Lockfile Detection** — Enhance PM detection with lockfile checks
   - Respect existing project PM choice
   - Warn if mismatch between lockfile and detected PM

7. **Snapshot Testing** — Verify generated project structure
   - Catch regressions in presets
   - Validate package.json merging logic
   - Ensure .env transformation correctness

### Low Priority (Future Enhancements)

8. **Template Conditionals** — Add logic for optional features
   - Only needed if re-enabling Tailwind/Analytics layers
   - Consider Handlebars migration if complexity grows

9. **PM Version Checking** — Validate minimum versions (pnpm >= 9.0.0)
   - Low priority (documented in README)
   - Most users install latest versions

---

## References & Sources

Due to web search limitations in this session, research synthesized from:
- **Commander.js docs** (Context7: `/tj/commander.js`) — Error handling, argument validation patterns
- **Walrus codebase analysis** — Current implementation review
- **2026 CLI ecosystem trends** — General knowledge of @clack/prompts, Plop, Hygen evolution

**No live web search results available** — Recommend manual verification of:
- @clack/prompts vs prompts performance benchmarks
- 2026 package manager detection best practices
- Latest Vitest/snapshot testing patterns for CLI tools

---

## Unresolved Questions

1. **Performance impact of lockfile detection** — Does checking multiple lockfiles slow down scaffolding?
2. **User preference for verbose output** — Would users prefer detailed logs or clean output by default?
3. **Template engine migration ROI** — Is Handlebars worth the complexity for conditional layers?
4. **Alternative prompt libraries** — Should Walrus evaluate @clack/prompts for better UX?
5. **Error telemetry** — Should anonymized error reports help improve CLI quality?

---

**Next Steps:** Share findings with planner agent for roadmap prioritization.
