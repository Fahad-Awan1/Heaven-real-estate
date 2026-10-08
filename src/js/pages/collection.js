import '../main.js';
import { initListing } from '../components/listing.js';

initListing({ lockedStatus: document.body.dataset.status });
