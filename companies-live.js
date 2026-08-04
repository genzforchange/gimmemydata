/* All Companies — live-synced from the public Google Sheet.
   Reads the gviz JSON endpoint (falls back to CSV export), renders cards,
   builds filters from the data, and polls for changes while the tab is visible. */
(function () {
  var SHEET_ID = '1lY_bYmmMCO8yw-3DZ3611hkvXVp1ptSBHdZ3bedUmmA';
  var GVIZ_URL =
    'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:json';
  var CSV_URL =
    'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/export?format=csv';
  var POLL_MS = 45000;

  var TAG_CLASSES = [
    'ryd-tag-blue',
    'ryd-tag-lime',
    'ryd-tag-pink',
    'ryd-tag-orange',
    'ryd-tag-navy',
    'ryd-tag-green',
    'ryd-tag-sky',
  ];
  var ROTATE_CLASSES = [
    'ryd-rotate-l1',
    'ryd-rotate-r2',
    'ryd-rotate-l2',
    'ryd-rotate-r1',
  ];

  /**
   * Validates an external URL from the Google Sheet before placing it in a
   * navigation-sensitive attribute (href or img src).  Only https:, http:, and
   * mailto: schemes are allowed.  Pass httpsOnly=true for image src to also
   * block plain http: (mixed-content) URLs.
   * Returns '#' for anything that does not pass the allow-list.
   */
  function safeHref(url, httpsOnly) {
    if (typeof url !== 'string') return '#';
    var trimmed = url.trim();
    if (httpsOnly) {
      return /^https:/i.test(trimmed) ? trimmed : '#';
    }
    return /^(https?:|mailto:)/i.test(trimmed) ? trimmed : '#';
  }

  var CATEGORY_LABELS = {
    airline: 'Airlines',
    media: 'Media',
    bank: 'Banks',
    grocery: 'Grocery Stores',
    delivery: 'Delivery Services',
    databroker: 'Data Brokers',
    'data-broker': 'Data Brokers',
    'ride-share': 'Ride Share',
    health: 'Health',
  };

  // Per-company tag color overrides (keyed by slug) so logos stay readable.
  var TAG_OVERRIDES = {
    kroger: 'ryd-tag-orange',
    doordash: 'ryd-tag-sky',
    target: 'ryd-tag-lime',
  };

  // Works on two pages: the full list (all-companies.html, with filters)
  // and the pinned highlights (request-your-data.html, Pinned = Yes rows only).
  var grid =
    document.getElementById('all-companies-grid') ||
    document.getElementById('pinned-companies-grid');
  var pinnedOnly = !!(grid && grid.id === 'pinned-companies-grid');
  var filterSection = document.querySelector('.ryd-filters');
  var emptyState = document.getElementById('filter-empty-state');
  var statusEl = document.getElementById('companies-status');
  if (!grid) return;

  var activeFilter = 'all';
  var lastSignature = null;
  var pollTimer = null;

  /* ---------- fetching & parsing ---------- */

  function fetchRows() {
    return fetch(GVIZ_URL, { cache: 'no-store' })
      .then(function (res) {
        if (!res.ok) throw new Error('gviz HTTP ' + res.status);
        return res.text();
      })
      .then(parseGviz)
      .catch(function () {
        return fetch(CSV_URL, { cache: 'no-store' }).then(function (res) {
          if (!res.ok) throw new Error('csv HTTP ' + res.status);
          return res.text().then(parseCsv);
        });
      })
      .then(rowsToCompanies);
  }

  function parseGviz(text) {
    var start = text.indexOf('{');
    var end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('bad gviz payload');
    var data = JSON.parse(text.slice(start, end + 1));
    if (!data.table || !data.table.rows) throw new Error('bad gviz table');
    return data.table.rows.map(function (row) {
      return (row.c || []).map(function (cell) {
        return cell && cell.v != null ? String(cell.v) : '';
      });
    });
  }

  // CSV parser that handles quoted fields with embedded commas/newlines.
  function parseCsv(text) {
    var rows = [];
    var row = [];
    var field = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') {
            field += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          field += ch;
        }
      } else if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(field);
        field = '';
      } else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        field = '';
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
    if (field !== '' || row.length) {
      row.push(field);
      rows.push(row);
    }
    return rows;
  }

  function normalizeHeader(name) {
    return String(name || '').trim().toLowerCase();
  }

  function rowsToCompanies(rows) {
    if (!rows.length) return [];
    var header = rows[0].map(normalizeHeader);
    function col(names) {
      for (var i = 0; i < names.length; i++) {
        var idx = header.indexOf(names[i]);
        if (idx !== -1) return idx;
      }
      return -1;
    }
    var iName = col(['company']);
    var iLink = col(['link to dsar form', 'dsar', 'link']);
    var iInstr = col(['instructions']);
    var iCat = col(['datacategory', 'category']);
    var iLogo = col(['logo']);
    var iCopy = col(['copy']);
    var iPinned = col(['pinned']);
    var companies = [];
    for (var r = 1; r < rows.length; r++) {
      var cells = rows[r];
      var name = (cells[iName] || '').trim();
      if (!name) continue;
      companies.push({
        name: name,
        link: iLink !== -1 ? (cells[iLink] || '').trim() : '',
        instructions: iInstr !== -1 ? (cells[iInstr] || '').trim() : '',
        category: iCat !== -1 ? (cells[iCat] || '').trim().toLowerCase() : '',
        logo: iLogo !== -1 ? (cells[iLogo] || '').trim() : '',
        copy: iCopy !== -1 ? (cells[iCopy] || '').trim() : '',
        pinned:
          iPinned !== -1 && /^yes$/i.test((cells[iPinned] || '').trim()),
      });
    }
    return companies;
  }

  /* ---------- copy lightbox ---------- */

  // Placeholder until the team finalizes the request email wording.
  var DEFAULT_EMAIL_TEXT = 'sample email test';

  function usableCopy(text) {
    return text || '';
  }

  function mailtoUrl(email, bodyText) {
    return (
      'mailto:' +
      email +
      '?subject=' +
      encodeURIComponent('CCPA Data Subject Access Request') +
      '&body=' +
      encodeURIComponent(bodyText)
    );
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  function legacyCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
    } finally {
      document.body.removeChild(ta);
    }
  }

  var lightbox = null;

  function closeLightbox() {
    if (lightbox) {
      lightbox.remove();
      lightbox = null;
      document.removeEventListener('keydown', onLightboxKeydown);
    }
  }

  function onLightboxKeydown(e) {
    if (e.key === 'Escape') closeLightbox();
  }

  /**
   * Opens the copy-first lightbox.
   * opts: { companyName, copyText, continueLabel, continueHref, isEmail }
   */
  function openCopyLightbox(opts) {
    closeLightbox();
    lightbox = document.createElement('div');
    lightbox.className = 'ryd-lightbox-overlay';
    lightbox.setAttribute('data-testid', 'copy-lightbox');
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });

    var box = document.createElement('div');
    box.className = 'ryd-lightbox ryd-card';
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    box.setAttribute('aria-label', 'Copy your request text for ' + opts.companyName);

    var closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'ryd-lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('data-testid', 'button-lightbox-close');
    closeBtn.textContent = '\u00d7';
    closeBtn.addEventListener('click', closeLightbox);
    box.appendChild(closeBtn);

    var title = document.createElement('h2');
    title.className = 'ryd-card-name ryd-lightbox-title';
    title.textContent = opts.companyName;
    box.appendChild(title);

    var hint = document.createElement('p');
    hint.className = 'ryd-lightbox-hint';
    hint.textContent = opts.isEmail
      ? 'Step 1: copy this request text. Step 2: open your email — paste it into the message if it isn\u2019t already filled in.'
      : 'Step 1: copy this request text. Step 2: head to the form and paste it into the text box.';
    box.appendChild(hint);

    var textEl = document.createElement('textarea');
    textEl.className = 'ryd-lightbox-text';
    textEl.readOnly = true;
    textEl.value = opts.copyText;
    textEl.setAttribute('data-testid', 'lightbox-copy-text');
    box.appendChild(textEl);

    var actions = document.createElement('div');
    actions.className = 'ryd-lightbox-actions';

    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'ryd-button ryd-lightbox-copy';
    copyBtn.setAttribute('data-testid', 'button-copy-text');
    copyBtn.innerHTML = '<span class="ryd-checkbox" aria-hidden="true"></span> Copy Text';

    var goBtn = document.createElement('a');
    goBtn.className = 'ryd-button ryd-lightbox-go is-disabled';
    goBtn.setAttribute('data-testid', 'button-lightbox-continue');
    goBtn.setAttribute('aria-disabled', 'true');
    goBtn.textContent = opts.continueLabel;
    goBtn.href = opts.continueHref;
    if (!opts.isEmail) {
      goBtn.target = '_blank';
      goBtn.rel = 'noopener noreferrer';
    }
    goBtn.addEventListener('click', function (e) {
      if (goBtn.classList.contains('is-disabled')) {
        e.preventDefault();
        copyBtn.classList.add('ryd-nudge');
        setTimeout(function () {
          copyBtn.classList.remove('ryd-nudge');
        }, 500);
      }
    });

    copyBtn.addEventListener('click', function () {
      copyToClipboard(opts.copyText).then(function () {
        copyBtn.classList.add('is-copied');
        copyBtn.innerHTML =
          '<span class="ryd-checkbox is-checked" aria-hidden="true">\u2713</span> Copied!';
        goBtn.classList.remove('is-disabled');
        goBtn.removeAttribute('aria-disabled');
      });
    });

    actions.appendChild(copyBtn);
    actions.appendChild(goBtn);
    box.appendChild(actions);

    lightbox.appendChild(box);
    document.body.appendChild(lightbox);
    document.addEventListener('keydown', onLightboxKeydown);
    copyBtn.focus();
  }

  /* ---------- rendering ---------- */

  function slugify(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function categoryLabel(cat) {
    if (CATEGORY_LABELS[cat]) return CATEGORY_LABELS[cat];
    return cat
      .split(/[-_\s]+/)
      .map(function (w) {
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(' ');
  }

  function splitInstructions(text) {
    return text
      .split(/;|\n/)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
  }

  function isEmail(link) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(link);
  }

  function buildCard(company, index) {
    var slug = slugify(company.name);
    var card = document.createElement('div');
    card.className =
      'ryd-card ' + ROTATE_CLASSES[index % ROTATE_CLASSES.length];
    card.setAttribute('data-category', company.category || 'other');
    card.setAttribute('data-testid', 'card-' + slug);

    var body = document.createElement('div');

    var tag = document.createElement('div');
    tag.className =
      'ryd-card-tag ' +
      (TAG_OVERRIDES[slug] || TAG_CLASSES[index % TAG_CLASSES.length]);
    var heading = document.createElement('h2');
    heading.className = 'ryd-card-name';
    if (company.logo) {
      var img = document.createElement('img');
      img.src = safeHref(company.logo, true);
      img.alt = company.name;
      img.className = 'ryd-card-logo';
      img.loading = 'lazy';
      img.addEventListener('error', function () {
        heading.textContent = company.name;
      });
      heading.appendChild(img);
    } else {
      heading.textContent = company.name;
    }
    tag.appendChild(heading);
    body.appendChild(tag);

    var steps = splitInstructions(company.instructions);
    if (steps.length) {
      var ol = document.createElement('ol');
      ol.className = 'ryd-steps';
      steps.forEach(function (step) {
        var li = document.createElement('li');
        li.textContent = step;
        ol.appendChild(li);
      });
      body.appendChild(ol);
    }
    card.appendChild(body);

    var button = document.createElement('a');
    button.className = 'ryd-button';
    button.textContent = 'Request Data';
    button.setAttribute('data-testid', 'button-request-' + slug);
    var copyText = usableCopy(company.copy);
    if (company.link && isEmail(company.link)) {
      // Email companies: the mailto link already pre-fills the request text,
      // so no copy step is needed — go straight to the email draft.
      button.classList.add('email');
      button.textContent = 'Send Email';
      button.href = mailtoUrl(company.link, copyText || DEFAULT_EMAIL_TEXT);
    } else if (company.link && copyText) {
      // Forms that need pasted text: lightbox first, then continue to the site.
      button.href = '#';
      button.addEventListener('click', function (e) {
        e.preventDefault();
        openCopyLightbox({
          companyName: company.name,
          copyText: copyText,
          continueLabel: 'Go to Form',
          continueHref: safeHref(company.link),
          isEmail: false,
        });
      });
    } else if (company.link) {
      button.href = safeHref(company.link);
      button.target = '_blank';
      button.rel = 'noopener noreferrer';
    } else {
      button.classList.add('ryd-empty-button');
      button.textContent = 'Coming Soon';
    }
    card.appendChild(button);
    return card;
  }

  function buildFilters(companies) {
    var seen = [];
    companies.forEach(function (c) {
      if (c.category && seen.indexOf(c.category) === -1) seen.push(c.category);
    });
    filterSection.innerHTML = '';
    var cats = ['all'].concat(seen);
    if (cats.indexOf(activeFilter) === -1) activeFilter = 'all';
    cats.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className =
        'ryd-filter-button' + (cat === activeFilter ? ' is-active' : '');
      btn.setAttribute('data-filter', cat);
      btn.setAttribute('data-testid', 'filter-' + cat);
      btn.textContent = cat === 'all' ? 'All' : categoryLabel(cat);
      btn.addEventListener('click', function () {
        activeFilter = cat;
        filterSection
          .querySelectorAll('.ryd-filter-button')
          .forEach(function (other) {
            other.classList.toggle('is-active', other === btn);
          });
        applyFilter();
      });
      filterSection.appendChild(btn);
    });
  }

  function applyFilter() {
    var visibleCount = 0;
    grid.querySelectorAll('.ryd-card').forEach(function (card) {
      var match =
        activeFilter === 'all' ||
        card.getAttribute('data-category') === activeFilter;
      card.hidden = !match;
      if (match) visibleCount++;
    });
    grid.hidden = visibleCount === 0;
    if (emptyState) emptyState.hidden = visibleCount !== 0;
  }

  function render(companies) {
    if (pinnedOnly) {
      companies = companies.filter(function (c) {
        return c.pinned;
      });
    }
    grid.innerHTML = '';
    companies.forEach(function (company, index) {
      grid.appendChild(buildCard(company, index));
    });
    if (filterSection) {
      buildFilters(companies);
      applyFilter();
    }
  }

  function setStatus(message, isError) {
    if (!statusEl) return;
    statusEl.textContent = message || '';
    statusEl.hidden = !message;
    statusEl.classList.toggle('is-error', !!isError);
  }

  /* ---------- load + polling ---------- */

  function refresh(isFirstLoad) {
    return fetchRows()
      .then(function (companies) {
        var signature = JSON.stringify(companies);
        if (signature !== lastSignature) {
          lastSignature = signature;
          render(companies);
        }
        setStatus('');
      })
      .catch(function () {
        if (isFirstLoad && lastSignature === null) {
          setStatus(
            "We couldn't load the company list right now. Please refresh the page to try again.",
            true
          );
        }
        // On polling failures, quietly keep the last good data.
      });
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(function () {
      refresh(false);
    }, POLL_MS);
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      stopPolling();
    } else {
      refresh(false);
      startPolling();
    }
  });

  setStatus('Loading companies…');
  refresh(true).then(startPolling);
})();
