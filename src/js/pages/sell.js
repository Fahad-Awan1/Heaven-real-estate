import '../main.js';
import { gsap } from '../core/motion.js';
import { $, money, reducedMotion } from '../core/utils.js';

// Indicative $/ft² by area, used by the hardcoded valuation model.
const PSF = {
  'Beverly Hills': 1100,
  'Bel Air': 1250,
  Malibu: 1350,
  'Pacific Palisades': 1000,
  'Santa Monica': 1150,
  'Laguna Beach': 900,
  'Hollywood Hills': 800,
  'Silver Lake': 780,
  'Downtown LA': 700,
  Pasadena: 650,
  Encino: 520,
};
const TYPE = { House: 1, Villa: 1.1, Apartment: 0.88, Estate: 1.15 };

const form = $('[data-valuation]');
const citySel = $('[data-v-city]');
citySel.innerHTML = Object.keys(PSF)
  .sort()
  .map((c) => `<option ${c === 'Pasadena' ? 'selected' : ''}>${c}</option>`)
  .join('');

const out = $('[data-v-value]');
const range = $('[data-v-range]');
const shown = { v: 0 };

function estimate() {
  const f = new FormData(form);
  const sqft = Math.min(30000, Math.max(300, Number(f.get('sqft')) || 0));
  const beds = parseInt(f.get('beds'), 10);
  let value = sqft * PSF[f.get('city')] * TYPE[f.get('type')] * Number(f.get('cond'));
  ['pool', 'view', 'garden', 'garage', 'smart'].forEach((k) => f.get(k) && (value *= 1 + Number(f.get(k))));
  value *= 1 + (beds - 3) * 0.015;
  return Math.round(value / 5000) * 5000;
}

function update() {
  const v = estimate();
  range.textContent = `Likely range ${money(v * 0.94, { compact: true })} – ${money(v * 1.06, { compact: true })}`;
  gsap.to(shown, {
    v,
    duration: reducedMotion() ? 0 : 0.9,
    ease: 'power3.out',
    overwrite: true,
    onUpdate: () => (out.textContent = money(shown.v)),
  });
}
form.addEventListener('input', update);
form.addEventListener('change', update);
update();
