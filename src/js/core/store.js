// Favourites, compare list and recently-viewed homes, persisted per browser.
import { storage, session } from './utils.js';

const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));

export const favs = {
  all: () => storage.get('hv-favs', []),
  has: (id) => favs.all().includes(id),
  toggle(id) {
    const list = favs.all();
    const i = list.indexOf(id);
    i === -1 ? list.push(id) : list.splice(i, 1);
    storage.set('hv-favs', list);
    emit();
    return i === -1;
  },
};

export const compare = {
  max: 3,
  all: () => session.get('hv-compare', []),
  has: (id) => compare.all().includes(id),
  toggle(id) {
    const list = compare.all();
    const i = list.indexOf(id);
    if (i === -1) {
      if (list.length >= compare.max) return { ok: false };
      list.push(id);
    } else list.splice(i, 1);
    session.set('hv-compare', list);
    emit();
    return { ok: true, added: i === -1 };
  },
  clear() {
    session.set('hv-compare', []);
    emit();
  },
};

export const recent = {
  all: () => storage.get('hv-recent', []),
  push(id) {
    const list = recent.all().filter((x) => x !== id);
    list.unshift(id);
    storage.set('hv-recent', list.slice(0, 8));
  },
};

export const matchProfile = {
  get: () => storage.get('hv-match', null),
  set(profile) {
    storage.set('hv-match', profile);
    emit();
  },
};

/** 0–100 "Heaven Match" score for a property given the saved quiz profile. */
export function matchScore(p, profile = matchProfile.get()) {
  if (!profile) return null;
  let score = 40;
  if (profile.lifestyle) score += p.lifestyle.includes(profile.lifestyle) ? 25 : 0;
  if (profile.beds) score += p.beds >= profile.beds ? 10 : -10;
  if (profile.priority && p.vibe[profile.priority] >= 80) score += 10;
  // a rental can't match a buyer (and vice versa); budgets are on different scales
  if (profile.status && profile.status !== p.status) return Math.max(12, Math.min(30, score - 30));
  score += 15;
  if (profile.budget) {
    const ratio = p.price / profile.budget;
    score += ratio <= 1 ? 10 : ratio <= 1.2 ? 0 : -25;
  }
  return Math.max(12, Math.min(99, score));
}
