import { icons } from '../core/icons.js';
import { img, priceLabel, escapeHtml } from '../core/utils.js';
import { favs, compare, matchScore } from '../core/store.js';

export const propertyUrl = (p) => `/property.html?id=${p.id}`;

export function propertyCard(p, { compareToggle = false, sizes, eager = false, index } = {}) {
  const fav = favs.has(p.id);
  const match = matchScore(p);
  return `
  <article class="p-card" data-id="${p.id}"${index != null ? ` style="--n:${index}"` : ''}>
    <div class="p-card__media">
      ${img(p.img, `${p.title} in ${p.city}`, { sizes, eager })}
      <div class="p-card__badges">
        <span class="badge ${p.status === 'rent' ? 'badge--accent' : ''}">${p.status === 'rent' ? 'For rent' : 'For sale'}</span>
        ${match ? `<span class="badge badge--match">${match}% match</span>` : ''}
      </div>
    </div>
    <button class="fav-btn ${fav ? 'is-fav' : ''}" type="button" data-fav="${p.id}" aria-pressed="${fav}" aria-label="Save ${escapeHtml(p.title)}">${icons.heart}</button>
    <div class="p-card__body">
      <h3 class="p-card__title"><a class="p-card__link" href="${propertyUrl(p)}">${escapeHtml(p.title)}</a></h3>
      <p class="p-card__loc">${icons.pin}${escapeHtml(p.city)}, CA</p>
      <div class="p-card__row">
        <span class="p-card__price">${priceLabel(p)}</span>
        <span class="specs">${p.beds} beds<i></i>${p.baths} baths<i></i>${p.sqft.toLocaleString()} ft²</span>
      </div>
      ${
        compareToggle
          ? `<label class="compare-check"><input type="checkbox" data-compare="${p.id}" ${compare.has(p.id) ? 'checked' : ''}> Compare</label>`
          : ''
      }
    </div>
  </article>`;
}

export function renderCards(container, list, opts) {
  container.innerHTML = list.map((p) => propertyCard(p, opts)).join('');
}
