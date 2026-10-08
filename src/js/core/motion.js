import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import Lenis from 'lenis';
import { $$, reducedMotion } from './utils.js';

gsap.registerPlugin(ScrollTrigger, SplitText);
export { gsap, ScrollTrigger };

export let lenis = null;

export function initSmoothScroll() {
  if (reducedMotion()) return null;
  lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 1, anchors: { offset: -90 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}
export const stopScroll = () => (lenis ? lenis.stop() : (document.documentElement.style.overflow = 'hidden'));
export const startScroll = () => (lenis ? lenis.start() : (document.documentElement.style.overflow = ''));

/** Masked line-by-line reveal for headings marked [data-split]. */
export function splitReveal(el, { delay = 0, scroll = true } = {}) {
  if (reducedMotion()) return;
  const split = SplitText.create(el, { type: 'lines', mask: 'lines', linesClass: 'split-line-inner', autoSplit: true, aria: 'none',
    onSplit(self) {
      return gsap.from(self.lines, {
        yPercent: 110,
        duration: 1.15,
        ease: 'expo.out',
        stagger: 0.09,
        delay,
        scrollTrigger: scroll ? { trigger: el, start: 'top 88%', once: true } : undefined,
      });
    },
  });
  el.style.visibility = 'visible';
  return split;
}

export function initReveals(root = document) {
  const els = $$('[data-reveal]:not(.is-revealed)', root);
  if (reducedMotion()) return;
  els.forEach((el) => el.classList.add('is-revealed'));
  const fades = els.filter((el) => el.dataset.reveal !== 'clip');
  const clips = els.filter((el) => el.dataset.reveal === 'clip');

  ScrollTrigger.batch(fades, {
    start: 'top 90%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { opacity: 1, y: 0, duration: 1, ease: 'power3.out', stagger: 0.08, overwrite: true }),
  });
  clips.forEach((el) =>
    gsap.to(el, {
      clipPath: 'inset(0% 0 0 0 round 26px)',
      duration: 1.4,
      ease: 'expo.inOut',
      scrollTrigger: { trigger: el, start: 'top 85%', once: true },
    }),
  );
  $$('[data-split]', root).forEach((el) => splitReveal(el));
}

export function initCounters(root = document) {
  $$('[data-counter]', root).forEach((el) => {
    const end = parseFloat(el.dataset.counter);
    const suffix = el.dataset.suffix || '';
    const decimals = (el.dataset.counter.split('.')[1] || '').length;
    const obj = { v: 0 };
    const render = () => (el.textContent = obj.v.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix);
    if (reducedMotion()) {
      obj.v = end;
      return render();
    }
    render();
    gsap.to(obj, {
      v: end,
      duration: 2.2,
      ease: 'power2.out',
      onUpdate: render,
      scrollTrigger: { trigger: el, start: 'top 92%', once: true },
    });
  });
}

export function initParallax(root = document) {
  if (reducedMotion()) return;
  $$('[data-parallax]', root).forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 0.15;
    gsap.fromTo(
      el,
      { yPercent: -amt * 50 },
      {
        yPercent: amt * 50,
        ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true },
      },
    );
  });
}

/** Splits [data-roll] links into letters for the rolling hover effect. */
export function initRollLinks(root = document) {
  $$('[data-roll], [data-roll-btn]', root).forEach((el) => {
    if (el.querySelector('.roll')) return;
    const text = el.textContent.trim();
    el.setAttribute('aria-label', el.getAttribute('aria-label') || text);
    el.innerHTML = `<span class="roll" aria-hidden="true">${[...text]
      .map((c, i) => `<span style="--i:${i}" data-c="${c}">${c}</span>`)
      .join('')}</span>`;
  });
}
