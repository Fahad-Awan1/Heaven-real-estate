import { ready } from '../main.js';
import { gsap, ScrollTrigger, splitReveal } from '../core/motion.js';
import { SplitText } from 'gsap/SplitText';
import { $, $$, img, money, greeting, timeOfDay, reducedMotion } from '../core/utils.js';
import { icons } from '../core/icons.js';
import { properties, cities, types } from '../../data/properties.js';
import { articles } from '../../data/articles.js';
import { propertyCard } from '../components/cards.js';
import { matchProfile, matchScore, subscribe } from '../core/store.js';
import { initCarousel } from '../components/carousel.js';
import { articleCard } from '../components/articles.js';

/* ---------------- Hero ---------------- */

function paintGreeting() {
  const profile = matchProfile.get();
  const tod = timeOfDay();
  $('[data-greet-icon]').innerHTML = tod === 'night' ? icons.moon : tod === 'morning' ? icons.sunrise : icons.sun;
  $('[data-greet-title]').textContent = `${greeting()}${profile?.name ? `, ${profile.name}` : ''}.`;
  const action = $('[data-greet-action]');
  if (profile) {
    const n = properties.filter((p) => matchScore(p, profile) >= 70).length;
    $('[data-greet-text]').textContent = `${n} ${n === 1 ? 'home matches' : 'homes match'} your preferences.`;
    $('[data-greet-specs]').innerHTML = `${profile.beds || 1}+ beds <i></i> ${profile.status === 'rent' ? 'Rent' : 'Buy'} <i></i> <b>${money(profile.budget, { compact: true })}</b>`;
    action.onclick = () => (location.href = '/properties.html?sort=match');
    action.removeAttribute('data-open-quiz');
  } else {
    $('[data-greet-text]').textContent = 'Tell us how you live and we’ll match you with homes you’ll love.';
    $('[data-greet-specs]').innerHTML = '<b>Take the 60-second quiz</b>';
    action.setAttribute('data-open-quiz', '');
  }
}
paintGreeting();
subscribe(paintGreeting);

ready.then(() => {
  const title = $('[data-hero-title]');
  splitReveal(title, { scroll: false, delay: 0.15 });
  const d = reducedMotion() ? 0 : 1;
  gsap.fromTo('.hero-in', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1 * d, stagger: 0.1, delay: 0.45 * d, ease: 'power3.out' });
  gsap.fromTo('.hero-in-r', { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 1.1 * d, stagger: 0.15, delay: 0.9 * d, ease: 'power3.out' });
  gsap.fromTo('.hero__scroll, .hero__foot', { opacity: 0 }, { opacity: 1, duration: 1 * d, delay: 1.2 * d });

  if (!reducedMotion()) {
    gsap.to('.hero__media', {
      yPercent: 7,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.to('.hero__content', {
      yPercent: -18,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
});

/* ---------------- Quick search ---------------- */
$('[data-city-options]').insertAdjacentHTML('beforeend', cities.map((c) => `<option>${c}</option>`).join(''));
$('[data-type-options]').insertAdjacentHTML('beforeend', types.map((t) => `<option>${t}</option>`).join(''));
$('.quick-search').addEventListener('submit', (e) => {
  // drop empty params for clean URLs
  e.preventDefault();
  const data = new FormData(e.currentTarget);
  const q = new URLSearchParams([...data].filter(([, v]) => v));
  location.href = `/properties.html?${q}`;
});

/* ---------------- Intro words ---------------- */
const statement = $('[data-words]');
{
  const split = SplitText.create(statement, { type: 'words', wordsClass: 'w', aria: 'none' });
  const words = split.words;
  if (reducedMotion()) words.forEach((w) => w.classList.add('on'));
  else {
    ScrollTrigger.create({
      trigger: statement,
      start: 'top 82%',
      end: 'bottom 50%',
      onUpdate: (st) => {
        const lit = Math.round(st.progress * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < lit));
      },
    });
  }
}

/* ---------------- Featured ---------------- */
const featured = properties.filter((p) => p.featured);
$('[data-featured]').innerHTML = featured.map((p) => propertyCard(p, { sizes: '(max-width: 768px) 85vw, 420px' })).join('');
initCarousel($('[data-carousel]'), $('[data-carousel-prev]'), $('[data-carousel-next]'));

/* ---------------- Story (pinned; real photos reveal step by step) ---------------- */
const story = $('.story');
const steps = $$('.story__steps li');
const shots = $$('.story__media figure');
const storyCount = $('.story__count b');
const bar = $('.story__progress span');
let storyIdx = -1;
ScrollTrigger.create({
  trigger: story,
  pin: '.story__pin',
  start: 'top top',
  end: () => `+=${innerHeight * 2.4}`,
  scrub: true,
  onUpdate(st) {
    bar.style.transform = `scaleX(${st.progress})`;
    const idx = Math.min(steps.length - 1, Math.floor(st.progress * steps.length * 0.999));
    if (idx === storyIdx) return;
    storyIdx = idx;
    steps.forEach((li, i) => li.classList.toggle('is-active', i === idx));
    shots.forEach((f, i) => {
      f.classList.toggle('is-active', i === idx);
      f.classList.toggle('is-past', i < idx);
    });
    storyCount.textContent = String(idx + 1).padStart(2, '0');
    story.classList.toggle('is-dusk', idx === 2);
    story.classList.toggle('is-night', idx === 3);
  },
});

/* ---------------- Neighbourhoods ---------------- */
const hoodImg = {
  'Beverly Hills': 'villa1',
  Malibu: 'villa5',
  Pasadena: 'villa2',
  'Bel Air': 'glass1',
  'Santa Monica': 'villa3',
  'Hollywood Hills': 'dusk1',
};
$('[data-hoods]').innerHTML = Object.entries(hoodImg)
  .map(([city, image]) => {
    const homes = properties.filter((p) => p.city === city);
    const avg = (k) => Math.round(homes.reduce((s, p) => s + p.vibe[k], 0) / homes.length);
    return `<a class="hood" href="/properties.html?city=${encodeURIComponent(city)}" data-reveal>
      ${img(image, '', { sizes: '(max-width: 768px) 100vw, 33vw', cls: 'tone' })}
      <span class="badge hood__count">${homes.length} ${homes.length === 1 ? 'home' : 'homes'}</span>
      <span class="hood__go">${icons.arrowUpRight}</span>
      <h3>${city}</h3>
      <div class="vibes">
        <div>Walkable<div class="vibe-bar"><span style="--v:${avg('walk')}%"></span></div></div>
        <div>Schools<div class="vibe-bar"><span style="--v:${avg('schools')}%"></span></div></div>
        <div>Nature<div class="vibe-bar"><span style="--v:${avg('nature')}%"></span></div></div>
      </div>
    </a>`;
  })
  .join('');
const hio = new IntersectionObserver(
  (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('in-view')),
  { threshold: 0.5 },
);
$$('.hood').forEach((h) => hio.observe(h));

/* ---------------- Testimonials ---------------- */
{
  const slides = $$('.t-slide');
  const count = $('.t-count b');
  let i = 0;
  let timer;
  const go = (n) => {
    slides[i].classList.remove('is-active');
    i = (n + slides.length) % slides.length;
    slides[i].classList.add('is-active');
    count.textContent = String(i + 1).padStart(2, '0');
    clearInterval(timer);
    timer = setInterval(() => go(i + 1), 7000);
  };
  $('[data-t-prev]').addEventListener('click', () => go(i - 1));
  $('[data-t-next]').addEventListener('click', () => go(i + 1));
  go(0);
}

/* ---------------- Journal ---------------- */
$('[data-journal]').innerHTML = articles.slice(0, 3).map(articleCard).join('');
