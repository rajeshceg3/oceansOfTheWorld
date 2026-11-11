# Verify oceansOfTheWorld
Deep Blue - interactive ocean exploration (vite + React, vitest unit tests, playwright e2e config).
## Launch
npm install, then npm run dev or npm run build && npm run preview.
## Doctor
`python3 .cursor/skills/verify-oceans-of-the-world/verify.py`
## Drive
Runs the vitest suite, builds with vite, renders the built app in headless Chromium asserting the boot marker and zero JS console errors.
## Evidence
`.cursor/skills/verify-oceans-of-the-world/evidence.json`
## Cleanup
Static/streamlit server terminated after the render.
## Known boundaries
Render smoke only; scene quality unverified. Playwright e2e configs are not exercised (chromium-only sandbox).
