/* Pinned "how it works" scrollytelling.
   The scene markup lives in partials/how-it-works-story.html and is
   injected into #hiw-story-mount at load time so index.html stays small.

   The story is a flat sequence of "beats": each scene declares data-beats,
   and every beat pairs a short text statement with the visual(s) it
   introduces (classes d1..dN, revealed via r1..rN on the scene). Scroll
   progress maps proportionally onto the beat sequence, so text and imagery
   always move together. */
(function () {
  var FRAGMENT_URL = 'partials/how-it-works-story.html';
  var MAX_GROUPS = 8;
  // scroll track length per beat, in small-viewport-height units. ~½ screen
  // of scrolling per beat keeps the pacing unhurried without feeling endless.
  var TRACK_PER_BEAT = 55;
  // after the last beat is revealed, hold it for this fraction of a
  // viewport before releasing to the normal page flow (avoids dead scroll)
  var RELEASE_BEAT = 0.35;
  // minimal smoothing so a fast flick still lands each *scene* as a distinct
  // moment (beats within a scene are never gated, so scrolling never feels
  // blocked)
  var SCENE_DWELL_MS = 250;
  // on touch devices, height-only resizes smaller than this are URL-bar /
  // toolbar show-hide events and must not trigger a re-layout mid-scroll
  var URLBAR_RESIZE_PX = 180;

  var supportsSvh = false;
  try {
    supportsSvh = window.CSS && CSS.supports && CSS.supports('height', '1svh');
  } catch (e) { /* older browsers: fall back to vh */ }

  var getViewportHeight = function () {
    // visualViewport tracks what's actually visible (URL bar collapsed or
    // not); innerHeight is the fallback
    if (window.visualViewport && window.visualViewport.height) {
      return window.visualViewport.height;
    }
    return window.innerHeight || document.documentElement.clientHeight;
  };

  var initStory = function (story, mount) {
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var scenes = Array.prototype.slice.call(story.querySelectorAll('.scene'));
    var scrollCue = story.querySelector('.scroll-cue');
    var replayBtn = document.querySelector('.replay-intro');

    if (!scenes.length) return;

    // beats per scene + cumulative start offsets into the flat beat sequence
    var beatsPerScene = scenes.map(function (s) {
      var n = parseInt(s.getAttribute('data-beats'), 10);
      return n > 0 ? Math.min(n, MAX_GROUPS) : 1;
    });
    var beatStart = [];
    var totalBeats = 0;
    beatsPerScene.forEach(function (n) {
      beatStart.push(totalBeats);
      totalBeats += n;
    });

    // When arriving from a "Home" link (index.html#content), skip the story
    // and land directly on the main content.
    var skipStory = window.location.hash === '#content';

    var settleMount = function (settled) {
      if (mount) mount.classList.toggle('hiw-settled', settled);
    };

    var setReveal = function (el, n) {
      for (var k = 1; k <= MAX_GROUPS; k++) {
        el.classList.toggle('r' + k, k <= n);
      }
    };

    var setSceneState = function (idx, revealed) {
      scenes.forEach(function (el, i) {
        el.classList.remove('is-active', 'is-prev');
        if (i < idx) {
          // passed scenes stay fully revealed so scrolling back up is seamless
          el.classList.add('is-prev', 'in-view');
          setReveal(el, MAX_GROUPS);
        } else if (i === idx) {
          el.classList.add('is-active');
          el.classList.remove('in-view');
          setReveal(el, revealed);
        } else {
          // scenes ahead reset so their build-up replays when reached
          el.classList.remove('in-view');
          setReveal(el, 0);
        }
      });
    };

    // Reduced motion: static stacked layout with finished diagrams.
    if (reduceMotion) {
      scenes.forEach(function (s) { s.classList.add('in-view'); });
      settleMount(true);
      if (skipStory) {
        story.style.display = 'none';
        window.scrollTo(0, 0);
      }
      return;
    }

    story.classList.add('hiw-animate');
    // total track height scales with the number of beats. svh units are
    // stable while the mobile URL bar collapses/expands, so the track never
    // resizes mid-scroll; vh is the fallback for older browsers.
    var trackUnits = totalBeats * TRACK_PER_BEAT + 100;
    story.style.height = trackUnits + (supportsSvh ? 'svh' : 'vh');
    setSceneState(0, 0);

    // Enable scene transitions only after the hidden initial state has painted,
    // so the static fallback layout never visibly fades out on load.
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        story.classList.add('hiw-ready');
      });
    });

    var storyDone = false;
    var ticking = false;
    // light scene smoothing: the scene currently on screen, when it last
    // changed, and a timer that re-runs the update once the dwell elapses
    var shownIdx = 0;
    var lastAdvance = Date.now();
    var dwellTimer = null;
    var collapseTimer = null;
    var settleRaf = null;

    var finishCollapse = function () {
      scenes.forEach(function (s) { s.classList.add('in-view'); });
      story.style.display = 'none';
      settleMount(true);
      // with the track removed, the top of the document is the main
      // header, so land exactly there (no overshoot from fast scrolling)
      window.scrollTo(0, 0);
    };

    var collapseStory = function () {
      storyDone = true;
      if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
      // let the final scene animate out (is-prev fades it upward) instead of
      // cutting straight from a fully visible scene to the page header
      setSceneState(scenes.length, 0);
      collapseTimer = setTimeout(function () {
        collapseTimer = null;
        // glide DOWN through the leftover track to where the home content
        // begins (the track sits above the header in the document, so going
        // up would rewind many screens). Once the header is at the top of the
        // viewport, swapping the track out + jumping to 0 is visually a
        // no-op, so the whole thing reads as one continuous downward motion.
        var rect = story.getBoundingClientRect();
        var target = rect.top + (window.scrollY || window.pageYOffset || 0) + story.offsetHeight;
        if (!('scrollBehavior' in document.documentElement.style)) {
          finishCollapse();
          return;
        }
        window.scrollTo({ top: target, behavior: 'smooth' });
        var started = Date.now();
        var watchSettle = function () {
          settleRaf = null;
          var y = window.scrollY || window.pageYOffset || 0;
          // done once the header has reached the viewport top; 2.5s cap in
          // case the browser interrupts the smooth scroll (e.g. the user
          // scrolls mid-glide)
          if (y >= target - 1 || Date.now() - started > 2500) {
            finishCollapse();
            return;
          }
          settleRaf = window.requestAnimationFrame(watchSettle);
        };
        settleRaf = window.requestAnimationFrame(watchSettle);
      }, 650);
    };

    var scheduleDwellTick = function () {
      var remaining = SCENE_DWELL_MS - (Date.now() - lastAdvance);
      if (remaining < 0) remaining = 0;
      if (dwellTimer) clearTimeout(dwellTimer);
      dwellTimer = setTimeout(function () {
        dwellTimer = null;
        requestStoryUpdate();
      }, remaining + 30);
    };

    var updateStory = function () {
      ticking = false;
      if (storyDone) return;
      var vh = getViewportHeight();
      var trackHeight = story.offsetHeight;
      var scrubRegion = trackHeight - vh;
      var y = window.scrollY || window.pageYOffset || 0;

      // release once the scrub is complete plus a short "hold" beat, rather
      // than making the user scroll the whole remaining viewport of track
      var releaseY = Math.min(scrubRegion + vh * RELEASE_BEAT, trackHeight - 1);

      var p = scrubRegion > 0 ? y / scrubRegion : 0;
      if (p < 0) p = 0; if (p > 1) p = 1;

      // proportional scrub across the flat beat sequence
      var beatPos = p * totalBeats;
      var idx = 0;
      for (var i = scenes.length - 1; i >= 0; i--) {
        if (beatPos >= beatStart[i]) { idx = i; break; }
      }
      if (p >= 1) idx = scenes.length - 1;

      // beats within the active scene reveal in direct proportion to scroll —
      // no gating, so each sentence and its visual arrive together
      var revealed = Math.ceil(beatPos - beatStart[idx]);
      if (revealed < 1) revealed = 1;
      if (revealed > beatsPerScene[idx]) revealed = beatsPerScene[idx];

      // light smoothing on *scene* changes only: a fast flick still shows
      // each chapter for a moment, but never long enough to feel stuck
      if (idx > shownIdx) {
        if (Date.now() - lastAdvance >= SCENE_DWELL_MS) {
          shownIdx += 1;
          lastAdvance = Date.now();
        }
        if (shownIdx < idx) {
          // still behind the scroll target: show current scene fully
          // revealed and try again once the dwell elapses
          setSceneState(shownIdx, MAX_GROUPS);
          scheduleDwellTick();
          return;
        }
      } else if (idx < shownIdx) {
        // scrolling back up follows the scroll position immediately
        shownIdx = idx;
        lastAdvance = Date.now();
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
      }

      // release only after the final scene's beats are all on screen
      if (y >= releaseY) {
        if (shownIdx >= scenes.length - 1) {
          collapseStory();
          return;
        }
        setSceneState(shownIdx, MAX_GROUPS);
        scheduleDwellTick();
        return;
      }

      setSceneState(shownIdx, revealed);

      if (scrollCue) {
        if (y > 40) scrollCue.classList.add('hide');
        else scrollCue.classList.remove('hide');
      }
    };

    var requestStoryUpdate = function () {
      if (!ticking) { window.requestAnimationFrame(updateStory); ticking = true; }
    };

    window.addEventListener('scroll', requestStoryUpdate, { passive: true });

    // Ignore height-only resizes caused by the mobile URL bar collapsing or
    // expanding — recomputing mid-scroll makes the story jump. Width changes
    // and large height changes (rotation, split-screen) still update.
    var isTouch = 'ontouchstart' in window ||
      (window.navigator && window.navigator.maxTouchPoints > 0);
    var lastW = window.innerWidth;
    var lastH = getViewportHeight();
    var onResize = function () {
      if (storyDone) return;
      var w = window.innerWidth;
      var h = getViewportHeight();
      var heightOnly = w === lastW && Math.abs(h - lastH) < URLBAR_RESIZE_PX;
      lastW = w;
      lastH = h;
      if (isTouch && heightOnly) return;
      requestStoryUpdate();
    };
    window.addEventListener('resize', onResize, { passive: true });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', onResize, { passive: true });
    }

    if (replayBtn) {
      replayBtn.classList.add('is-visible');
      replayBtn.addEventListener('click', function () {
        storyDone = false;
        shownIdx = 0;
        lastAdvance = Date.now();
        if (dwellTimer) { clearTimeout(dwellTimer); dwellTimer = null; }
        if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; }
        if (settleRaf) { window.cancelAnimationFrame(settleRaf); settleRaf = null; }
        story.style.display = '';
        settleMount(false);
        // clear all scene state so the build-up replays from scratch
        scenes.forEach(function (s) {
          s.classList.remove('is-active', 'is-prev', 'in-view');
          setReveal(s, 0);
        });
        void story.offsetHeight; // force reflow so transitions restart
        setSceneState(0, 0);
        if (scrollCue) scrollCue.classList.remove('hide');
        window.scrollTo(0, 0);
        updateStory();
      });
    }

    if (skipStory) {
      storyDone = true;
      scenes.forEach(function (s) { s.classList.add('in-view'); });
      story.style.display = 'none';
      settleMount(true);
      window.scrollTo(0, 0);
      return;
    }

    updateStory();
  };

  document.addEventListener('DOMContentLoaded', function () {
    // If the story markup is already on the page, just initialize it.
    var existing = document.querySelector('.hiw-story');
    if (existing) { initStory(existing, null); return; }

    var mount = document.getElementById('hiw-story-mount');
    if (!mount) return;

    var showFallback = function () {
      mount.classList.add('hiw-load-failed', 'hiw-settled');
    };

    fetch(FRAGMENT_URL)
      .then(function (res) {
        if (!res.ok) throw new Error('fragment HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        mount.innerHTML = html;
        var story = mount.querySelector('.hiw-story');
        if (story) initStory(story, mount);
        else showFallback();
      })
      .catch(showFallback);
  });
})();
