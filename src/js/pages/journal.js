import '../main.js';
import { articles } from '../../data/articles.js';
import { articleCard, formatDate } from '../components/articles.js';
import { $, $$, img, escapeHtml } from '../core/utils.js';
import { icons } from '../core/icons.js';

const [lead, ...rest] = articles;
$('[data-feature]').innerHTML = `<article class="a-card feature-article" data-reveal>
  <div class="a-card__media">${img(lead.img, '', { sizes: '(max-width: 900px) 100vw, 60vw', eager: true })}</div>
  <div>
    <div class="a-card__meta"><span class="badge">${lead.category}</span>${formatDate(lead.date)} · ${lead.read} min read</div>
    <h2><a href="/article.html?id=${lead.id}">${escapeHtml(lead.title)}</a></h2>
    <p class="lead">${escapeHtml(lead.excerpt)}</p>
    <span class="btn btn--dark" style="margin-top:22px">Read the story ${icons.arrow}</span>
  </div>
</article>`;

const cats = ['All', ...new Set(rest.map((a) => a.category))];
$('[data-cats]').innerHTML = cats.map((c, i) => `<button class="chip" type="button" aria-pressed="${i === 0}" data-cat="${c}">${c}</button>`).join('');
const grid = $('[data-articles]');
const render = (cat) => {
  grid.innerHTML = rest.filter((a) => cat === 'All' || a.category === cat).map((a) => articleCard(a).replace(' data-reveal', '')).join('');
};
$('[data-cats]').addEventListener('click', (e) => {
  const chip = e.target.closest('[data-cat]');
  if (!chip) return;
  $$('[data-cat]').forEach((c) => c.setAttribute('aria-pressed', c === chip));
  render(chip.dataset.cat);
});
render('All');
