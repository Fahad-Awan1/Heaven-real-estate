// Halo's hardcoded knowledge base. Each intent is matched by keyword/phrase
// scoring (with typo tolerance) in src/js/components/chatbot.js.
export const START_CHIPS = ['🏡 Buy a home', '🔑 Rent a home', '💰 Sell my home', '📅 Book a tour', '🧮 Home finance', '📞 Contact'];

const UAN = `<a href="tel:+923049726400">0304 9726400</a>`;
const WHATSAPP = `<a href="https://wa.me/923049726400" target="_blank" rel="noopener">0304 9726400</a>`;

export const intents = [
  {
    id: 'greet',
    keywords: ['hi', 'hello', 'hey', 'hiya', 'yo', 'good morning', 'good afternoon', 'good evening', 'greetings', 'salam', 'salaam', 'assalam', 'aoa', 'asalam o alaikum', 'assalamu alaikum'],
    reply: () =>
      `Wa alaikum assalam, and welcome! 👋 I’m Halo, Sitara’s assistant. I can search homes, explain buying or renting in Pakistan, estimate home finance instalments, or book a visit. What are you looking for today?`,
    chips: START_CHIPS,
  },
  {
    id: 'thanks',
    keywords: ['thanks', 'thank', 'thx', 'cheers', 'appreciate', 'awesome', 'perfect', 'shukriya', 'shukria', 'jazakallah', 'jazak allah'],
    reply: () => `You’re very welcome! Anything else I can help you find? 😊`,
    chips: ['Show featured homes', 'Book a tour', 'No, that’s all'],
  },
  {
    id: 'bye',
    keywords: ['bye', 'goodbye', 'see you', 'later', 'that’s all', 'thats all', 'no thats all', 'nothing else', 'allah hafiz', 'khuda hafiz'],
    reply: () => `Lovely chatting with you. Allah Hafiz, and I’m here whenever you need me. Happy home hunting! 🌅`,
  },
  {
    id: 'help',
    keywords: ['help', 'what can you do', 'options', 'menu', 'start', 'commands', 'how does this work'],
    reply: () => `Here’s what I can do:<ul>
      <li>Search homes: try <em>“3 bed house in DHA Lahore under 12 crore”</em></li>
      <li>Explain how buying, renting, selling and transfer work in Pakistan</li>
      <li>Estimate home finance instalments: <em>“finance on 3 crore”</em></li>
      <li>Book a site visit or connect you with an advisor</li></ul>`,
    chips: START_CHIPS,
  },
  {
    id: 'identity',
    keywords: ['who are you', 'are you human', 'are you a bot', 'robot', 'ai', 'your name', 'real person'],
    reply: () =>
      `I’m Halo, Sitara’s virtual assistant. I’m not a human, but I know our listings inside out. If you’d like a real person, call us on ${UAN} or WhatsApp ${WHATSAPP}.`,
    chips: ['Talk to an agent', 'Search homes'],
  },
  {
    id: 'buy',
    keywords: ['buy', 'buying', 'purchase', 'how to buy', 'buy a home', 'buy a house', 'own', 'buying process', 'khareedna', 'token', 'token money', 'bayana', 'biyana', 'advance payment'],
    reply: () => `Buying with Sitara, step by step:<ul>
      <li><strong>1. Brief:</strong> your budget, preferred areas, plot size (marla/kanal) and timeline</li>
      <li><strong>2. Visits:</strong> shortlisted homes, all viewed by our team first</li>
      <li><strong>3. Document check:</strong> registry or society allotment, NOC, no-dues and the seller’s CNIC verified</li>
      <li><strong>4. Token money (bayana):</strong> usually around 10%, paid against a written agreement</li>
      <li><strong>5. Balance &amp; transfer:</strong> remaining payment, then transfer at the society office or Sub-Registrar</li></ul>
      Browse <a href="/buy.html">homes for sale</a> or tell me what you’re after.`,
    chips: ['Homes for sale', 'How does transfer work?', 'Home finance'],
  },
  {
    id: 'transfer',
    keywords: ['transfer', 'transfer process', 'registry', 'registration', 'mutation', 'intiqal', 'inteqal', 'sub-registrar', 'sub registrar', 'society office', 'title', 'ownership', 'noc', 'allotment', 'possession'],
    reply: () => `Here’s how a transfer usually works:<ul>
      <li><strong>Before:</strong> we verify the title or society allotment, NOC, no-dues certificate and the seller’s CNIC</li>
      <li><strong>Agreement:</strong> token money (bayana, often ~10%) is paid against a written sale agreement</li>
      <li><strong>Taxes:</strong> FBR advance tax (236K for the buyer, 236C for the seller), plus provincial stamp duty and CVT</li>
      <li><strong>Transfer day:</strong> balance is paid and both parties sign at the society office or Sub-Registrar, with biometric verification</li></ul>
      Our team handles the paperwork with you from start to finish.`,
    chips: ['Taxes and filer status', 'Talk to an agent', 'Homes for sale'],
  },
  {
    id: 'tax',
    keywords: ['tax', 'taxes', 'fbr', 'filer', 'non-filer', 'non filer', 'nonfiler', 'atl', '236k', '236c', 'stamp duty', 'cvt', 'advance tax', 'withholding', 'filer status'],
    reply: () =>
      `When a property changes hands, FBR collects advance tax from the <strong>buyer (236K)</strong> and the <strong>seller (236C)</strong>, and the province adds stamp duty and CVT. The rates depend on your <strong>filer status and province</strong>, and filers on the Active Taxpayer List pay much less than non-filers. Your advisor will work out the exact amounts for your deal before you pay token money.`,
    chips: ['How does transfer work?', 'Talk to an agent'],
  },
  {
    id: 'rent',
    keywords: ['rent', 'renting', 'rental', 'lease', 'tenant', 'rent process', 'apply to rent', 'kiraya', 'kiraye'],
    reply: () => `Renting is simple with us:<ul>
      <li>Browse verified <a href="/rent.html">rentals</a> (every one viewed in person by our team)</li>
      <li>Book a visit, often the same week; approval typically takes 48 hours</li>
      <li>Usual terms: two months’ security deposit, one month’s rent in advance, and one month’s rent as commission</li>
      <li>Sign a written rent agreement (1 year is standard, 11 months is also common) and complete tenant police registration</li></ul>`,
    chips: ['Show rentals', 'What documents do I need?', 'Who pays utilities?'],
  },
  {
    id: 'utilities',
    keywords: ['utilities', 'utility', 'bills', 'electricity', 'gas', 'water', 'sui gas', 'wapda', 'lesco', 'iesco', 'k-electric', 'who pays utilities', 'meter'],
    reply: () =>
      `Tenants usually pay electricity, gas and water bills directly, while the landlord covers property tax and major repairs. When you visit, check for separate meters, a working gas connection and a reliable water supply (boring or tank). We confirm all of this in your rent agreement.`,
    chips: ['Show rentals', 'Load-shedding and solar'],
  },
  {
    id: 'power',
    keywords: ['load shedding', 'load-shedding', 'loadshedding', 'solar', 'ups', 'generator', 'backup', 'power cut', 'power', 'bijli', 'net metering', 'inverter'],
    reply: () =>
      `Load-shedding matters, so every listing tells you about power backup. Several of our homes already have solar systems (some 8–10 kW) or generator backup, like the Modern Villa in DHA Phase 6 and the Corner Villa in Bahria Enclave. Ask me for <em>“homes with solar”</em>, and our build team can also quote a solar setup for your new home.`,
    chips: ['Homes with solar', 'Talk to an agent'],
  },
  {
    id: 'sell',
    keywords: ['sell', 'selling', 'list my home', 'list my house', 'valuation', 'value my home', 'worth', 'appraisal', 'how much is my house', 'bechna', 'sell my plot'],
    reply: () =>
      `Thinking of selling? Our <a href="/sell.html">instant valuation tool</a> gives you an estimate in under a minute, and a local advisor then confirms it with a free visit. We handle photos and video, listing, verified buyers and the transfer paperwork. Our listings sell in an average of <strong>41 days</strong> at <strong>97%</strong> of the asking price.`,
    chips: ['Get a valuation', 'What are your fees?', 'Talk to an agent'],
  },
  {
    id: 'finance',
    keywords: ['home finance', 'house finance', 'finance', 'financing', 'mortgage', 'loan', 'home loan', 'bank', 'banks', 'kibor', 'markup', 'profit rate', 'interest rate', 'down payment', 'installment', 'installments', 'instalment', 'instalments', 'qist', 'aqsaat', 'monthly payment', 'afford', 'islamic finance', 'meezan', 'easy installments'],
    reply: () =>
      `I can estimate it! Tell me a price, e.g. <em>“finance on 3 crore”</em>. Pakistani banks (Islamic and conventional) offer home finance for up to <strong>20 years</strong>, usually with <strong>15–30% down</strong> and a profit rate linked to KIBOR. My estimate uses 30% down and an indicative ~14% over 20 years; the bank decides your actual rate and eligibility.`,
    chips: ['Finance on 2 crore', 'Finance on 5 crore', 'Talk to an agent'],
  },
  {
    id: 'tour',
    keywords: ['tour', 'viewing', 'visit', 'site visit', 'see the house', 'see the property', 'appointment', 'schedule', 'book', 'showing', 'view a home'],
    flow: 'tour',
  },
  {
    id: 'contact',
    keywords: ['contact', 'phone', 'email', 'call', 'number', 'address', 'office', 'where are you', 'located', 'location of office', 'reach you', 'whatsapp', 'uan'],
    reply: () => `You can reach us any of these ways:<ul>
      <li>📞 Call ${UAN}</li>
      <li>💬 WhatsApp ${WHATSAPP}</li>
      <li>✉️ <a href="mailto:sitaragroupofbuilder@gmail.com">sitaragroupofbuilder@gmail.com</a></li>
      <li>📍 Head office: Commercial Area, Sector A, Phase 6, near DHA Main Office, Lahore</li><li>📍 Etihad Town Phase 2, Lahore</li><li>📍 Sitara Park City, Jaranwala Road, Faisalabad</li></ul>
      Or send a message through our <a href="/contact.html">contact page</a>.`,
    chips: ['Opening hours', 'Book a tour'],
  },
  {
    id: 'hours',
    keywords: ['hours', 'open', 'opening', 'closing', 'time', 'sunday', 'saturday', 'friday', 'jummah', 'jumma', 'weekend', 'when are you open', 'timings', 'timing'],
    reply: () =>
      `Our offices in Lahore and Faisalabad are open <strong>Mon–Sat, 10am – 7pm</strong>, with a break on Friday for Jumu’ah (1–2:30pm). We’re closed on Sunday, but I’m here 24/7. 🌙`,
    chips: ['Book a tour', 'Contact'],
  },
  {
    id: 'agents',
    keywords: ['agent', 'agents', 'team', 'realtor', 'broker', 'dealer', 'property dealer', 'advisor', 'human', 'speak to someone', 'talk to someone', 'talk to an agent', 'person'],
    reply: () =>
      `Our 18 advisors cover luxury homes in DHA and Gulberg, family homes in Bahria Town, Islamabad and KP, Karachi and investment, rentals, and first-time buyers. Meet them on the <a href="/agents.html">agents page</a>, or call ${UAN} and we’ll connect you with the right person in minutes.`,
    chips: ['Book a tour', 'Contact'],
  },
  {
    id: 'fees',
    keywords: ['fee', 'fees', 'commission', 'cost', 'charge', 'charges', 'how much do you charge', 'price of service'],
    reply: () =>
      `Our commission is simple: <strong>1% of the sale price</strong> when you sell, which covers the valuation visit, photos and video, marketing, buyer screening and help with transfer paperwork. For rentals it’s <strong>one month’s rent</strong>. Government taxes and transfer fees are separate and depend on filer status and province.`,
    chips: ['Sell my home', 'Taxes and filer status', 'Talk to an agent'],
  },
  {
    id: 'documents',
    keywords: ['documents', 'document', 'documents for', 'what documents', 'documents needed', 'paperwork', 'requirements', 'what do i need', 'need to apply', 'proof', 'cnic', 'police registration', 'police verification', 'kaghzat'],
    reply: () => `Here’s what you’ll usually need:<ul>
      <li><strong>Renting:</strong> CNIC copies, a signed rent agreement, the tenant police registration form, and two months’ deposit plus one month’s rent in advance</li>
      <li><strong>Buying:</strong> CNIC (or NICOP for overseas Pakistanis), proof of funds or bank finance approval, and your filer status for FBR tax</li>
      <li><strong>From the seller:</strong> title documents or society allotment, NOC, no-dues certificate and CNIC</li></ul>`,
    chips: ['Show rentals', 'How does transfer work?', 'Home finance'],
  },
  {
    id: 'overseas',
    keywords: ['overseas', 'overseas pakistani', 'overseas pakistanis', 'abroad', 'nicop', 'roshan digital', 'rda', 'from uk', 'from dubai', 'from usa', 'from canada', 'expat', 'living abroad', 'power of attorney'],
    reply: () =>
      `Overseas Pakistanis can buy with confidence. We run live video tours, verify every document for you, and can complete the purchase through a Roshan Digital Account or a power of attorney with a trusted family member. Bilal on our team specialises in overseas buyers.`,
    chips: ['Talk to an agent', 'Show featured homes'],
  },
  {
    id: 'firsttime',
    keywords: ['first time', 'first-time', 'first home', 'first house', 'never bought', 'beginner', 'tips'],
    reply: () =>
      `Welcome to the club! 🎉 Fix your budget (including taxes and transfer costs), check the society is LDA/CDA/RDA approved, list must-haves vs. nice-to-haves, and visit favourites twice, once during load-shedding hours if you can. Our <a href="/article.html?id=first-time-buyer-guide-2026">first-time buyer’s guide</a> walks through it all, and Zainab on our team specialises in first homes.`,
    chips: ['Homes under 3 crore', 'Home finance', 'Talk to an agent'],
  },
  {
    id: 'plots',
    keywords: ['plot', 'plots', 'sell plots', 'have plots', 'buy a plot', 'buy plot', 'plots for sale', 'plot for sale', 'marla', 'kanal', 'sq yd', 'square yards', 'gaz', 'plot size', 'file', 'files', 'corner plot', 'construction', 'build my house', 'grey structure'],
    reply: () =>
      `Plot sizes in Pakistan are counted in marla and kanal (1 kanal = 20 marla), and in square yards in Karachi. Our listings are mostly ready homes, from 10 marla family houses to 1 and 2 kanal homes. As builders, we can also build on your own plot; ask an advisor about plots, files and construction.`,
    chips: ['Show featured homes', 'Talk to an agent'],
  },
  {
    id: 'areas',
    keywords: ['neighbourhood', 'neighborhood', 'area', 'areas', 'best area', 'where should i live', 'schools', 'family area', 'safe', 'quiet area', 'society', 'societies', 'which society'],
    reply: () => `A few quick pointers:<ul>
      <li><strong>Lahore:</strong> DHA and Gulberg for established luxury, Bahria Town for gated family living</li>
      <li><strong>Islamabad:</strong> F-7 and F-11 for central living near the Margalla Hills, DHA Phase 2 and Bahria Enclave for newer homes</li>
      <li><strong>Karachi:</strong> Clifton and DHA near the sea, Bahria Town Karachi for value</li>
      <li><strong>Hill homes:</strong> Murree, Nathia Gali, Swat, Hunza and Shogran</li></ul>
      Take the <a href="#" data-open-quiz>Sitara Match quiz</a> and I’ll rank homes for you.`,
    chips: ['Homes in DHA', 'Homes in Islamabad', 'Take the quiz'],
  },
  {
    id: 'invest',
    keywords: ['invest', 'investment', 'investor', 'roi', 'yield', 'return', 'rental income', 'portfolio', 'appreciation'],
    reply: () =>
      `For investors, Bilal leads our investment desk. Apartments in Clifton and F-11 have steady rental demand, established DHA and Bahria Town homes hold their value well, and hill homes in Galyat and Hunza can earn holiday-let income. Want me to show apartments?`,
    chips: ['Show apartments', 'Talk to an agent'],
  },
  {
    id: 'pets',
    keywords: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'pet friendly', 'animals'],
    reply: () =>
      `Pets are up to each landlord, so tell your advisor early and we’ll confirm it in writing in your rent agreement. Houses with a lawn, like the Pergola House in DHA Phase 8, are usually the easiest fit. 🐾`,
    chips: ['Show rentals', 'Book a tour'],
  },
  {
    id: 'virtual',
    keywords: ['virtual tour', '3d', 'video', 'video call', 'floor plan', 'floorplan', 'online tour', 'remote'],
    reply: () =>
      `Every property page has an interactive <strong>3D floor plan</strong>: drag to orbit, then tap a room for its size. We also run live WhatsApp video tours for buyers abroad.`,
    chips: ['Show featured homes', 'Book a tour'],
  },
  {
    id: 'saved',
    keywords: ['saved', 'favourites', 'favorites', 'favourite', 'favorite', 'wishlist', 'heart', 'shortlist'],
    reply: () =>
      `Tap the ♥ on any home to save it. Your saved homes appear under the heart icon at the top, or <a href="/properties.html?saved=1">view them here</a>. You can also tick “Compare” on up to 3 homes to see them side by side.`,
  },
  {
    id: 'quiz',
    keywords: ['match', 'quiz', 'recommend', 'suggest', 'what suits me', 'help me choose', 'which home', 'not sure'],
    reply: () =>
      `Let’s find your match! Our 60-second <a href="#" data-open-quiz>Sitara Match quiz</a> asks four questions and scores every home for you.`,
    chips: ['Take the quiz'],
  },
  {
    id: 'about',
    keywords: ['about', 'about sitara', 'company', 'who is sitara', 'sitara group', 'builders', 'builder', 'history', 'founded', 'story', 'founder', 'ceo', 'owner', 'chairman'],
    reply: () =>
      `Sitara Group of Builders was founded in Lahore in 2009 by Malik Akbar Awan, and today is led by our CEO, Malik Awais Awan. We build homes and also help families buy, sell and rent. Our founder’s promise, to build every home as if his own family would live in it, still guides every project: 14 projects delivered, 92% handed over on time, and over 650 families housed. Read <a href="/about.html">our story</a>.`,
  },
  {
    id: 'featured',
    keywords: ['featured', 'show featured homes', 'best homes', 'popular', 'show me homes', 'show homes', 'listings', 'properties', 'what do you have'],
    search: { featured: true },
  },
  {
    id: 'cheapest',
    keywords: ['cheapest', 'cheap', 'affordable', 'lowest price', 'budget home', 'least expensive', 'sasta'],
    search: { sort: 'price-asc' },
  },
  {
    id: 'luxury',
    keywords: ['most expensive', 'luxury', 'luxurious', 'mansion', 'biggest', 'premium', 'high end'],
    search: { sort: 'price-desc' },
  },
];

// City names as they appear in properties.js (`city`).
export const CITY_ALIASES = {
  lahore: 'Lahore',
  lhr: 'Lahore',
  islamabad: 'Islamabad',
  isb: 'Islamabad',
  isl: 'Islamabad',
  islo: 'Islamabad',
  karachi: 'Karachi',
  khi: 'Karachi',
  galyat: 'Galyat',
  galiyat: 'Galyat',
  swat: 'Swat',
  hunza: 'Hunza',
  'kaghan valley': 'Kaghan Valley',
  kaghan: 'Kaghan Valley',
  naran: 'Kaghan Valley',
};

// Sub-areas: matched against a listing's `area`/`address`, and imply a city when
// the area only exists in one. Longer aliases are tried first.
export const AREA_ALIASES = {
  dha: { area: 'DHA' },
  defence: { area: 'DHA' },
  defense: { area: 'DHA' },
  'bahria enclave': { area: 'Bahria Enclave', city: 'Islamabad' },
  'bahria town': { area: 'Bahria' },
  bahria: { area: 'Bahria' },
  'gulberg greens': { area: 'Gulberg Greens', city: 'Islamabad' },
  gulberg: { area: 'Gulberg' },
  'johar town': { area: 'Johar Town', city: 'Lahore' },
  clifton: { area: 'Clifton', city: 'Karachi' },
  'f-7': { area: 'F-7', city: 'Islamabad' },
  'f-11': { area: 'F-11', city: 'Islamabad' },
  murree: { area: 'Murree', city: 'Galyat' },
  'nathia gali': { area: 'Nathia Gali', city: 'Galyat' },
  nathiagali: { area: 'Nathia Gali', city: 'Galyat' },
  ayubia: { area: 'Ayubia', city: 'Galyat' },
  mingora: { area: 'Mingora', city: 'Swat' },
  fizagat: { area: 'Fizagat', city: 'Swat' },
  karimabad: { area: 'Karimabad', city: 'Hunza' },
  shogran: { area: 'Shogran', city: 'Kaghan Valley' },
};

export const TYPE_ALIASES = {
  'farm house': 'Farmhouse',
  farmhouse: 'Farmhouse',
  farmhouses: 'Farmhouse',
  villa: 'House',
  villas: 'House',
  bungalow: 'House',
  bungalows: 'House',
  kothi: 'House',
  mansion: 'House',
  townhouse: 'House',
  house: 'House',
  houses: 'House',
  ghar: null,
  home: null,
  apartment: 'Apartment',
  apartments: 'Apartment',
  apt: 'Apartment',
  flat: 'Apartment',
  flats: 'Apartment',
  penthouse: 'Apartment',
  condo: 'Apartment',
  cottage: 'Cottage',
  cottages: 'Cottage',
  lodge: 'Cottage',
  chalet: 'Cottage',
};

// word in the message -> text searched in a listing's tags and features
export const FEATURE_WORDS = {
  solar: 'Solar',
  basement: 'Basement',
  lawn: 'Lawn',
  garden: 'Garden',
  corner: 'Corner plot',
  'park facing': 'Park facing',
  lift: 'Lift',
  generator: 'Generator',
  'servant quarter': 'Servant quarter',
  furnished: 'Furnished',
  sea: 'Near sea',
  'margalla view': 'Margalla view',
  'mountain view': 'Mountain view',
  'valley view': 'Valley view',
};
