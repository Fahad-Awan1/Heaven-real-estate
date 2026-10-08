import { $, $$, reducedMotion, toast, session, onIdle } from './core/utils.js';
import { favs, compare, subscribe } from './core/store.js';
import { getProperty } from '../data/properties.js';
import { icons } from './core/icons.js';
import {
  gsap,
  ScrollTrigger,
  initSmoothScroll,
  initReveals,
  initCounters,
  initParallax,
  initRollLinks,
  lenis,
  stopScroll,
  startScroll,
} from './core/motion.js';
import { money } from './core/utils.js';
import { initSelects } from './components/select.js';

const root = document.documentElement;

/* ---------------- Preloader ---------------- */
function runPreloader() {
  const el = $('#preloader');
  if (!root.classList.contains('pl-first') || !el) return Promise.resolve();
  session.set('hv-visited', 1);
  const countEl = $('[data-count]', el);
  const state = { p: 0 };
  // Wait for the display font (so the headline doesn't reflow), never for heavy assets
  const fontsReady = document.fonts?.ready ?? Promise.resolve();
  const fast = reducedMotion();
  return new Promise((resolve) => {
    const render = () => {
      countEl.textContent = `${Math.round(state.p)}%`;
      el.style.setProperty('--p', state.p / 100);
    };
    const first = gsap.to(state, { p: 76, duration: fast ? 0.2 : 1, ease: 'power2.inOut', onUpdate: render });
    const pageReady = Promise.race([fontsReady, new Promise((r) => setTimeout(r, 1200))]);
    Promise.all([first.then(), pageReady]).then(() => {
      gsap.to(state, {
        p: 100,
        duration: fast ? 0.2 : 0.45,
        ease: 'power2.out',
        onUpdate: render,
        onComplete() {
          el.classList.add('is-done');
          setTimeout(resolve, fast ? 50 : 450);
          setTimeout(() => el.remove(), 1200);
        },
      });
    });
  });
}

/* ---------------- Page transitions + prefetch ---------------- */
function isInternal(a) {
  if (!a || a.target === '_blank' || a.hasAttribute('download')) return false;
  const url = new URL(a.href, location.href);
  if (url.origin !== location.origin) return false;
  if (url.pathname === location.pathname && url.search === location.search && url.hash) return false;
  return /\.html$|\/$/.test(url.pathname);
}
function initTransitions() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!isInternal(a) || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    if (reducedMotion()) return;
    e.preventDefault();
    const href = a.href;
    root.classList.remove('pt-enter');
    root.classList.add('is-leaving');
    try {
      sessionStorage.setItem('hv-transition', '1');
    } catch {}
    setTimeout(() => (location.href = href), 620);
  });
  addEventListener('pageshow', (e) => {
    if (e.persisted) root.classList.remove('is-leaving', 'pt-enter');
  });

  const prefetched = new Set();
  const prefetch = (e) => {
    const a = e.target.closest?.('a[href]');
    if (!isInternal(a)) return;
    const url = new URL(a.href).pathname;
    if (prefetched.has(url)) return;
    prefetched.add(url);
    const l = document.createElement('link');
    l.rel = 'prefetch';
    l.href = url;
    document.head.appendChild(l);
  };
  document.addEventListener('pointerover', prefetch, { passive: true });
  document.addEventListener('touchstart', prefetch, { passive: true });
}

/* ---------------- Header & menu ---------------- */
function initHeader() {
  const header = $('#site-header');
  if (!header) return;
  const path = location.pathname.replace(/\/index\.html$/, '/');
  $$('.nav a, .mobile-menu nav a', header.parentElement).forEach((a) => {
    const href = new URL(a.href).pathname;
    const match = href === path || (path === '/property.html' && href === '/properties.html') || (path === '/article.html' && href === '/journal.html');
    if (match) a.setAttribute('aria-current', 'page');
  });
  if (document.body.dataset.header === 'solid') header.classList.add('is-solid');

  let lastY = 0;
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    header.classList.toggle('is-hidden', y > 500 && y > lastY + 4 && !root.classList.contains('menu-open'));
    if (y < lastY - 4 || y < 500) header.classList.remove('is-hidden');
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const toggle = $('.menu-toggle');
  const menu = $('#mobile-menu');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
    open ? stopScroll() : startScroll();
  };
  toggle?.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
  // actions inside the menu (quiz, chat) open overlays of their own
  menu.addEventListener('click', (e) => e.target.closest('[data-open-quiz], [data-open-chat]') && setMenu(false));
  addEventListener('keydown', (e) => e.key === 'Escape' && root.classList.contains('menu-open') && setMenu(false));
  addEventListener('resize', () => innerWidth >= 1180 && root.classList.contains('menu-open') && setMenu(false));
}

/* ---------------- Theme ---------------- */
function initTheme() {
  const btn = $('[data-theme-toggle]');
  if (!btn) return;
  const isDark = () =>
    root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  const paint = () => {
    btn.innerHTML = isDark() ? icons.sun : icons.moon;
    btn.setAttribute('aria-label', isDark() ? 'Switch to light mode' : 'Switch to dark mode');
  };
  btn.addEventListener('click', () => {
    root.dataset.theme = isDark() ? 'light' : 'dark';
    try {
      localStorage.setItem('hv-theme', root.dataset.theme);
    } catch {}
    paint();
    dispatchEvent(new CustomEvent('themechange'));
  });
  paint();
}

/* ---------------- Favourites & compare ---------------- */
function initCollections() {
  const countEl = $('[data-fav-count]');
  const tray = $('.compare-tray');
  const modal = $('#compare-modal');

  const paint = () => {
    const n = favs.all().length;
    if (countEl) {
      countEl.textContent = n;
      countEl.classList.toggle('is-on', n > 0);
    }
    $$('[data-fav]').forEach((b) => {
      const on = favs.has(b.dataset.fav);
      b.classList.toggle('is-fav', on);
      b.setAttribute('aria-pressed', on);
    });
    const list = compare.all().map(getProperty).filter(Boolean);
    $$('[data-compare]').forEach((c) => (c.checked = compare.has(c.dataset.compare)));
    if (tray) {
      tray.classList.toggle('is-on', list.length > 0);
      $('.thumbs', tray).innerHTML = list.map((p) => `<img src="/images/${p.img}-sm.webp" alt="">`).join('');
      $('.label', tray).textContent = `${list.length}/3 selected`;
      $('[data-compare-open]', tray).disabled = list.length < 2;
      $('[data-compare-open]', tray).style.opacity = list.length < 2 ? 0.5 : 1;
    }
  };
  subscribe(paint);
  paint();

  document.addEventListener('click', (e) => {
    const favBtn = e.target.closest('[data-fav]');
    if (favBtn) {
      e.preventDefault();
      const added = favs.toggle(favBtn.dataset.fav);
      toast(added ? '♥ Saved to your homes' : 'Removed from saved homes');
    }
  });
  document.addEventListener('change', (e) => {
    const box = e.target.closest('[data-compare]');
    if (!box) return;
    const res = compare.toggle(box.dataset.compare);
    if (!res.ok) {
      box.checked = false;
      toast('You can compare up to 3 homes');
    }
  });

  const openModal = () => {
    const list = compare.all().map(getProperty).filter(Boolean);
    const rows = [
      ['', (p) => `<img src="/images/${p.img}-sm.webp" alt=""><strong style="display:block;margin-top:8px">${p.title}</strong>`],
      ['Price', (p) => money(p.price) + (p.status === 'rent' ? ' /mo' : '')],
      ['Location', (p) => p.city],
      ['Type', (p) => p.type],
      ['Bedrooms', (p) => p.beds],
      ['Bathrooms', (p) => p.baths],
      ['Size', (p) => `${p.sqft.toLocaleString()} ft²`],
      ['Price / ft²', (p) => (p.status === 'sale' ? money(p.price / p.sqft) : '—')],
      ['Built', (p) => p.year],
      ['Walkability', (p) => `${p.vibe.walk}/100`],
      ['Schools', (p) => `${p.vibe.schools}/100`],
      ['Highlights', (p) => p.tags.join(', ')],
      ['', (p) => `<a class="btn btn--dark btn--sm" href="/property.html?id=${p.id}">View</a>`],
    ];
    $('[data-compare-body]', modal).innerHTML = `<table class="compare-table"><tbody>${rows
      .map(([label, fn]) => `<tr><th>${label}</th>${list.map((p) => `<td>${fn(p)}</td>`).join('')}</tr>`)
      .join('')}</tbody></table>`;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    stopScroll();
  };
  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    startScroll();
  };
  $('[data-compare-open]')?.addEventListener('click', openModal);
  $('[data-compare-clear]')?.addEventListener('click', () => compare.clear());
  modal?.addEventListener('click', (e) => e.target.closest('[data-modal-close]') && closeModal());
  addEventListener('keydown', (e) => e.key === 'Escape' && modal?.classList.contains('is-open') && closeModal());
}

/* ---------------- Chatbot (lazy) ---------------- */
function initChatLauncher() {
  const launcher = $('.chat-launcher');
  if (!launcher) return;
  let mod;
  const open = async () => {
    mod ||= await import('./components/chatbot.js');
    mod.openChat();
  };
  launcher.addEventListener('click', open);
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-open-chat]');
    if (!t) return;
    e.preventDefault();
    open().then(() => t.dataset.openChat && mod.ask(t.dataset.openChat));
  });
  if (!session.get('hv-nudged', false)) {
    setTimeout(() => {
      const nudge = $('.nudge', launcher);
      if (root.classList.contains('chat-open')) return;
      nudge.classList.add('is-on');
      session.set('hv-nudged', true);
      setTimeout(() => nudge.classList.remove('is-on'), 6000);
    }, 9000);
  }
}

function initQuizLauncher() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('[data-open-quiz]')) return;
    e.preventDefault();
    import('./components/quiz.js').then((m) => m.openQuiz());
  });
}

function initRanges() {
  const paint = (r) => r.style.setProperty('--fill', `${((r.value - r.min) / (r.max - r.min || 1)) * 100}%`);
  document.addEventListener('input', (e) => e.target.matches?.('input[type="range"]') && paint(e.target));
  requestAnimationFrame(() => $$('input[type="range"]').forEach(paint));
}

function initForms() {
  $$('[data-newsletter]').forEach((f) =>
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = $('input', f);
      if (!/^\S+@\S+\.\S+$/.test(input.value)) return toast('Please enter a valid email address');
      input.value = '';
      toast('Thanks! New listings will land in your inbox.');
    }),
  );
  $$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));
}

/* ---------------- Boot ---------------- */
let readyResolve;
/** Resolves when the preloader / page-enter curtain is out of the way. */
export const ready = new Promise((r) => (readyResolve = r));

function boot() {
  initSmoothScroll();
  initRollLinks();
  initHeader();
  initTheme();
  initTransitions();
  initCollections();
  initChatLauncher();
  initQuizLauncher();
  initForms();
  initRanges();
  // after page modules have populated their selects
  setTimeout(() => initSelects(), 0);

  runPreloader().then(() => {
    const delay = root.classList.contains('pt-enter') ? 450 : 0;
    setTimeout(() => {
      readyResolve();
      initReveals();
      initCounters();
      initParallax();
      onIdle(() => ScrollTrigger.refresh());
    }, delay);
  });
  addEventListener('load', () => ScrollTrigger.refresh());
}
boot();

export { lenis };
