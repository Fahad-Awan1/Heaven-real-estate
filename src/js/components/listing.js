import { properties, cities, types } from '../../data/properties.js';
import { $, $$, money, params, storage } from '../core/utils.js';
import { favs, matchScore, matchProfile, subscribe } from '../core/store.js';
import { propertyCard } from './cards.js';
import { stopScroll, startScroll, ScrollTrigger } from '../core/motion.js';

// Slider position (0–100) ↔ price, on a log scale so both ends are usable.
const SCALES = { sale: [600000, 6000000], rent: [3000, 20000] };
const toPrice = (pos, status) => {
  const [lo, hi] = SCALES[status === 'rent' ? 'rent' : 'sale'];
  return Math.round(lo * Math.pow(hi / lo, pos / 100) / 1000) * 1000;
};
const toPos = (price, status) => {
  const [lo, hi] = SCALES[status === 'rent' ? 'rent' : 'sale'];
  return Math.max(0, Math.min(100, (Math.log(price / lo) / Math.log(hi / lo)) * 100));
};

/**
 * Wires the filter bar (src/partials/filters.html) to a results grid.
 * `lockedStatus` pins Buy/Rent pages to one status.
 */
export function initListing({ lockedStatus = '', limit = 0 } = {}) {
  const form = $('[data-filters]');
  const results = $('[data-results]');
  const countEl = $('[data-results-count]');
  const sheet = $('[data-sheet]');
  const backdrop = $('.sheet-backdrop');
  const q = params();

  const state = {
    status: lockedStatus || q.get('status') || '',
    city: q.get('city') || '',
    type: q.get('type') || '',
    beds: q.get('beds') || '',
    max: q.get('max') ? Number(q.get('max')) : 0,
    q: q.get('q') || '',
    sort: q.get('sort') || (matchProfile.get() ? 'match' : 'featured'),
    saved: q.get('saved') === '1',
    view: storage.get('hv-view', 'grid'),
  };

  // populate selects
  $('[data-filter="city"]', form).insertAdjacentHTML('beforeend', cities.map((c) => `<option>${c}</option>`).join(''));
  $('[data-filter="type"]', form).insertAdjacentHTML('beforeend', types.map((t) => `<option>${t}</option>`).join(''));
  if (lockedStatus) $('[data-status-seg]', form).remove();

  const fields = {
    q: $('[data-filter="q"]', form),
    city: $('[data-filter="city"]', form),
    type: $('[data-filter="type"]', form),
    beds: $('[data-filter="beds"]', form),
    max: $('[data-filter="max"]', form),
    sort: $('[data-filter="sort"]'),
  };
  const maxOut = $('[data-max-out]', form);

  function syncInputs() {
    fields.q.value = state.q;
    fields.city.value = state.city;
    fields.type.value = state.type;
    fields.beds.value = state.beds;
    if (fields.sort) fields.sort.value = state.sort;
    fields.max.value = state.max ? toPos(state.max, state.status) : 100;
    fields.max.style.setProperty('--fill', `${fields.max.value}%`);
    maxOut.textContent = state.max ? `${money(state.max, { compact: true })}${state.status === 'rent' ? '/mo' : ''}` : 'Any';
    $$('[data-status]', form).forEach((b) => b.setAttribute('aria-pressed', b.dataset.status === state.status));
    $$('[data-view]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.view === state.view));
    results.classList.toggle('is-list', state.view === 'list');
    const active = ['city', 'type', 'beds', 'max'].filter((k) => state[k]).length + (state.status && !lockedStatus ? 1 : 0);
    const fc = $('[data-filter-count]', form);
    if (fc) fc.textContent = active ? `(${active})` : '';
  }

  function filtered() {
    const term = state.q.trim().toLowerCase();
    let list = properties.filter((p) => {
      if (state.saved && !favs.has(p.id)) return false;
      if (state.status && p.status !== state.status) return false;
      if (state.city && p.city !== state.city) return false;
      if (state.type && p.type !== state.type) return false;
      if (state.beds && p.beds < Number(state.beds)) return false;
      if (state.max) {
        // with "All" selected, the cap applies on the scale it was set for
        const scale = state.status || 'sale';
        if (p.status === scale && p.price > state.max) return false;
      }
      if (term) {
        const hay = [p.title, p.city, p.type, p.address, ...p.tags, ...p.features].join(' ').toLowerCase();
        if (!term.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      return true;
    });
    const by = {
      featured: (a, b) => b.featured - a.featured,
      match: (a, b) => (matchScore(b) ?? 0) - (matchScore(a) ?? 0),
      'price-asc': (a, b) => a.price - b.price,
      'price-desc': (a, b) => b.price - a.price,
      newest: (a, b) => b.year - a.year,
      size: (a, b) => b.sqft - a.sqft,
    }[state.sort];
    if (by) list = [...list].sort(by);
    return limit ? list.slice(0, limit) : list;
  }

  function render() {
    const list = filtered();
    $('[data-saved-note]')?.toggleAttribute('hidden', !state.saved);
    countEl.innerHTML = `<strong>${list.length}</strong> ${list.length === 1 ? 'home' : 'homes'}${state.city ? ` in ${state.city}` : ''}`;
    if (!list.length) {
      results.innerHTML = `<div class="empty" style="grid-column:1/-1">
        <h3>${state.saved ? 'No saved homes yet' : 'No homes match those filters'}</h3>
        <p>${state.saved ? 'Tap the ♥ on any home to save it here.' : 'Try widening your budget or area, or ask Halo to alert you when one arrives.'}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
          <button class="btn btn--dark btn--sm" type="button" data-reset>Clear filters</button>
          <button class="btn btn--ghost btn--sm" type="button" data-open-chat="Alert me to new listings">Get alerts</button>
        </div></div>`;
    } else {
      results.innerHTML = list
        .map((p, i) =>
          propertyCard(p, { compareToggle: true, index: i, eager: i < 2, sizes: '(max-width: 700px) 92vw, (max-width: 1100px) 46vw, 30vw' }),
        )
        .join('');
    }
    syncInputs();
    writeUrl();
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }

  function writeUrl() {
    const u = new URLSearchParams();
    ['status', 'city', 'type', 'beds', 'q'].forEach((k) => state[k] && !(k === 'status' && lockedStatus) && u.set(k, state[k]));
    if (state.max) u.set('max', state.max);
    if (state.saved) u.set('saved', '1');
    if (state.sort !== 'featured') u.set('sort', state.sort);
    history.replaceState(null, '', `${location.pathname}${u.toString() ? `?${u}` : ''}`);
  }

  let typingTimer;
  fields.q.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(() => {
      state.q = fields.q.value;
      render();
    }, 180);
  });
  ['city', 'type', 'beds'].forEach((k) =>
    fields[k].addEventListener('change', () => {
      state[k] = fields[k].value;
      render();
    }),
  );
  fields.sort?.addEventListener('change', () => {
    state.sort = fields.sort.value;
    if (state.sort === 'match' && !matchProfile.get()) {
      import('./quiz.js').then((m) => m.openQuiz());
    }
    render();
  });
  fields.max.addEventListener('input', () => {
    const pos = Number(fields.max.value);
    state.max = pos >= 100 ? 0 : toPrice(pos, state.status);
    maxOut.textContent = state.max ? `${money(state.max, { compact: true })}${state.status === 'rent' ? '/mo' : ''}` : 'Any';
  });
  fields.max.addEventListener('change', render);
  $$('[data-status]', form).forEach((b) =>
    b.addEventListener('click', () => {
      state.status = b.dataset.status;
      state.max = 0;
      render();
    }),
  );
  $$('[data-view]').forEach((b) =>
    b.addEventListener('click', () => {
      state.view = b.dataset.view;
      storage.set('hv-view', state.view);
      syncInputs();
    }),
  );
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-reset]')) return;
    Object.assign(state, { status: lockedStatus, city: '', type: '', beds: '', max: 0, q: '', saved: false });
    render();
  });

  // mobile filter sheet
  const openSheet = (open) => {
    sheet.classList.toggle('is-open', open);
    backdrop?.classList.toggle('is-open', open);
    open ? stopScroll() : startScroll();
  };
  $('[data-sheet-open]', form)?.addEventListener('click', () => openSheet(true));
  $$('[data-sheet-close]').forEach((b) => b.addEventListener('click', () => openSheet(false)));

  // re-render when favourites/match profile change (saved view + match badges)
  let lastProfile = JSON.stringify(matchProfile.get());
  let lastFavs = favs.all().join();
  subscribe(() => {
    const profile = JSON.stringify(matchProfile.get());
    const saved = favs.all().join();
    if (profile !== lastProfile || (state.saved && saved !== lastFavs)) render();
    lastProfile = profile;
    lastFavs = saved;
  });

  render();
  return { state, render };
}
