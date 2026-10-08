import { icons } from '../core/icons.js';

/**
 * Upgrades native <select>s into styled dropdowns. The real <select> stays in
 * the DOM (visually hidden) as the source of truth, so forms, FormData and
 * existing change/input listeners keep working unchanged.
 */
let uid = 0;
let openDd = null;
const valueDesc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');

function enhance(select) {
  if (select.dataset.ddReady) return;
  select.dataset.ddReady = '1';
  const id = `dd-${++uid}`;

  const wrap = document.createElement('div');
  wrap.className = 'dd';
  if (select.classList.contains('qs-select')) wrap.classList.add('dd--bare');
  select.parentNode.insertBefore(wrap, select);
  wrap.appendChild(select);
  select.classList.add('dd__native');
  select.tabIndex = -1;
  select.setAttribute('aria-hidden', 'true');

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = `dd__btn ${[...select.classList].filter((c) => c !== 'dd__native').join(' ')}`;
  btn.style.cssText = select.style.cssText;
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', id);
  const label = select.id && document.querySelector(`label[for="${select.id}"]`);
  if (label) {
    label.id ||= `${id}-label`;
    btn.setAttribute('aria-labelledby', `${label.id} ${id}-value`);
    label.addEventListener('click', (e) => {
      e.preventDefault();
      btn.focus();
    });
  }
  btn.innerHTML = `<span class="dd__value" id="${id}-value"></span><span class="dd__chev">${icons.chevron}</span>`;
  wrap.appendChild(btn);

  const list = document.createElement('ul');
  list.className = 'dd__list';
  list.id = id;
  list.setAttribute('role', 'listbox');
  list.tabIndex = -1;
  list.dataset.lenisPrevent = '';
  wrap.appendChild(list);

  let active = 0;
  const opts = () => [...select.options];

  const render = () => {
    const sel = select.selectedIndex;
    btn.querySelector('.dd__value').textContent = select.options[sel]?.text ?? '';
    btn.classList.toggle('is-placeholder', !select.value);
    list.innerHTML = opts()
      .map(
        (o, i) =>
          `<li role="option" id="${id}-o${i}" data-i="${i}" aria-selected="${i === sel}" class="${i === sel ? 'is-selected' : ''}">
            <span>${o.text}</span>${icons.check}
          </li>`,
      )
      .join('');
  };

  // Re-render when code sets select.value directly (e.g. filters syncing from the URL)
  Object.defineProperty(select, 'value', {
    get: () => valueDesc.get.call(select),
    set: (v) => {
      valueDesc.set.call(select, v);
      render();
    },
    configurable: true,
  });
  new MutationObserver(render).observe(select, { childList: true, subtree: true });
  select.addEventListener('change', render);

  const setActive = (i) => {
    const items = list.children;
    if (!items.length) return;
    active = (i + items.length) % items.length;
    [...items].forEach((li, n) => li.classList.toggle('is-active', n === active));
    list.setAttribute('aria-activedescendant', `${id}-o${active}`);
    items[active].scrollIntoView({ block: 'nearest' });
  };

  const open = () => {
    if (openDd && openDd !== api) openDd.close();
    render();
    wrap.classList.add('is-open');
    // flip upward when there isn't room below
    const r = btn.getBoundingClientRect();
    wrap.classList.toggle('dd--up', innerHeight - r.bottom < 280 && r.top > innerHeight - r.bottom);
    btn.setAttribute('aria-expanded', 'true');
    openDd = api;
    setActive(Math.max(0, select.selectedIndex));
    list.focus({ preventScroll: true });
  };
  const close = (focusBtn = false) => {
    wrap.classList.remove('is-open');
    btn.setAttribute('aria-expanded', 'false');
    if (openDd === api) openDd = null;
    if (focusBtn) btn.focus({ preventScroll: true });
  };
  const choose = (i) => {
    if (i !== select.selectedIndex) {
      select.selectedIndex = i;
      select.dispatchEvent(new Event('input', { bubbles: true }));
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    render();
    close(true);
  };
  const api = { close };

  btn.addEventListener('click', () => (wrap.classList.contains('is-open') ? close() : open()));
  btn.addEventListener('keydown', (e) => {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      open();
    }
  });
  list.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (li) choose(Number(li.dataset.i));
  });
  list.addEventListener('pointermove', (e) => {
    const li = e.target.closest('li');
    if (li && Number(li.dataset.i) !== active) setActive(Number(li.dataset.i));
  });
  let typed = '';
  let typeTimer;
  list.addEventListener('keydown', (e) => {
    const n = list.children.length;
    if (e.key === 'ArrowDown') setActive(active + 1);
    else if (e.key === 'ArrowUp') setActive(active - 1);
    else if (e.key === 'Home') setActive(0);
    else if (e.key === 'End') setActive(n - 1);
    else if (e.key === 'Enter' || e.key === ' ') choose(active);
    else if (e.key === 'Escape') close(true);
    else if (e.key === 'Tab') close();
    else if (e.key.length === 1) {
      typed += e.key.toLowerCase();
      clearTimeout(typeTimer);
      typeTimer = setTimeout(() => (typed = ''), 600);
      const hit = opts().findIndex((o) => o.text.toLowerCase().startsWith(typed));
      if (hit >= 0) setActive(hit);
      return;
    } else return;
    e.preventDefault();
  });
  list.addEventListener('focusout', (e) => {
    if (!wrap.contains(e.relatedTarget)) close();
  });

  render();
}

export function initSelects(root = document) {
  root.querySelectorAll('select').forEach(enhance);
}

document.addEventListener('pointerdown', (e) => {
  if (openDd && !e.target.closest('.dd.is-open')) openDd.close();
});
