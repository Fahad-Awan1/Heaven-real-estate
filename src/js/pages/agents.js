import '../main.js';
import { agents } from '../../data/agents.js';
import { properties } from '../../data/properties.js';
import { $, $$, escapeHtml } from '../core/utils.js';
import { icons } from '../core/icons.js';

const grid = $('[data-agents]');

function render(spec = '') {
  const list = agents.filter((a) => !spec || a.speciality === spec);
  grid.innerHTML = list
    .map((a, i) => {
      const listings = properties.filter((p) => p.agent === a.id).length;
      return `<article class="agent" style="--n:${i}">
        <div class="agent__media">
          <img src="/images/${a.img}-lg.webp" srcset="/images/${a.img}-sm.webp 430w, /images/${a.img}-lg.webp 800w" sizes="(max-width: 600px) 100vw, 33vw" alt="${escapeHtml(a.name)}" loading="lazy" width="800" height="960">
          <span class="badge">${a.speciality}</span>
          <div class="agent__contact">
            <a href="tel:${a.phone.replace(/[^\d+]/g, '')}" aria-label="Call ${escapeHtml(a.name)}">${icons.phone} Call</a>
            <a href="mailto:${a.email}" aria-label="Email ${escapeHtml(a.name)}">${icons.mail} Email</a>
          </div>
        </div>
        <div class="agent__body">
          <h3>${escapeHtml(a.name)}</h3>
          <span>${a.role} · ${a.languages.join(', ')}</span>
          <p style="color:var(--text-soft);font-size:.92rem;margin-top:6px">${escapeHtml(a.bio)}</p>
          <div class="agent__stats">
            <span><b>${a.sold}</b>Homes sold</span>
            <span><b>${a.years}</b>Years</span>
            <span><b>${listings}</b>Listings</span>
          </div>
        </div>
      </article>`;
    })
    .join('');
}

$('[data-agent-filters]').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-spec]');
  if (!chip) return;
  $$('[data-spec]').forEach((c) => c.setAttribute('aria-pressed', c === chip));
  render(chip.dataset.spec);
});
render();
