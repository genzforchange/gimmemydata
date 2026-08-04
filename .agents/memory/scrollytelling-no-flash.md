---
name: Scrollytelling no-flash setup
description: Avoiding a visible fade-out of the static fallback when JS enables a pinned/animated layout on load
---

Rule: when JS progressively enhances a static fallback layout into an animated/pinned one (e.g. adding an "animate" class that sets inactive elements to `opacity: 0` with a transition), do NOT define the transition on the base animated state. Gate the `transition` property behind a separate "ready" class added one or two `requestAnimationFrame`s after setup.

**Why:** the pre-JS static layout paints at full opacity; when the animate class lands, inactive elements *transition* from 1 → 0 instead of snapping hidden, producing ghost/overlapping content for ~0.5s on load (caught via screenshot on the How It Works scrollytelling page, July 2026).

**How to apply:** `story.classList.add('animate'); setInitialState(); rAF(() => rAF(() => story.classList.add('ready')));` and in CSS put `transition: ...` only under `.animate.ready .scene`. Reduced-motion/no-JS paths never get either class.
