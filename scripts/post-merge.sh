#!/bin/bash
set -e

# Static HTML/CSS/JS site — no build step needed for the main app.

# Install mockup sandbox dependencies if the sandbox exists and deps are missing/stale.
if [ -f artifacts/mockup-sandbox/package.json ]; then
  cd artifacts/mockup-sandbox
  npm install --no-audit --no-fund
  cd - > /dev/null
fi
