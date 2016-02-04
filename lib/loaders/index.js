import { gravityLoader } from './gravity';
import { positronLoader } from './positron';
import { googleCSELoader } from './google_cse';

export default {
  loaders: {
    gravity: gravityLoader,
    positron: positronLoader,
    google: googleCSELoader,
  },

  clearAll: () => {
    gravityLoader.clearAll();
    positronLoader.clearAll();
    googleCSELoader.clearAll();
  },
};
