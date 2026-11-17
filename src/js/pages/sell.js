import '../main.js';
import { gsap } from '../core/motion.js';
import { $, money, reducedMotion } from '../core/utils.js';

// Indicative PKR per sq ft of covered area (land included) by area, used by the hardcoded valuation model.
const PSF = {
  'DHA, Lahore': 25000,
  'Gulberg, Lahore': 30000,
  'Bahria Town, Lahore': 11000,
  'Johar Town, Lahore': 14000,
  'F-7, Islamabad': 60000,
  'F-11, Islamabad': 35000,
  'DHA, Islamabad': 18000,
  'Bahria Enclave, Islamabad': 15000,
  'Gulberg Greens, Islamabad': 27000,
  'DHA, Karachi': 30000,
  'Clifton, Karachi': 25000,
  'Bahria Town, Karachi': 8700,
  'Murree': 14000,
};
const TYPE = { House: 1, Farmhouse: 1.05, Apartment: 0.85, Cottage: 0.95 };

const form = $('[data-valuation]');
const citySel = $('[data-v-city]');
citySel.innerHTML = Object.keys(PSF)
  .sort()
  .map((c) => `<option ${c === 'Bahria Town, Lahore' ? 'selected' : ''}>${c}</option>`)
  .join('');

const out = $('[data-v-value]');
const range = $('[data-v-range]');
const shown = { v: 0 };

function estimate() {
  const f = new FormData(form);
  const sqft = Math.min(30000, Math.max(300, Number(f.get('sqft')) || 0));
  const beds = parseInt(f.get('beds'), 10);
  let value = sqft * PSF[f.get('city')] * TYPE[f.get('type')] * Number(f.get('cond'));
  ['corner', 'park', 'basement', 'solar', 'boulevard'].forEach((k) => f.get(k) && (value *= 1 + Number(f.get(k))));
  value *= 1 + (beds - 3) * 0.015;
  return Math.round(value / 50000) * 50000;
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
