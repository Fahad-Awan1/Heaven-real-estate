import { ready } from '../main.js';
import { gsap, ScrollTrigger } from '../core/motion.js';
import { $, reducedMotion } from '../core/utils.js';

// Desktop: pin the milestones and scroll them horizontally. Mobile: native swipe.
ready.then(() => {
  const track = $('[data-htrack]');
  const wrap = $('[data-htrack-wrap]');
  if (reducedMotion()) return;
  ScrollTrigger.matchMedia({
    '(min-width: 901px)': () => {
      const distance = () => track.scrollWidth - wrap.clientWidth;
      gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: '.milestones',
          start: 'top top',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      });
    },
  });
});
