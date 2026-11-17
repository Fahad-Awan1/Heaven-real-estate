import { intents, START_CHIPS, CITY_ALIASES, AREA_ALIASES, TYPE_ALIASES, FEATURE_WORDS } from '../../data/chatbot.js';
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

/* ---------- PKR amounts: "2 crore", "2.5cr", "80 lac", "50k", "rs 90 lakh", "1,50,000" ---------- */
// groups: 1 currency prefix, 2 number, 3 unit
const AMOUNT = '(pkr|rs\\.?|rupees)?\\s*(\\d[\\d,]*(?:\\.\\d+)?)\\s*(crores?|karor|karod|cr|lakhs?|lacs?|lac|thousand|k|millions?|mil|mn|m)?(?![\\w-])';
const MAX_RE = new RegExp(`(?:under|below|less than|not more than|max|maximum|up ?to|within|budget(?: of| is)?|till|<)\\s*${AMOUNT}|${AMOUNT}\\s*(?:tak|tk|max|maximum|or less|budget)(?![\\w-])`);
const MIN_RE = new RegExp(`(?:over|above|more than|from|min|minimum|at least|starting(?: from| at)?|>)\\s*${AMOUNT}`);
// a bare number followed by one of these is a size/count, not money
const NOT_MONEY = /^\s*(marla|kanal|bed|beds|bedroom|bedrooms|br|bd|room|rooms|sq|yd|years?|yrs?|%|percent)\b/;

function toRupees(num, unit, rentContext) {
  let n = parseFloat(num.replace(/,/g, ''));
  if (isNaN(n) || n <= 0) return null;
  const u = unit || '';
  if (/^(cr|karo)/.test(u)) n *= 1e7;
  else if (/^la/.test(u)) n *= 1e5;
  else if (/^(k|thousand)/.test(u)) n *= 1e3;
  else if (/^m/.test(u)) n *= 1e6;
  else if (n < 100) n *= rentContext ? 1e5 : 1e7; // "under 5": 5 lakh a month, or 5 crore
  else if (n < 10000) n *= 1e3; // "under 150": 150K
  return n;
}

/** Best money amount in free text: one with a unit/currency first, then a big plain number, then (optionally) a small one. */
function findAmount(text, rentContext, allowSmall) {
  let big = null;
  let small = null;
  for (const m of text.matchAll(new RegExp(AMOUNT, 'g'))) {
    if (m[1] || m[3]) return toRupees(m[2], m[3], rentContext);
    const raw = parseFloat(m[2].replace(/,/g, ''));
    if (raw >= 10000) big ??= raw;
    else if (allowSmall && raw > 0 && !NOT_MONEY.test(text.slice(m.index + m[0].length))) small ??= m[2];
  }
  if (big) return big;
  return small ? toRupees(small, '', rentContext) : null;
}

const aliasRe = (alias) => new RegExp(`(?<![\\w-])${alias}(?![\\w-])`);
const AREA_KEYS = Object.keys(AREA_ALIASES).sort((a, b) => b.length - a.length);

export function parseFilters(text) {
  const f = { features: [] };
  // "f7", "f 7", "F-7" -> "f-7"
  const t = text.replace(/\bf\s?-?\s?(6|7|8|10|11)\b/g, 'f-$1');
  if (/\b(rent|rental|rentals|renting|lease|monthly|per month|\/mo|kiraya|kiraye|tenant)\b/.test(t)) f.status = 'rent';
  else if (/\b(buy|buying|purchase|for sale|sale|own|khareed|khareedna)\b/.test(t)) f.status = 'sale';

  for (const [alias, city] of Object.entries(CITY_ALIASES)) {
    if (aliasRe(alias).test(t)) {
      f.city = city;
      break;
    }
  }
  for (const alias of AREA_KEYS) {
    if (aliasRe(alias).test(t)) {
      const a = AREA_ALIASES[alias];
      f.area = a.area;
      if (!f.city && a.city) f.city = a.city;
      break;
    }
  }
  for (const [alias, type] of Object.entries(TYPE_ALIASES)) {
    if (type && aliasRe(alias).test(t)) {
      f.type = type;
      break;
    }
  }
  if (/\bplots?\b/.test(t)) f.plot = true;
  const beds = t.match(/(\d+|one|two|three|four|five|six)\s*\+?\s*-?\s*(?:bed|beds|bedroom|bedrooms|br|bd|bdr)\b/);
  if (beds) f.beds = NUMBER_WORDS[beds[1]] || parseInt(beds[1], 10);

  const rentCtx = f.status === 'rent';
  const max = t.match(MAX_RE);
  const min = t.match(MIN_RE);
  if (max) f.max = max[2] ? toRupees(max[2], max[3], rentCtx) : toRupees(max[5], max[6], rentCtx);
  if (min) f.min = toRupees(min[2], min[3], rentCtx);
  if (!f.max && !f.min) {
    const bare = findAmount(t, rentCtx, false);
    if (bare) {
      f.max = bare * 1.1;
      f.around = bare;
    }
  }
  // A budget implies buy vs rent when the user didn't say. Rents are monthly
  // (roughly 50K to 8 Lakh); sale prices start around 1.5 Crore.
  if (!f.status && (f.max || f.min)) f.status = (f.around || f.max || f.min) >= 1e6 ? 'sale' : 'rent';
  for (const [w, tag] of Object.entries(FEATURE_WORDS)) {
    if (aliasRe(w).test(t) && !f.features.includes(tag)) f.features.push(tag);
  }
  return f;
}

const inArea = (p, area) => `${p.area} ${p.address}`.toLowerCase().includes(area.toLowerCase());

function runSearch(f, { sort, featured } = {}) {
  let list = properties.filter(
    (p) =>
      (!f.status || p.status === f.status) &&
      (!f.city || p.city === f.city) &&
      (!f.area || inArea(p, f.area)) &&
      (!f.type || p.type === f.type) &&
      (!f.beds || p.beds >= f.beds) &&
      (!f.max || p.price <= f.max) &&
      (!f.min || p.price >= f.min) &&
      (!featured || p.featured) &&
      f.features.every((tag) => [...p.tags, ...p.features].join(' ').toLowerCase().includes(tag.toLowerCase())),
  );
  if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price);
  return list;
}

const cardsHtml = (list) =>
  `<div class="msg-cards">${list
    .slice(0, 3)
    .map(
      (p) => `<a class="msg-card" href="/property.html?id=${p.id}"><img src="/images/${p.img}-sm.webp" alt="" loading="lazy"><div><strong>${escapeHtml(p.title)}</strong><span>${escapeHtml(`${p.area}, ${p.city}`)} · ${money(p.price)}${p.status === 'rent' ? ' /mo' : ''} · ${p.beds} bd</span></div></a>`,
    )
    .join('')}</div>`;

function searchQuery(f) {
  const q = new URLSearchParams();
  if (f.status) q.set('status', f.status);
  if (f.city) q.set('city', f.city);
  if (f.type) q.set('type', f.type);
  if (f.beds) q.set('beds', f.beds);
  if (f.max) q.set('max', Math.round(f.max));
  // the listings page filters by city only; sub-areas go in its text search
  if (f.area) q.set('q', f.area);
  return `/properties.html?${q}`;
}

function describe(f, count = 2) {
  const perMonth = f.status === 'rent' ? ' /mo' : '';
  const noun = f.type ? f.type.toLowerCase() : 'home';
  const bits = [count === 1 ? noun : noun + 's'];
  if (f.status) bits.push(f.status === 'rent' ? 'for rent' : 'for sale');
  if (f.beds) bits.push(`with ${f.beds}+ beds`);
  if (f.area || f.city) bits.push(`in ${[f.area, f.city].filter(Boolean).join(', ')}`);
  if (f.around) bits.push(`around ${money(f.around, { compact: true })}${perMonth}`);
  else if (f.max) bits.push(`under ${money(f.max, { compact: true })}${perMonth}`);
  if (f.min) bits.push(`from ${money(f.min, { compact: true })}${perMonth}`);
  if (f.features.length) bits.push(`with ${f.features.join(', ').toLowerCase()}`);
  return bits.join(' ');
}

function searchReply(f, opts = {}) {
  // price-sorted answers only make sense within one status (rent is monthly)
  if (opts.sort && !f.status) f = { ...f, status: 'sale' };
  const plotNote = f.plot ? `We mostly list ready homes rather than open plots (an advisor can help with plots and files). ` : '';
  const list = runSearch(f, opts);
  if (list.length) {
    const head = opts.featured
      ? `Here are a few of our featured homes ✨`
      : opts.sort
        ? `Here are our ${opts.sort === 'price-asc' ? 'most affordable' : 'most exclusive'} homes${f.status ? (f.status === 'rent' ? ' to rent' : ' for sale') : ''}:`
        : `${plotNote}I found <strong>${list.length}</strong> ${describe(f, list.length)} 🏡`;
    return {
      html: `${head}${cardsHtml(list)}${list.length > 3 || !opts.featured ? `<p style="margin-top:8px"><a href="${searchQuery(f)}">See ${list.length > 3 ? `all ${list.length}` : 'them'} on the listings page →</a></p>` : ''}`,
      chips: ['Book a tour', 'Home finance', 'Refine search'],
    };
  }
  const loose = { features: [], status: f.status };
  let fallback = [
    runSearch({ ...f, max: f.max ? f.max * 1.6 : undefined, beds: f.beds ? f.beds - 1 : undefined, features: [] }),
    runSearch({ ...loose, city: f.city, area: f.area, type: f.type }),
    runSearch({ ...loose, city: f.city }),
    runSearch(loose),
  ].find((l) => l.length);
  if (f.max) fallback = [...fallback].sort((a, b) => Math.abs(a.price - f.max) - Math.abs(b.price - f.max));
  return {
    html: `${plotNote}I couldn’t find ${describe(f)} right now. New homes arrive weekly! Here are the closest matches:${cardsHtml(fallback)}`,
    chips: ['Alert me to new listings', 'Talk to an agent'],
  };
}

/** Indicative bank home finance: 30% down, ~14% (KIBOR-linked), 20 years. */
function financeReply(price) {
  const down = price * 0.3;
  const loan = price - down;
  const r = 0.14 / 12;
  const n = 240;
  const monthly = (loan * r) / (1 - Math.pow(1 + r, -n));
  return {
    html: `For a <strong>${money(price)}</strong> home:<ul>
      <li>Down payment (30%): <strong>${money(down)}</strong></li>
      <li>Financed by the bank: ${money(loan)} at ~14% over 20 years</li>
      <li>Monthly instalment: <strong>${money(monthly, { exact: true })}</strong></li></ul>
      This is indicative only. Rates are linked to KIBOR, and the bank decides your actual rate and eligibility. Want an introduction to a bank’s home finance team?`,
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
      properties.find((p) => text.includes(normalize(p.area))) ||
      properties.find((p) => text.includes(normalize(p.city)));
    if (!found && !/not sure|any|dont know|unsure/.test(text))
      return { html: `I couldn’t find that one. Try a name like “Modern Villa”, or tap “Not sure yet”.`, chips: [...properties.filter((p) => p.featured).slice(0, 4).map((p) => p.title), 'Not sure yet'] };
    flow.property = found?.id || null;
    flow.step = 'day';
    saveFlow();
    return {
      html: found ? `Great choice: <strong>${escapeHtml(found.title)}</strong> in ${escapeHtml(`${found.area}, ${found.city}`)}. When would you like to visit?` : `No problem, an advisor will suggest homes based on your brief. When are you free?`,
      chips: ['Tomorrow', 'This weekend', 'Next week'],
    };
  }
  if (flow.step === 'day') {
    flow.day = raw.trim().slice(0, 40);
    flow.step = 'contact';
    saveFlow();
    return { html: `Perfect. What’s the best email, phone or WhatsApp number to confirm your visit?` };
  }
  if (flow.step === 'contact') {
    const email = raw.match(/\S+@\S+\.\S+/);
    const phone = raw.replace(/[^\d+]/g, '');
    if (!email && phone.length < 7) return { html: `Hmm, that doesn’t look like an email or phone number. Could you try again? (or type “cancel”)` };
    const p = getProperty(flow.property);
    const agent = getAgent(p?.agent || 'ayesha');
    const ref = 'HV-' + Math.random().toString(36).slice(2, 7).toUpperCase();
    const reply = {
      html: `You’re booked in! ✨<ul>
        <li><strong>Home:</strong> ${p ? escapeHtml(p.title) : 'Advisor’s selection'}</li>
        <li><strong>When:</strong> ${escapeHtml(flow.day)}</li>
        <li><strong>Your host:</strong> ${agent.name}</li>
        <li><strong>Reference:</strong> ${ref}</li></ul>
        ${agent.name.split(' ')[0]} will confirm the exact time at <strong>${escapeHtml((email ? email[0] : phone).slice(0, 40))}</strong> within the hour.`,
      chips: ['Home finance', 'Show featured homes', 'That’s all, thanks'],
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

  // Home finance maths when a price is mentioned ("finance on 3 crore", "installment for 2.5 cr")
  if (/\b(mortgage|finance|financing|loan|installments?|instalments?|qist|aqsaat|emi|monthly payment|afford|repayment)\b/.test(text) && !/\b(rent|rental|renting|kiraya)\b/.test(text)) {
    const price = findAmount(text, false, true);
    if (price) return financeReply(price);
  }

  if (/^(yes,? connect me|alert me|alert me to new listings)/.test(text))
    return { html: `Done! An advisor will reach out shortly. You can also leave your details on our <a href="/contact.html">contact page</a> for a faster reply.`, chips: ['Talk to an agent', 'Show featured homes'] };
  if (/^refine search/.test(text))
    return { html: `Sure! Tell me what to change, e.g. <em>“4 beds in Bahria Town under 4 crore”</em> or <em>“flat for rent in F-11 under 1.5 lakh”</em>.` };
  if (/^take the quiz/.test(text)) {
    import('./quiz.js').then((m) => m.openQuiz());
    return { html: `Opening the Sitara Match quiz for you ✨` };
  }
  if (/^show homes in budget/.test(text)) return searchReply({ features: [], status: 'sale', max: 5e7 });

  const f = parseFilters(text);
  const hasFilter = f.city || f.area || f.type || f.beds || f.max || f.min || f.features.length;
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
    html: `I’m not quite sure I caught that 🤔 I can help with <strong>buying</strong>, <strong>renting</strong>, <strong>selling</strong>, <strong>home finance</strong> and <strong>site visits</strong>. Or try a search like <em>“2 bed flat for rent in F-11”</em>.`,
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
      html: `Looking to buy, rent or sell? Ask me anything, or try <em>“3 bed house in DHA Lahore”</em>.`,
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
