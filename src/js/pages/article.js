import '../main.js';
import { articles, getArticle } from '../../data/articles.js';
import { articleCard, formatDate } from '../components/articles.js';
import { $, img, params, escapeHtml, toast } from '../core/utils.js';

const a = getArticle(params().get('id')) || articles[0];
document.title = `${a.title} — Sitara Journal`;
$('meta[name="description"]').setAttribute('content', a.excerpt);
$('[data-meta]').innerHTML = `<span class="badge">${a.category}</span>${formatDate(a.date)} · ${a.read} min read`;
$('[data-title]').textContent = a.title;
$('[data-excerpt]').textContent = a.excerpt;
$('[data-cover]').innerHTML = img(a.img, '', { sizes: '(max-width: 1100px) 100vw, 1100px', eager: true });

const paras = a.body.map((p) => `<p>${escapeHtml(p)}</p>`);
// pull-quote after the second paragraph for rhythm
if (paras.length > 2) paras.splice(2, 0, `<blockquote>“${escapeHtml(a.excerpt)}”</blockquote>`);
$('[data-body]').innerHTML = paras.join('');

$('[data-related]').innerHTML = articles
  .filter((x) => x.id !== a.id)
  .slice(0, 3)
  .map(articleCard)
  .join('');

$('[data-copy]').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    toast('Link copied');
  } catch {
    toast('Copy failed. Use the address bar.');
  }
});
$('[data-share-x]').href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(a.title)}&url=${encodeURIComponent(location.href)}`;

const bar = $('.read-progress');
const onScroll = () => {
  const el = $('[data-body]');
  const r = el.getBoundingClientRect();
  const p = Math.min(1, Math.max(0, -r.top / (r.height - innerHeight * 0.6)));
  bar.style.transform = `scaleX(${p})`;
};
addEventListener('scroll', onScroll, { passive: true });
onScroll();
