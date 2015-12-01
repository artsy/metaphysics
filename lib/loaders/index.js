import { gravityLoader } from './gravity';
import { positronLoader } from './positron';
import { googleCSELoader } from './google_cse';

export default {
  loaders: {
    gravity: gravityLoader,
    positron: positronLoader,
    googleCSELoader: googleCSELoader
  },

  clearAll: () => {
    gravityLoader.clearAll();
    positronLoader.clearAll();
    googleCSELoader.clearAll();
  }
};
