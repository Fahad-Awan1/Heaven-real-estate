import { intents, START_CHIPS, CITY_ALIASES, TYPE_ALIASES, FEATURE_WORDS } from '../../data/chatbot.js';
import { properties, getProperty } from '../../data/properties.js';
import { getAgent } from '../../data/agents.js';
import { $, escapeHtml, money, session, params, isMobile } from '../core/utils.js';
import { stopScroll, startScroll } from '../core/motion.js';

/* =========================================================
   Engine
   ========================================================= */
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6 };

const normalize = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^\p{L}\p{N}$.,+\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

function lev(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 3;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return dp[a.length][b.length];
}
const wordMatch = (token, kw) =>
  token === kw || (kw.length >= 5 && token.length >= 4 && lev(token, kw) <= (kw.length >= 8 ? 2 : 1));

function scoreIntents(raw) {
  const text = raw.replace(/[,.](?!\d)/g, ' ').replace(/\s+/g, ' ').trim();
  const tokens = text.split(' ');
  let best = null;
  for (const intent of intents) {
    let score = 0;
    for (const kw of intent.keywords) {
      const k = normalize(kw);
      if (k.includes(' ')) {
        if (` ${text} `.includes(` ${k} `)) score += 1 + k.split(' ').length;
      } else if (tokens.some((t) => wordMatch(t, k))) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { intent, score };
  }
  return best;
}

function parseAmount(num, unit, rentContext) {
  let n = parseFloat(num.replace(/,/g, ''));
  if (isNaN(n)) return null;
  if (/^k|thousand/.test(unit || '')) n *= 1e3;
  else if (/^m|million|mil/.test(unit || '')) n *= 1e6;
  else if (n < 100) n *= rentContext ? 1e3 : 1e6;
  return n;
}

export function parseFilters(text) {
  const f = { features: [] };
  if (/\b(rent|rental|rentals|renting|lease|monthly|per month|\/mo)\b/.test(text)) f.status = 'rent';
  else if (/\b(buy|buying|purchase|for sale|sale|own)\b/.test(text)) f.status = 'sale';

  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`).test(text)) {
      f.city = city;
      break;
    }
  }
  for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
    if (type && new RegExp(`\\b${alias}\\b`).test(text)) {
      f.type = type;
      break;
    }
  }
  const beds = text.match(/(\d+|one|two|three|four|five|six)\s*\+?\s*-?\s*(?:bed|beds|bedroom|bedrooms|br|bd|bdr)\b/);
  if (beds) f.beds = NUMBER_WORDS[beds[1]] || parseInt(beds[1], 10);

  const rentCtx = f.status === 'rent';
  const max = text.match(/(?:under|below|less than|max|maximum|up to|within|budget(?: of| is)?|<)\s*\$?\s*([\d.,]+)\s*(k|m|million|mil|thousand)?\b/);
  const min = text.match(/(?:over|above|more than|from|min|minimum|at least|>)\s*\$?\s*([\d.,]+)\s*(k|m|million|mil|thousand)?\b/);
  if (max) f.max = parseAmount(max[1], max[2], rentCtx);
  if (min) f.min = parseAmount(min[1], min[2], rentCtx);
  if (!max && !min) {
    const bare = text.match(/\$\s*([\d.,]+)\s*(k|m|million|mil|thousand)?\b|\b([\d.,]+)\s*(k|m|million|mil)\b/);
    if (bare) f.max = parseAmount(bare[1] || bare[3], bare[2] || bare[4], rentCtx) * 1.1;
  }
  // A budget implies buy vs rent when the user didn't say (rents are monthly)
  if (!f.status && (f.max || f.min)) f.status = (f.max || f.min) >= 100000 ? 'sale' : 'rent';
  for (const [w, tag] of Object.entries(FEATURE_WORDS)) {
    if (new RegExp(`\\b${w}\\b`).test(text) && !f.features.includes(tag)) f.features.push(tag);
  }
  return f;
}

function runSearch(f, { sort, featured } = {}) {
  let list = properties.filter(
    (p) =>
      (!f.status || p.status === f.status) &&
      (!f.city || p.city === f.city) &&
      (!f.type || p.type === f.type) &&
      (!f.beds || p.beds >= f.beds) &&
      (!f.max || p.price <= f.max) &&
      (!f.min || p.price >= f.min) &&
      (!featured || p.featured) &&
      f.features.every((tag) => p.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase())) || (tag === 'Pet friendly' && p.features.join(' ').toLowerCase().includes('pet'))),
  );
  if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

const cardsHtml = (list) =>
  `<div class="msg-cards">${list
    .slice(0, 3)
    .map(
      (p) => `<a class="msg-card" href="/property.html?id=${p.id}"><img src="/images/${p.img}-sm.webp" alt="" loading="lazy"><div><strong>${escapeHtml(p.title)}</strong><span>${p.city} · ${money(p.price)}${p.status === 'rent' ? '/mo' : ''} · ${p.beds} bd</span></div></a>`,
    )
    .join('')}</div>`;

function searchQuery(f) {
  const q = new URLSearchParams();
  if (f.status) q.set('status', f.status);
  if (f.city) q.set('city', f.city);
  if (f.type) q.set('type', f.type);
  if (f.beds) q.set('beds', f.beds);
  if (f.max) q.set('max', Math.round(f.max));
  return `/properties.html?${q}`;
}

function describe(f) {
  const bits = [f.type ? f.type.toLowerCase() + 's' : 'homes'];
  if (f.status) bits.push(f.status === 'rent' ? 'for rent' : 'for sale');
  if (f.beds) bits.push(`with ${f.beds}+ beds`);
  if (f.city) bits.push(`in ${f.city}`);
  if (f.max) bits.push(`under ${money(f.max, { compact: true })}`);
  if (f.features.length) bits.push(`with ${f.features.join(', ').toLowerCase()}`);
  return bits.join(' ');
}

function searchReply(f, opts = {}) {
  // price-sorted answers only make sense within one status (rent is monthly)
  if (opts.sort && !f.status) f = { ...f, status: 'sale' };
  const list = runSearch(f, opts);
  if (list.length) {
    const head = opts.featured
      ? `Here are a few of our featured homes ✨`
      : opts.sort
        ? `Here are our ${opts.sort === 'price-asc' ? 'most affordable' : 'most exclusive'} homes${f.status ? (f.status === 'rent' ? ' to rent' : ' for sale') : ''}:`
        : `I found <strong>${list.length}</strong> ${describe(f)} 🏡`;
    return {
      html: `${head}${cardsHtml(list)}${list.length > 3 || !opts.featured ? `<p style="margin-top:8px"><a href="${searchQuery(f)}">See ${list.length > 3 ? `all ${list.length}` : 'them'} on the listings page →</a></p>` : ''}`,
      chips: ['Book a tour', 'Mortgage help', 'Refine search'],
    };
  }
  const relaxed = runSearch({ ...f, max: f.max ? f.max * 1.6 : undefined, beds: f.beds ? f.beds - 1 : undefined, features: [] });
  const fallback = relaxed.length ? relaxed : runSearch({ features: [], status: f.status });
  return {
    html: `I couldn’t find ${describe(f)} right now. New homes arrive weekly! Here are the closest matches:${cardsHtml(fallback)}`,
    chips: ['Alert me to new listings', 'Talk to an agent'],
  };
}

function mortgageReply(price) {
  const down = price * 0.2;
  const loan = price - down;
  const r = 0.065 / 12;
  const n = 360;
  const monthly = (loan * r) / (1 - Math.pow(1 + r, -n));
  const tax = (price * 0.0115) / 12;
  return {
    html: `For a <strong>${money(price)}</strong> home:<ul>
      <li>Down payment (20%): <strong>${money(down)}</strong></li>
      <li>Loan: ${money(loan)} at 6.5% over 30 years</li>
      <li>Principal &amp; interest: <strong>${money(monthly)}/mo</strong></li>
      <li>Est. property tax: ~${money(tax)}/mo</li></ul>
      That’s roughly <strong>${money(monthly + tax)}/mo</strong> all-in. Want an introduction to a lender for pre-approval?`,
    chips: ['Yes, connect me', 'Show homes in budget'],
  };
}

/* ---------- Tour booking flow ---------- */
let flow = session.get('hv-chat-flow', null);
const saveFlow = () => session.set('hv-chat-flow', flow);

function startTour() {
  const here = getProperty(params().get('id') || '');
  if (here && location.pathname.includes('property')) {
    flow = { type: 'tour', step: 'day', property: here.id };
    saveFlow();
    return { html: `Lovely, let’s get you into <strong>${escapeHtml(here.title)}</strong>. When suits you best?`, chips: ['Tomorrow', 'This weekend', 'Next week'] };
  }
  flow = { type: 'tour', step: 'property' };
  saveFlow();
  return {
    html: `I’d love to set that up! Which home would you like to see? Pick one or type its name.`,
    chips: [...properties.filter((p) => p.featured).slice(0, 4).map((p) => p.title), 'Not sure yet'],
  };
}

function continueFlow(text, raw) {
  if (/\b(cancel|stop|never ?mind|forget it|exit|quit)\b/.test(text)) {
    flow = null;
    saveFlow();
    return { html: 'No problem, I’ve cancelled that. What else can I help with?', chips: START_CHIPS };
  }
  if (flow.step === 'property') {
    const found =
      properties.find((p) => text.includes(normalize(p.title))) ||
      properties.find((p) => normalize(p.title).split(' ').some((w) => w.length > 4 && text.includes(w))) ||
      properties.find((p) => text.includes(normalize(p.city)));
    if (!found && !/not sure|any|dont know|unsure/.test(text))
      return { html: `I couldn’t find that one. Try a name like “Modern Villa”, or tap “Not sure yet”.`, chips: [...properties.filter((p) => p.featured).slice(0, 4).map((p) => p.title), 'Not sure yet'] };
    flow.property = found?.id || null;
    flow.step = 'day';
    saveFlow();
    return {
      html: found ? `Great choice: <strong>${escapeHtml(found.title)}</strong> in ${found.city}. When would you like to visit?` : `No problem, an advisor will suggest homes based on your brief. When are you free?`,
      chips: ['Tomorrow', 'This weekend', 'Next week'],
    };
  }
  if (flow.step === 'day') {
    flow.day = raw.trim().slice(0, 40);
    flow.step = 'contact';
    saveFlow();
    return { html: `Perfect. What’s the best email or phone number to confirm your tour?` };
  }
  if (flow.step === 'contact') {
    const email = raw.match(/\S+@\S+\.\S+/);
    const phone = raw.replace(/[^\d+]/g, '');
    if (!email && phone.length < 7) return { html: `Hmm, that doesn’t look like an email or phone number. Could you try again? (or type “cancel”)` };
    const p = getProperty(flow.property);
    const agent = getAgent(p?.agent || 'sofia');
    const ref = 'HV-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const reply = {
      html: `You’re booked in! ✨<ul>
        <li><strong>Home:</strong> ${p ? escapeHtml(p.title) : 'Advisor’s selection'}</li>
        <li><strong>When:</strong> ${escapeHtml(flow.day)}</li>
        <li><strong>Your host:</strong> ${agent.name}</li>
        <li><strong>Reference:</strong> ${ref}</li></ul>
        ${agent.name.split(' ')[0]} will confirm the exact time at <strong>${escapeHtml((email ? email[0] : phone).slice(0, 40))}</strong> within the hour.`,
      chips: ['Mortgage help', 'Show featured homes', 'That’s all, thanks'],
    };
    flow = null;
    saveFlow();
    return reply;
  }
  flow = null;
  saveFlow();
  return null;
}

/** Turns a user message into a reply `{ html, chips }`. */
export function respond(raw) {
  const text = normalize(raw.replace(/^[^\p{L}\p{N}$]+/u, ''));
  if (!text) return { html: 'Could you tell me a bit more?' };
  if (flow) {
    const r = continueFlow(text, raw);
    if (r) return r;
  }

  // Mortgage maths when a price is mentioned
  if (/\b(mortgage|monthly|payment|afford|loan|repayment)/.test(text)) {
    const m = text.match(/\$?\s*([\d.,]+)\s*(k|m|million|mil)?\b/);
    if (m && parseFloat(m[1]) > 0) return mortgageReply(parseAmount(m[1], m[2], false));
  }

  if (/^(yes,? connect me|alert me|alert me to new listings)/.test(text))
    return { html: `Done! An advisor will reach out shortly. You can also leave your details on our <a href="/contact.html">contact page</a> for a faster reply.`, chips: ['Talk to an agent', 'Show featured homes'] };
  if (/^refine search/.test(text))
    return { html: `Sure! Tell me what to change, e.g. <em>“4 beds in Pasadena under 2.5M”</em> or <em>“apartments to rent with a pool”</em>.` };
  if (/^take the quiz/.test(text)) {
    import('./quiz.js').then((m) => m.openQuiz());
    return { html: `Opening the Sitara Match quiz for you ✨` };
  }
  if (/^show homes in budget/.test(text)) return searchReply({ features: [], status: 'sale', max: 2000000 });

  const f = parseFilters(text);
  const hasFilter = f.city || f.type || f.beds || f.max || f.min || f.features.length;
  const searchy = /\b(show|find|search|looking for|look for|any|homes|houses|properties|listings|available|options|rentals|in|under)\b/.test(text);
  const best = scoreIntents(text);
  const informational = /\b(how|what|process|documents|fees?|steps|why|when|are|is|can|allowed)\b/.test(text);

  if (best?.intent.search && !hasFilter) return searchReply({ ...f }, best.intent.search);
  if ((hasFilter && !(informational && best && !best.intent.search)) || (f.status && searchy && !informational)) {
    return searchReply(f, best?.intent.search || {});
  }
  if (best) {
    if (best.intent.flow === 'tour') return startTour();
    return { html: best.intent.reply(), chips: best.intent.chips };
  }
  return {
    html: `I’m not quite sure I caught that 🤔 I can help with <strong>buying</strong>, <strong>renting</strong>, <strong>selling</strong>, <strong>mortgages</strong> and <strong>tours</strong>. Or try a search like <em>“2 bed apartment to rent in Santa Monica”</em>.`,
    chips: START_CHIPS,
  };
}

/* =========================================================
   UI
   ========================================================= */
const root = document.documentElement;
const chat = $('#chat');
const body = $('.chat__body', chat);
const chipsEl = $('.chat__chips', chat);
const form = $('.chat__form', chat);
const input = $('#chat-input');
const launcher = $('.chat-launcher');
let history = session.get('hv-chat', []);
let busy = false;

const scrollDown = () => requestAnimationFrame(() => (body.scrollTop = body.scrollHeight));

function addMessage(from, html, persist = true) {
  const el = document.createElement('div');
  el.className = `msg msg--${from}`;
  el.innerHTML = html;
  body.appendChild(el);
  if (persist) {
    history.push({ from, html });
    history = history.slice(-40);
    session.set('hv-chat', history);
  }
  scrollDown();
}

function setChips(chips = []) {
  chipsEl.innerHTML = chips.map((c) => `<button type="button" class="chip">${escapeHtml(c)}</button>`).join('');
}

function botReply(reply) {
  const typing = document.createElement('div');
  typing.className = 'msg msg--bot typing';
  typing.innerHTML = '<i></i><i></i><i></i>';
  body.appendChild(typing);
  scrollDown();
  busy = true;
  const delay = Math.min(1400, 450 + reply.html.replace(/<[^>]+>/g, '').length * 4);
  setTimeout(() => {
    typing.remove();
    addMessage('bot', reply.html);
    setChips(reply.chips);
    busy = false;
  }, delay);
}

export function ask(text) {
  if (busy || !text.trim()) return;
  addMessage('user', escapeHtml(text.trim()));
  setChips([]);
  botReply(respond(text));
}

function hydrate() {
  if (body.childElementCount) return;
  if (history.length) {
    history.forEach((m) => addMessage(m.from, m.html, false));
    setChips(START_CHIPS);
  } else {
    const h = new Date().getHours();
    const hello = h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
    addMessage('bot', `${hello}! ☀️ I’m <strong>Halo</strong>, your Sitara assistant.`);
    botReply({
      html: `Looking to buy, rent or sell? Ask me anything, or try <em>“3 bed villa in Malibu”</em>.`,
      chips: START_CHIPS,
    });
  }
}

export function openChat() {
  hydrate();
  root.classList.add('chat-open');
  launcher.setAttribute('aria-expanded', 'true');
  $('.nudge', launcher)?.classList.remove('is-on');
  if (isMobile()) stopScroll();
  setTimeout(() => input.focus({ preventScroll: true }), 350);
}

export function closeChat() {
  root.classList.remove('chat-open');
  launcher.setAttribute('aria-expanded', 'false');
  startScroll();
  launcher.focus({ preventScroll: true });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const v = input.value;
  input.value = '';
  ask(v);
});
chipsEl.addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) ask(chip.textContent);
});
$('[data-chat-close]', chat).addEventListener('click', closeChat);
addEventListener('keydown', (e) => e.key === 'Escape' && root.classList.contains('chat-open') && closeChat());
body.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="/"]');
  if (a && isMobile()) closeChat();
});
