---
name: Mobile viewport units for pinned scrollytelling
description: Why the homepage story uses svh + visualViewport instead of vh/dvh/innerHeight
---

Rule: for pinned/scroll-driven layouts, size the track, stage, and entrance offsets in `svh` (with `vh` fallback), read viewport height from `visualViewport.height` (fallback `innerHeight`), and ignore height-only resizes under ~180px on touch devices.

**Why:** `100vh` overflows the visible viewport when the mobile URL bar is shown (Chrome mobile, Safari iOS, Instagram in-app), jamming centered content to the top; `dvh` changes *while* the bar animates, causing mid-scroll jumps. `svh` is stable and always fits. URL-bar show/hide fires resize events that must not trigger re-layout.

**How to apply:** any new full-viewport section or scroll-driven feature on the static site should follow this pattern; also keep `viewport-fit=cover` in the meta and `env(safe-area-inset-*)` padding on pinned stages.
