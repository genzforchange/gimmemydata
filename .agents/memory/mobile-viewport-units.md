---
name: Mobile viewport units for pinned scrollytelling
description: Why the homepage story uses svh + visualViewport instead of vh/dvh/innerHeight
---

Rule: for pinned/scroll-driven layouts, size the track, stage, and entrance offsets in `svh` (with `vh` fallback), read viewport height from `visualViewport.height` (fallback `innerHeight`), and ignore height-only resizes under ~180px on touch devices.

**Why:** `100vh` overflows the visible viewport when the mobile URL bar is shown (Chrome mobile, Safari iOS, Instagram in-app), jamming centered content to the top; `dvh` changes *while* the bar animates, causing mid-scroll jumps. `svh` is stable and always fits. URL-bar show/hide fires resize events that must not trigger re-layout.

Also: the scroll driver's scrub math must use a *cached* viewport height, refreshed only on real resizes (rotation etc.) — reading `visualViewport.height` live on every scroll tick makes progress oscillate across scene boundaries while the URL bar animates, and combined with a dwell timer that resets on backward flips, the story got permanently stuck on scene 1 (fixed Aug 2026). Fixed backgrounds that must cover the bar-collapsed strip use `100lvh` (vh fallback), not svh.

**How to apply:** any new full-viewport section or scroll-driven feature on the static site should follow this pattern; also keep `viewport-fit=cover` in the meta and `env(safe-area-inset-*)` padding on pinned stages.
