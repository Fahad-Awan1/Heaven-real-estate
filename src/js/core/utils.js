export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const finePointer = () => window.matchMedia('(pointer: fine)').matches;
export const isMobile = () => window.innerWidth < 768;

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const lerp = (a, b, t) => a + (b - a) * t;

/**
 * Pakistani rupees, quoted the way Pakistanis do: crore (1,00,00,000) and lakh (1,00,000).
 * `compact` shortens the unit ("PKR 4.5 Cr"); `exact` prints the full figure ("PKR 345,600").
 */
export function money(n, { compact = false, exact = false } = {}) {
  const trim = (v) => v.toFixed(2).replace(/\.?0+$/, '');
  const v = Math.round(n);
  if (!exact && v >= 1e7) return `PKR ${trim(v / 1e7)} ${compact ? 'Cr' : 'Crore'}`;
  if (!exact && v >= 1e5) return `PKR ${trim(v / 1e5)} Lakh`;
  if (!exact && compact && v >= 1e3) return `PKR ${Math.round(v / 1e3)}K`;
  return 'PKR ' + v.toLocaleString('en-US');
}
export const priceLabel = (p) => (p.status === 'rent' ? `${money(p.price)}<small> /mo</small>` : money(p.price));

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}

/** Responsive <img> for an image saved by scripts/fetch-images.mjs */
export function img(name, alt, { sizes = '(max-width: 768px) 92vw, 33vw', eager = false, cls = 'tone', w = 720, h = 480 } = {}) {
  return `<img class="${cls}" src="/images/${name}-sm.webp" srcset="/images/${name}-sm.webp 860w, /images/${name}-lg.webp 1600w" sizes="${sizes}" alt="${escapeHtml(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
}

export const storage = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};
export const session = {
  get(key, fallback) {
    try {
      const v = sessionStorage.getItem(key);
      return v == null ? fallback : JSON.parse(v);
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {}
  },
};

let toastTimer;
export function toast(message) {
  const el = $('.toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('is-on');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('is-on'), 2800);
}

export const params = () => new URLSearchParams(location.search);

export function onIdle(fn, timeout = 1500) {
  if ('requestIdleCallback' in window) requestIdleCallback(fn, { timeout });
  else setTimeout(fn, 200);
}

/** Calls `fn(true|false)` as the element enters/leaves the viewport. */
export function onVisible(el, fn, rootMargin = '100px') {
  const io = new IntersectionObserver(([e]) => fn(e.isIntersecting), { rootMargin });
  io.observe(el);
  return () => io.disconnect();
}

/** Quick WebGL capability check so we can fall back to imagery. */
export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    const gl = window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'));
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
