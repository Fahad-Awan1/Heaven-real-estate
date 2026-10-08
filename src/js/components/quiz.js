import { properties } from '../../data/properties.js';
import { matchProfile, matchScore } from '../core/store.js';
import { icons } from '../core/icons.js';
import { stopScroll, startScroll } from '../core/motion.js';
import { escapeHtml, money } from '../core/utils.js';
import { propertyUrl } from './cards.js';

const STEPS = [
  {
    key: 'status',
    q: 'What brings you to Heaven?',
    options: [
      ['sale', 'I want to buy', 'Find a home to own'],
      ['rent', 'I want to rent', 'Flexible, move-in ready'],
    ],
  },
  {
    key: 'lifestyle',
    q: 'Which perfect Sunday sounds most like you?',
    options: [
      ['luxury', 'Sunset by the pool', 'Space, privacy and views'],
      ['family', 'Backyard games', 'Room to grow, great schools'],
      ['urban', 'Coffee and galleries', 'Everything within a walk'],
      ['nature', 'Ocean air and hikes', 'Calm, green and quiet'],
      ['entertain', 'Long dinners with friends', 'A home made for hosting'],
    ],
  },
  {
    key: 'beds',
    q: 'How many bedrooms do you need?',
    options: [
      [1, '1+', 'Cosy'],
      [2, '2+', 'A little extra'],
      [3, '3+', 'Family size'],
      [4, '4+', 'Room for guests'],
      [5, '5+', 'The whole crew'],
    ],
  },
  {
    key: 'budget',
    q: 'What budget feels comfortable?',
    options: (a) =>
      a.status === 'rent'
        ? [[5000, 'Up to $5K /mo'], [8000, 'Up to $8K /mo'], [12000, 'Up to $12K /mo'], [25000, '$12K+ /mo']]
        : [[1000000, 'Up to $1M'], [2000000, 'Up to $2M'], [3500000, 'Up to $3.5M'], [8000000, '$3.5M+']],
  },
  {
    key: 'priority',
    q: 'What matters most on your doorstep?',
    options: [
      ['walk', 'Walkability', 'Shops and cafés on foot'],
      ['schools', 'Great schools', 'Top-rated nearby'],
      ['quiet', 'Peace and quiet', 'Calm streets'],
      ['nature', 'Nature', 'Parks, beaches, trails'],
    ],
  },
];

let modal;
let answers = {};
let stepIndex = 0;

function build() {
  modal = document.createElement('div');
  modal.className = 'modal quiz';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-label="Heaven Match quiz" data-lenis-prevent>
      <button class="icon-btn modal__close" type="button" data-close aria-label="Close">${icons.close}</button>
      <div class="quiz__progress"><span></span></div>
      <div class="quiz__body"></div>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) return closeQuiz();
    const opt = e.target.closest('[data-value]');
    if (opt) {
      const step = STEPS[stepIndex];
      const raw = opt.dataset.value;
      answers[step.key] = isNaN(raw) ? raw : Number(raw);
      stepIndex++;
      render();
    }
    if (e.target.closest('[data-back]')) {
      stepIndex = Math.max(0, stepIndex - 1);
      render();
    }
  });
  modal.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = new FormData(e.target).get('name')?.toString().trim().slice(0, 30);
    matchProfile.set({ ...answers, name: name || '' });
    stepIndex++;
    render();
  });
  addEventListener('keydown', (e) => e.key === 'Escape' && modal.classList.contains('is-open') && closeQuiz());
}

function render() {
  const body = modal.querySelector('.quiz__body');
  const total = STEPS.length + 1;
  modal.querySelector('.quiz__progress span').style.transform = `scaleX(${Math.min(1, stepIndex / total)})`;
  const back = stepIndex > 0 && stepIndex <= STEPS.length ? `<button class="quiz__back" type="button" data-back>${icons.chevronLeft} Back</button>` : '';

  if (stepIndex < STEPS.length) {
    const step = STEPS[stepIndex];
    const options = typeof step.options === 'function' ? step.options(answers) : step.options;
    body.innerHTML = `
      <span class="eyebrow">Question ${stepIndex + 1} of ${STEPS.length}</span>
      <h3 class="quiz__q">${step.q}</h3>
      <div class="quiz__opts">${options
        .map(([v, label, sub]) => `<button type="button" class="quiz__opt ${answers[step.key] === v ? 'is-picked' : ''}" data-value="${v}"><strong>${label}</strong>${sub ? `<span>${sub}</span>` : ''}</button>`)
        .join('')}</div>
      ${back}`;
  } else if (stepIndex === STEPS.length) {
    body.innerHTML = `
      <span class="eyebrow">Last step</span>
      <h3 class="quiz__q">What should we call you?</h3>
      <form class="quiz__name">
        <input class="input" name="name" placeholder="Your first name (optional)" maxlength="30" autocomplete="given-name" />
        <button class="btn btn--dark" type="submit">See my matches ${icons.arrow}</button>
      </form>
      ${back}`;
    body.querySelector('input').focus();
  } else {
    const ranked = properties
      .map((p) => ({ p, s: matchScore(p, answers) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    body.innerHTML = `
      <span class="eyebrow">Your Heaven Match</span>
      <h3 class="quiz__q">${answers.name ? `${escapeHtml(answers.name)}, here` : 'Here'} are your top homes</h3>
      <div class="quiz__results">${ranked
        .map(
          ({ p, s }) => `<a class="quiz__result" href="${propertyUrl(p)}">
            <img src="/images/${p.img}-sm.webp" alt="" loading="lazy">
            <span class="badge badge--match">${s}% match</span>
            <strong>${escapeHtml(p.title)}</strong><span>${p.city} · ${money(p.price, { compact: true })}${p.status === 'rent' ? ' /mo' : ''}</span>
          </a>`,
        )
        .join('')}</div>
      <div class="quiz__end">
        <a class="btn btn--dark" href="/properties.html?sort=match">See all homes ranked for me ${icons.arrow}</a>
        <button class="btn btn--ghost" type="button" data-restart>Retake quiz</button>
      </div>`;
    body.querySelector('[data-restart]').onclick = () => {
      answers = {};
      stepIndex = 0;
      render();
    };
  }
}

export function openQuiz() {
  if (!modal) build();
  answers = {};
  stepIndex = 0;
  render();
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  stopScroll();
  setTimeout(() => modal.querySelector('.quiz__opt')?.focus(), 300);
}

export function closeQuiz() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  startScroll();
}
