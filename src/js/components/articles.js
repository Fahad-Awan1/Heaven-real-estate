import { img, escapeHtml } from '../core/utils.js';

export const formatDate = (iso) =>
  new Date(iso + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export function articleCard(a) {
  return `<article class="a-card" data-reveal>
    <div class="a-card__media">${img(a.img, '', { sizes: '(max-width: 768px) 100vw, 33vw' })}</div>
    <div class="a-card__meta"><span class="badge">${a.category}</span>${formatDate(a.date)} · ${a.read} min read</div>
    <h3><a href="/article.html?id=${a.id}">${escapeHtml(a.title)}</a></h3>
    <p>${escapeHtml(a.excerpt)}</p>
  </article>`;
}
