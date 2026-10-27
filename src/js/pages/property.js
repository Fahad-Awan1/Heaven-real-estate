import '../main.js';
import { getProperty, properties } from '../../data/properties.js';
import { getAgent } from '../../data/agents.js';
import { $, $$, img, money, params, toast, escapeHtml, onVisible, webglAvailable } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { favs, compare, recent, subscribe, matchScore } from '../core/store.js';
import { propertyCard } from '../components/cards.js';
import { initCarousel } from '../components/carousel.js';
import { stopScroll, startScroll } from '../core/motion.js';

const p = getProperty(params().get('id')) || properties[0];
const agent = getAgent(p.agent);
recent.push(p.id);

/* ---------- Meta + header ---------- */
document.title = `${p.title}, ${p.city} — Sitara Group of Builders`;
$('meta[name="description"]').setAttribute('content', `${p.title} in ${p.city}: ${p.beds} beds, ${p.baths} baths, ${p.sqft.toLocaleString()} ft². ${p.description}`);
$('[data-crumb]').textContent = p.title;
$('[data-title]').textContent = p.title;
$('[data-address]').innerHTML = `${icons.pin}${escapeHtml(p.address)}`;
$('[data-price]').textContent = money(p.price);
$('[data-price-sub]').textContent = p.status === 'rent' ? 'per month' : `${money(p.price / p.sqft)} per ft²`;
const match = matchScore(p);
$('[data-badges]').innerHTML = `<span class="badge ${p.status === 'rent' ? 'badge--accent' : ''}" style="border:1px solid var(--line)">${p.status === 'rent' ? 'For rent' : 'For sale'}</span><span class="badge" style="border:1px solid var(--line)">${p.type}</span>${match ? `<span class="badge badge--match">${match}% match</span>` : ''}`;

/* ---------- Save / share / compare ---------- */
const favBtn = $('[data-fav-main]');
const paintFav = () => {
  const on = favs.has(p.id);
  favBtn.innerHTML = `${icons.heart}<span>${on ? 'Saved' : 'Save'}</span>`;
  favBtn.querySelector('svg').style.fill = on ? 'var(--sunset)' : 'none';
  favBtn.querySelector('svg').style.color = on ? 'var(--sunset)' : '';
};
favBtn.addEventListener('click', () => {
  toast(favs.toggle(p.id) ? '♥ Saved to your homes' : 'Removed from saved homes');
});
const cmp = $('[data-compare-main]');
cmp.dataset.compare = p.id;
subscribe(paintFav);
paintFav();
cmp.checked = compare.has(p.id);
$('[data-share]').innerHTML = `${icons.share}<span>Share</span>`;
$('[data-share]').addEventListener('click', async () => {
  const data = { title: `${p.title} — Sitara Group of Builders`, url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(location.href);
      toast('Link copied to clipboard');
    }
  } catch {}
});

/* ---------- Gallery + lightbox + day/night ---------- */
const gallery = $('[data-gallery]');
gallery.innerHTML =
  p.gallery
    .slice(0, 5)
    .map(
      (g, i) =>
        `<button type="button" data-shot="${i}" aria-label="Open photo ${i + 1}">${img(g, i === 0 ? `${p.title} exterior` : `${p.title} interior`, { sizes: i === 0 ? '(max-width: 760px) 100vw, 60vw' : '25vw', eager: i === 0 })}</button>`,
    )
    .join('') +
  `<div class="gallery__tools"><button class="btn btn--light btn--sm" type="button" data-shot="0">${icons.grid} All ${p.gallery.length} photos</button></div>
   <div class="daynight mood-switch glass" role="radiogroup" aria-label="Preview lighting">
     <button type="button" role="radio" aria-checked="true" data-dn="day">${'Day'}</button>
     <button type="button" role="radio" aria-checked="false" data-dn="night">Dusk</button>
   </div>`;
$$('[data-dn]').forEach((b) =>
  b.addEventListener('click', () => {
    $$('[data-dn]').forEach((x) => x.setAttribute('aria-checked', x === b));
    gallery.classList.toggle('is-night', b.dataset.dn === 'night');
  }),
);

const lb = $('[data-lightbox]');
const lbImg = $('img', lb);
let shot = 0;
const showShot = (i) => {
  shot = (i + p.gallery.length) % p.gallery.length;
  lbImg.src = `/images/${p.gallery[shot]}-lg.webp`;
  lbImg.alt = `${p.title} photo ${shot + 1}`;
  $('.lb-count', lb).textContent = `${shot + 1} / ${p.gallery.length}`;
};
const openLb = (i) => {
  showShot(i);
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  stopScroll();
  $('.lb-close', lb).focus();
};
const closeLb = () => {
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  startScroll();
};
gallery.addEventListener('click', (e) => {
  const b = e.target.closest('[data-shot]');
  if (b) openLb(Number(b.dataset.shot));
});
$('.lb-close', lb).addEventListener('click', closeLb);
$('.lb-prev', lb).addEventListener('click', () => showShot(shot - 1));
$('.lb-next', lb).addEventListener('click', () => showShot(shot + 1));
lb.addEventListener('click', (e) => e.target === lb && closeLb());
addEventListener('keydown', (e) => {
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLb();
  if (e.key === 'ArrowLeft') showShot(shot - 1);
  if (e.key === 'ArrowRight') showShot(shot + 1);
});
let touchX = null;
lb.addEventListener('touchstart', (e) => (touchX = e.touches[0].clientX), { passive: true });
lb.addEventListener('touchend', (e) => {
  if (touchX == null) return;
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 40) showShot(shot + (dx < 0 ? 1 : -1));
  touchX = null;
});

$('[data-property]').classList.add('is-ready');

/* ---------- Facts, description, features ---------- */
$('[data-keyfacts]').innerHTML = [
  [icons.bed, p.beds, 'Bedrooms'],
  [icons.bath, p.baths, 'Bathrooms'],
  [icons.area, p.sqft.toLocaleString(), 'Square feet'],
  [icons.home, p.type, 'Property type'],
  [icons.calendar, p.year, 'Year built'],
]
  .map(([ic, v, l]) => `<div class="keyfact">${ic}<strong>${v}</strong><span>${l}</span></div>`)
  .join('');
$('[data-desc]').textContent = p.description;
$('[data-features]').innerHTML = p.features.map((f) => `<li>${icons.check}<span>${escapeHtml(f)}</span></li>`).join('');

/* ---------- Floor plan (lazy 3D) ---------- */
const fpWrap = $('[data-floorplan]');
const label = $('[data-room-label]');
const legend = $('[data-room-legend]');
const showRoom = (r) => {
  label.innerHTML = r ? `<strong>${r.name}</strong><span>≈ ${r.sqft.toLocaleString()} ft²</span>` : '<strong>Tap a room</strong><span>to see its size</span>';
  $$('.chip', legend).forEach((c) => c.setAttribute('aria-pressed', c.dataset.room === r?.name));
};
if (webglAvailable()) {
  const stop = onVisible(
    fpWrap,
    (v) => {
      if (!v) return;
      stop();
      import('../three/floorplan.js').then(({ initFloorplan, ROOM_COLORS }) => {
        const fp = initFloorplan($('canvas', fpWrap), p, { onSelect: showRoom });
        legend.innerHTML = fp.rooms
          .map((r) => `<button type="button" class="chip" data-room="${r.name}" aria-pressed="false" style="--c:${ROOM_COLORS[r.type]}"><i></i>${r.name}</button>`)
          .join('');
        legend.addEventListener('click', (e) => {
          const c = e.target.closest('[data-room]');
          if (c) fp.select(fp.rooms.find((r) => r.name === c.dataset.room));
        });
      });
    },
    '300px',
  );
} else {
  fpWrap.innerHTML = '<div class="empty"><h3>3D floor plan</h3><p>Your browser doesn’t support 3D graphics. Ask your agent for a PDF plan.</p></div>';
}

/* ---------- Neighbourhood ---------- */
const vibes = $('[data-vibes]');
vibes.innerHTML = [
  [icons.walk, 'Walkability', p.vibe.walk],
  [icons.school, 'Schools', p.vibe.schools],
  [icons.coffee, 'Cafés & dining', p.vibe.cafes],
  [icons.volume, 'Peace & quiet', p.vibe.quiet],
  [icons.leaf, 'Nature', p.vibe.nature],
]
  .map(([ic, l, v]) => `<div class="vibe-card"><header><span>${l}</span>${ic}</header><strong>${v}<small style="font-size:1rem;color:var(--text-soft)">/100</small></strong><div class="meter"><span style="--v:${v}%"></span></div></div>`)
  .join('');
onVisible(vibes, (v) => v && vibes.classList.add('in-view'), '-80px');

/* ---------- Mortgage ---------- */
const mBlock = $('[data-mortgage-block]');
if (p.status === 'rent') {
  mBlock.querySelector('h2').textContent = 'Affordability';
  mBlock.querySelector('.mortgage').innerHTML = `<div class="mortgage__inputs"><p class="pd-desc">Most landlords look for a household income of around <strong>${money(p.price * 36)}</strong> a year (3× the monthly rent). Move-in costs are typically first month plus a deposit: about <strong>${money(p.price * 2)}</strong>.</p><button class="btn btn--dark" type="button" data-open-chat="What documents do I need?" style="justify-self:start">What documents do I need?</button></div>`;
} else {
  const inputs = Object.fromEntries($$('[data-m]').map((el) => [el.dataset.m, el]));
  const outs = Object.fromEntries($$('[data-m-out]').map((el) => [el.dataset.mOut, el]));
  let years = 30;
  inputs.price.value = p.price;
  const calc = () => {
    const price = Number(inputs.price.value);
    const downPct = Number(inputs.down.value);
    const rate = Number(inputs.rate.value) / 100 / 12;
    const n = years * 12;
    const loan = price * (1 - downPct / 100);
    const pi = rate ? (loan * rate) / (1 - Math.pow(1 + rate, -n)) : loan / n;
    const tax = (price * 0.0115) / 12;
    const ins = (price * 0.0035) / 12;
    const total = pi + tax + ins;
    outs.price.textContent = money(price);
    outs.down.textContent = `${downPct}% · ${money((price * downPct) / 100, { compact: true })}`;
    outs.rate.textContent = `${Number(inputs.rate.value).toFixed(2)}%`;
    $('[data-m-total]').textContent = money(total);
    $('[data-m-pi]').textContent = money(pi);
    $('[data-m-tax]').textContent = money(tax);
    $('[data-m-ins]').textContent = money(ins);
    let offset = 0;
    [['pi', pi], ['tax', tax], ['ins', ins]].forEach(([k, v]) => {
      const len = (v / total) * 100;
      const arc = $(`[data-arc="${k}"]`);
      arc.setAttribute('stroke-dasharray', `${Math.max(0, len - 0.8)} ${100 - len + 0.8}`);
      arc.setAttribute('stroke-dashoffset', -offset);
      offset += len;
    });
  };
  Object.values(inputs).forEach((el) => el.addEventListener('input', calc));
  $$('[data-term] button').forEach((b) =>
    b.addEventListener('click', () => {
      years = Number(b.dataset.years);
      $$('[data-term] button').forEach((x) => x.setAttribute('aria-pressed', x === b));
      calc();
    }),
  );
  calc();
}

/* ---------- Agent + tour ---------- */
$('[data-agent]').innerHTML = `
  <img src="/images/${agent.img}-sm.webp" alt="${agent.name}" width="64" height="64" loading="lazy">
  <div><strong>${agent.name}</strong><span>${agent.role} · ${agent.sold} homes sold</span></div>
  <div class="agent-card__btns">
    <a class="btn btn--ghost btn--sm" href="tel:${agent.phone.replace(/[^\d+]/g, '')}">${icons.phone} Call</a>
    <a class="btn btn--ghost btn--sm" href="mailto:${agent.email}?subject=${encodeURIComponent(p.title)}">${icons.mail} Email</a>
  </div>`;

const days = $('[data-days]');
const today = new Date();
days.innerHTML = Array.from({ length: 10 }, (_, i) => {
  const d = new Date(today);
  d.setDate(today.getDate() + i + 1);
  return `<button type="button" class="day" aria-pressed="${i === 0}" data-date="${d.toDateString()}"><span>${d.toLocaleDateString('en-US', { weekday: 'short' })}</span><strong>${d.getDate()}</strong><span>${d.toLocaleDateString('en-US', { month: 'short' })}</span></button>`;
}).join('');
days.addEventListener('click', (e) => {
  const b = e.target.closest('.day');
  if (!b) return;
  $$('.day', days).forEach((x) => x.setAttribute('aria-pressed', x === b));
});
$$('[data-tour-type] button').forEach((b) =>
  b.addEventListener('click', () => $$('[data-tour-type] button').forEach((x) => x.setAttribute('aria-pressed', x === b))),
);
const tour = $('[data-tour]');
tour.addEventListener('submit', (e) => {
  e.preventDefault();
  let ok = true;
  [['name', (v) => v.trim().length > 1, 'Please tell us your name'], ['email', (v) => /^\S+@\S+\.\S+$/.test(v), 'Please enter a valid email']].forEach(([n, test, msg]) => {
    const input = tour.elements[n];
    const field = input.closest('.field');
    const good = test(input.value);
    field.classList.toggle('has-error', !good);
    field.querySelector('.error').textContent = good ? '' : msg;
    if (!good) ok = false;
  });
  if (!ok) return;
  const day = $('.day[aria-pressed="true"]', days).dataset.date;
  const name = tour.elements.name.value.trim().split(' ')[0];
  tour.innerHTML = `<div style="text-align:center;display:grid;gap:10px;justify-items:center;padding:10px 0">${icons.check.replace('<svg', '<svg style="width:46px;height:46px;color:var(--sunset)"')}<strong style="font-size:1.1rem">You’re booked, ${escapeHtml(name)}!</strong><span style="color:var(--text-soft);font-size:.9rem">${agent.name.split(' ')[0]} will confirm your ${tour.elements.time?.value || ''} tour on ${day}.</span></div>`;
  toast('Tour requested ✨');
});

/* ---------- Similar + recently viewed ---------- */
const similar = properties
  .filter((x) => x.id !== p.id)
  .map((x) => ({ x, s: (x.status === p.status ? 3 : 0) + (x.city === p.city ? 2 : 0) + (x.type === p.type ? 1 : 0) - Math.abs(x.price - p.price) / p.price }))
  .sort((a, b) => b.s - a.s)
  .slice(0, 6)
  .map(({ x }) => x);
$('[data-similar]').innerHTML = similar.map((x) => propertyCard(x, { sizes: '420px' })).join('');
initCarousel($('[data-carousel]'), $('[data-carousel-prev]'), $('[data-carousel-next]'));

const rec = recent
  .all()
  .filter((id) => id !== p.id)
  .map(getProperty)
  .filter(Boolean)
  .slice(0, 6);
if (rec.length) {
  $('[data-recent-wrap]').hidden = false;
  $('[data-recent]').innerHTML = rec
    .map((x) => `<a href="/property.html?id=${x.id}"><img src="/images/${x.img}-sm.webp" alt="" loading="lazy" width="720" height="480"><strong>${escapeHtml(x.title)}</strong><span>${x.city} · ${money(x.price, { compact: true })}${x.status === 'rent' ? '/mo' : ''}</span></a>`)
    .join('');
}
