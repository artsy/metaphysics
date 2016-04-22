import { gravityLoader } from './gravity';
import { positronLoader } from './positron';
import { googleCSELoader } from './google_cse';
import { totalLoader } from './total';

export default {
  loaders: {
    gravity: gravityLoader,
    positron: positronLoader,
    google: googleCSELoader,
    total: totalLoader,
  },

  clearAll: () => {
    gravityLoader.clearAll();
    positronLoader.clearAll();
    googleCSELoader.clearAll();
    totalLoader.clearAll();
  },
};
