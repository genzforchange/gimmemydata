---
name: Mockup sandbox install quirks
description: npm install failures in artifacts/mockup-sandbox and the post-merge setup that prevents them
---

**Rule:** If the mockup sandbox dev server fails with `vite: not found` or `npm install` errors with `ENOTEMPTY`, delete `artifacts/mockup-sandbox/node_modules` entirely and reinstall.

**Why:** Partially-written node_modules (from interrupted installs or merges) leave npm unable to reconcile directories, and the workflow fails silently until logs are checked.

**How to apply:** `rm -rf artifacts/mockup-sandbox/node_modules && (cd artifacts/mockup-sandbox && npm install)`, then restart the "artifacts/mockup-sandbox: Component Preview Server" workflow. A post-merge script at `scripts/post-merge.sh` (configured in `.replit`) runs `npm install` there automatically after task merges.
