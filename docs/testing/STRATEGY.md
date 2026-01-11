# Test Strategy

## Overview

This repository uses a multi-layered testing strategy to ensure functional correctness, prevent regressions, and maintain deployment confidence.

## Testing Layers

### 1. Unit Tests (Vitest)
**Purpose:** Verify pure logic, individual components, and data integrity.
**Scope:** `src/data`, `src/hooks`, `src/components`.
**Tools:** Vitest, React Testing Library.

**Key Tests:**
- **Data Integrity:** Ensures `OCEANS` data adheres to the schema (ID, name, colors).
- **Hooks:** Tests `useOceanSound` for correct AudioContext initialization and state management (mocked).
- **Components:** Verifies `UIOverlay` renders correct content and handles interactions (idle state, sound toggle).

### 2. Integration Tests (Vitest + RTL)
**Purpose:** Verify interaction between components and state management.
**Scope:** `OceanWorld` (Parent component).
**Tools:** Vitest, React Testing Library.

**Key Tests:**
- **State Flow:** Verifies that clicking UI buttons in `UIOverlay` updates the state passed to `OceanScene` (mocked).
- **Rendering:** Ensures the application mounts without crashing, even with 3D canvas (mocked/polyfilled).

### 3. End-to-End (E2E) Tests (Playwright)
**Purpose:** Verify the full user journey in a real browser environment.
**Scope:** Full application flow.
**Tools:** Playwright.

**Key Tests:**
- **Loading:** Checks if the app loads and displays the initial ocean.
- **Navigation:** Simulates user clicking to switch oceans and verifies UI updates.
- **Interactions:** Checks sound toggle and responsiveness.

## CI/CD Pipeline

The GitHub Actions pipeline (`.github/workflows/ci.yml`) runs on every push and PR to `main`.

1. **Linting:** Ensures code quality.
2. **Unit & Integration Tests:** Runs `vitest` with coverage.
3. **Build:** Verifies the app builds for production.
4. **E2E Tests:** Runs Playwright tests against the build.

## Running Tests Locally

### Unit & Integration
```bash
npm run test
# or with coverage
npm run coverage
```

### End-to-End
```bash
# Install browsers first
npx playwright install
# Run tests
npx playwright test
```

## Coverage Goals
We aim for >90% coverage on core logic (hooks, data) and critical UI paths. 3D rendering logic is tested via E2E (visual presence) rather than unit tests due to WebGL complexity.
