---
name: serve static hosting (multi-page)
description: How the `serve` npm package must be configured for multi-page static sites on this project
---

# `serve -s` breaks multi-page static sites

The workflow serves this static site with the `serve` npm package. Do NOT pass the
`-s` / `--single` (SPA) flag on a multi-page site.

**Why:** `-s` rewrites every route that doesn't match a file exactly to `index.html`.
Combined with `serve`'s default clean-URL behavior (it 301-redirects `/foo.html` →
`/foo`), any subpage becomes unreachable: `/foo.html` → 301 `/foo` → SPA fallback →
`index.html`. Symptom: every subpage silently renders the homepage.

**How to apply:** For a multi-page static site, run `npx -y serve . -l 5000` (no `-s`).
Then `serve` serves each HTML file at its extension-less clean URL (`/take-action`,
`/request-your-data`). Internal links written as `foo.html` still work — they 301 to
`/foo`. Use `-s` only for true single-page apps (React Router, etc.).
