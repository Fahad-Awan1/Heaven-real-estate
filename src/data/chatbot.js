// Halo's hardcoded knowledge base. Each intent is matched by keyword/phrase
// scoring (with typo tolerance) in src/js/components/chatbot.js.
export const START_CHIPS = ['🏡 Buy a home', '🔑 Rent a home', '💰 Sell my home', '📅 Book a tour', '🧮 Mortgage help', '📞 Contact'];

export const intents = [
  {
    id: 'greet',
    keywords: ['hi', 'hello', 'hey', 'hiya', 'hola', 'yo', 'good morning', 'good afternoon', 'good evening', 'greetings', 'salam', 'assalam'],
    reply: () =>
      `Hello! 👋 I’m Halo, Heaven’s assistant. I can search homes, explain buying or renting, estimate a mortgage, or book a tour. What are you looking for today?`,
    chips: START_CHIPS,
  },
  {
    id: 'thanks',
    keywords: ['thanks', 'thank', 'thx', 'cheers', 'appreciate', 'awesome', 'perfect'],
    reply: () => `You’re very welcome! Anything else I can help you find? 😊`,
    chips: ['Show featured homes', 'Book a tour', 'No, that’s all'],
  },
  {
    id: 'bye',
    keywords: ['bye', 'goodbye', 'see you', 'later', 'that’s all', 'thats all', 'no thats all', 'nothing else'],
    reply: () => `Lovely chatting with you. I’m here whenever you need me. Happy home hunting! 🌅`,
  },
  {
    id: 'help',
    keywords: ['help', 'what can you do', 'options', 'menu', 'start', 'commands', 'how does this work'],
    reply: () => `Here’s what I can do:<ul>
      <li>Search homes: try <em>“3 bed villa in Malibu under 5M”</em></li>
      <li>Explain how buying, renting or selling works</li>
      <li>Estimate mortgage payments: <em>“mortgage on 1.2M”</em></li>
      <li>Book a private tour or connect you with an agent</li></ul>`,
    chips: START_CHIPS,
  },
  {
    id: 'identity',
    keywords: ['who are you', 'are you human', 'are you a bot', 'robot', 'ai', 'your name', 'real person'],
    reply: () =>
      `I’m Halo, Heaven’s virtual assistant. I’m not a human, but I know our listings inside out. If you’d like a real person, our advisors are a call away at <a href="tel:+13105550142">+1 (310) 555 0142</a>.`,
    chips: ['Talk to an agent', 'Search homes'],
  },
  {
    id: 'buy',
    keywords: ['buy', 'buying', 'purchase', 'how to buy', 'buy a home', 'buy a house', 'own', 'buying process'],
    reply: () => `Buying with Heaven takes five calm steps:<ul>
      <li><strong>1. Brief:</strong> we learn your budget, must-haves and timeline</li>
      <li><strong>2. Pre-approval:</strong> we introduce trusted lenders</li>
      <li><strong>3. Viewings:</strong> curated tours, including off-market homes</li>
      <li><strong>4. Offer &amp; negotiation:</strong> we fight your corner</li>
      <li><strong>5. Escrow &amp; keys:</strong> usually 30–45 days</li></ul>
      Browse <a href="/buy.html">homes for sale</a> or tell me what you’re after.`,
    chips: ['Homes for sale', 'Mortgage help', 'First-time buyer tips'],
  },
  {
    id: 'rent',
    keywords: ['rent', 'renting', 'rental', 'lease', 'tenant', 'rent process', 'apply to rent'],
    reply: () => `Renting is simple with us:<ul>
      <li>Browse verified <a href="/rent.html">rentals</a> (all viewed by our team)</li>
      <li>Book a viewing, often the same week</li>
      <li>Apply online with ID, proof of income (usually 3× the rent) and references</li>
      <li>Sign digitally and move in. Most leases are 12 months.</li></ul>`,
    chips: ['Show rentals', 'What documents do I need?', 'Are pets allowed?'],
  },
  {
    id: 'sell',
    keywords: ['sell', 'selling', 'list my home', 'list my house', 'valuation', 'value my home', 'worth', 'appraisal', 'how much is my house'],
    reply: () =>
      `Thinking of selling? Our <a href="/sell.html">instant valuation tool</a> gives you an estimate in under a minute. A local expert then confirms it in person, free. Our listings sell in an average of <strong>18 days</strong> at <strong>101.6%</strong> of asking.`,
    chips: ['Get a valuation', 'What are your fees?', 'Talk to an agent'],
  },
  {
    id: 'mortgage',
    keywords: ['mortgage', 'loan', 'finance', 'financing', 'interest rate', 'rates', 'down payment', 'deposit', 'pre-approval', 'preapproval', 'monthly payment', 'afford'],
    reply: () =>
      `I can estimate it! Tell me a price, e.g. <em>“mortgage on $1.5M”</em>. I assume 20% down, 6.5% fixed over 30 years. For a precise figure, use the calculator on any property page, or we can introduce you to a trusted lender for pre-approval.`,
    chips: ['Mortgage on $1M', 'Mortgage on $2.5M', 'Talk to an agent'],
  },
  {
    id: 'tour',
    keywords: ['tour', 'viewing', 'visit', 'see the house', 'see the property', 'appointment', 'schedule', 'book', 'showing', 'view a home'],
    flow: 'tour',
  },
  {
    id: 'contact',
    keywords: ['contact', 'phone', 'email', 'call', 'number', 'address', 'office', 'where are you', 'located', 'location of office', 'reach you'],
    reply: () => `You can reach us any of these ways:<ul>
      <li>📞 <a href="tel:+13105550142">+1 (310) 555 0142</a></li>
      <li>✉️ <a href="mailto:hello@heaven.estate">hello@heaven.estate</a></li>
      <li>📍 9400 Wilshire Blvd, Beverly Hills, CA 90212</li></ul>
      Or send a message through our <a href="/contact.html">contact page</a>.`,
    chips: ['Opening hours', 'Book a tour'],
  },
  {
    id: 'hours',
    keywords: ['hours', 'open', 'opening', 'closing', 'time', 'sunday', 'saturday', 'weekend', 'when are you open'],
    reply: () =>
      `Our Beverly Hills office is open <strong>Mon–Sat, 9am – 7pm</strong>. Sunday viewings are available by appointment, and I’m here 24/7. 🌙`,
    chips: ['Book a tour', 'Contact'],
  },
  {
    id: 'agents',
    keywords: ['agent', 'agents', 'team', 'realtor', 'broker', 'advisor', 'human', 'speak to someone', 'talk to someone', 'talk to an agent', 'person'],
    reply: () =>
      `Our six specialists cover luxury, family homes, rentals and investment. Meet them on the <a href="/agents.html">agents page</a>, or call <a href="tel:+13105550142">+1 (310) 555 0142</a> and we’ll connect you with the right person in minutes.`,
    chips: ['Book a tour', 'Contact'],
  },
  {
    id: 'fees',
    keywords: ['fee', 'fees', 'commission', 'cost', 'charge', 'charges', 'how much do you charge', 'price of service'],
    reply: () =>
      `Buyers usually pay nothing to work with us; our fee comes from the sale. For sellers, our fee is agreed up front (typically 2–2.5%) and covers photography, film, staging advice and marketing. Rentals carry a one-off fee equal to one month’s rent, paid by the landlord.`,
    chips: ['Sell my home', 'Talk to an agent'],
  },
  {
    id: 'documents',
    keywords: ['documents', 'document', 'paperwork', 'requirements', 'what do i need', 'need to apply', 'proof', 'credit score', 'credit check'],
    reply: () => `Here’s what you’ll usually need:<ul>
      <li><strong>Renting:</strong> photo ID, last 3 payslips or bank statements (income ≈ 3× rent), references, credit check</li>
      <li><strong>Buying:</strong> photo ID, mortgage pre-approval or proof of funds, 2 years of tax returns</li></ul>`,
    chips: ['Show rentals', 'Mortgage help'],
  },
  {
    id: 'firsttime',
    keywords: ['first time', 'first-time', 'first home', 'first house', 'never bought', 'beginner', 'tips'],
    reply: () =>
      `Welcome to the club! 🎉 Start with pre-approval, list must-haves vs. nice-to-haves, and visit favourites twice (day and evening). Our <a href="/article.html?id=first-time-buyer-guide-2026">first-time buyer’s guide</a> walks through it all, and Maya on our team specialises in first homes.`,
    chips: ['Homes under $1M', 'Mortgage help', 'Talk to an agent'],
  },
  {
    id: 'areas',
    keywords: ['neighbourhood', 'neighborhood', 'area', 'areas', 'best area', 'where should i live', 'schools', 'family area', 'safe', 'quiet area'],
    reply: () => `A few quick pointers:<ul>
      <li><strong>Families:</strong> Pasadena, Encino, Pacific Palisades (top schools)</li>
      <li><strong>City life:</strong> Downtown LA, Silver Lake, Santa Monica</li>
      <li><strong>Privacy &amp; views:</strong> Malibu, Bel Air, Beverly Hills</li></ul>
      Take the <a href="#" data-open-quiz>Heaven Match quiz</a> and I’ll rank homes for you.`,
    chips: ['Homes in Pasadena', 'Homes in Malibu', 'Take the quiz'],
  },
  {
    id: 'invest',
    keywords: ['invest', 'investment', 'investor', 'roi', 'yield', 'return', 'rental income', 'portfolio', 'appreciation'],
    reply: () =>
      `For investors, Daniel leads our investment desk. Lofts in Downtown LA and Silver Lake show the strongest rental demand (yields around 4–5%), while coastal homes have the best long-term appreciation. Want me to show city apartments?`,
    chips: ['Show apartments', 'Talk to an agent'],
  },
  {
    id: 'pets',
    keywords: ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'pet friendly', 'animals'],
    reply: () =>
      `Good news for furry friends 🐾 Several of our rentals are pet friendly, including the Skyline Loft, Garden Apartment and Cedar Cube. Most landlords ask for a small pet deposit.`,
    chips: ['Show rentals', 'Book a tour'],
  },
  {
    id: 'virtual',
    keywords: ['virtual tour', '3d', 'video', 'floor plan', 'floorplan', 'online tour', 'remote'],
    reply: () =>
      `Every property page has an interactive <strong>3D floor plan</strong>: drag to orbit, then tap a room for its size. We also run live video tours for buyers relocating from abroad.`,
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
      `Let’s find your match! Our 60-second <a href="#" data-open-quiz>Heaven Match quiz</a> asks four questions and scores every home for you.`,
    chips: ['Take the quiz'],
  },
  {
    id: 'about',
    keywords: ['about', 'about heaven', 'company', 'who is heaven', 'history', 'founded', 'story'],
    reply: () =>
      `Heaven is a boutique agency founded in 2009 by Sofia Laurent in Beverly Hills. We’ve helped over 4,000 families move, with $2.4B in homes sold. Read <a href="/about.html">our story</a>.`,
  },
  {
    id: 'featured',
    keywords: ['featured', 'show featured homes', 'best homes', 'popular', 'show me homes', 'show homes', 'listings', 'properties', 'what do you have'],
    search: { featured: true },
  },
  {
    id: 'cheapest',
    keywords: ['cheapest', 'cheap', 'affordable', 'lowest price', 'budget home', 'least expensive'],
    search: { sort: 'price-asc' },
  },
  {
    id: 'luxury',
    keywords: ['most expensive', 'luxury', 'luxurious', 'mansion', 'biggest', 'premium', 'high end'],
    search: { sort: 'price-desc' },
  },
];

// Phrases that should be interpreted as a property search.
export const CITY_ALIASES = {
  'beverly hills': 'Beverly Hills',
  beverly: 'Beverly Hills',
  malibu: 'Malibu',
  pasadena: 'Pasadena',
  'bel air': 'Bel Air',
  belair: 'Bel Air',
  'hollywood hills': 'Hollywood Hills',
  hollywood: 'Hollywood Hills',
  'laguna beach': 'Laguna Beach',
  laguna: 'Laguna Beach',
  'downtown la': 'Downtown LA',
  downtown: 'Downtown LA',
  dtla: 'Downtown LA',
  'santa monica': 'Santa Monica',
  'pacific palisades': 'Pacific Palisades',
  palisades: 'Pacific Palisades',
  encino: 'Encino',
  'silver lake': 'Silver Lake',
  silverlake: 'Silver Lake',
};

export const TYPE_ALIASES = {
  villa: 'Villa',
  villas: 'Villa',
  mansion: 'Villa',
  house: 'House',
  houses: 'House',
  home: null,
  apartment: 'Apartment',
  apartments: 'Apartment',
  apt: 'Apartment',
  flat: 'Apartment',
  loft: 'Apartment',
  condo: 'Apartment',
  penthouse: 'Apartment',
  estate: 'Estate',
};

export const FEATURE_WORDS = {
  pool: 'Pool',
  ocean: 'Ocean view',
  sea: 'Ocean view',
  beach: 'Near beach',
  garden: 'Garden',
  pet: 'Pet friendly',
  pets: 'Pet friendly',
  furnished: 'Furnished',
};
