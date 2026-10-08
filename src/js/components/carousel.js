import { finePointer } from '../core/utils.js';

/** Scroll-snap carousel with prev/next buttons and mouse drag. */
export function initCarousel(scroller, prev, next) {
  if (!scroller) return;
  const step = () => {
    const card = scroller.querySelector('.p-card, [data-slide]');
    return card ? card.getBoundingClientRect().width + 24 : scroller.clientWidth * 0.8;
  };
  prev?.addEventListener('click', () => scroller.scrollBy({ left: -step(), behavior: 'smooth' }));
  next?.addEventListener('click', () => scroller.scrollBy({ left: step(), behavior: 'smooth' }));

  if (!finePointer()) return;
  let down = false;
  let startX = 0;
  let startLeft = 0;
  let moved = false;
  scroller.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.target.closest('button')) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startLeft = scroller.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 5) {
      moved = true;
      scroller.classList.add('is-drag');
    }
    scroller.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    requestAnimationFrame(() => scroller.classList.remove('is-drag'));
  });
  scroller.addEventListener('click', (e) => moved && e.preventDefault(), true);
  scroller.addEventListener('dragstart', (e) => e.preventDefault());
}
