import { gravityLoader } from './gravity';
import { positronLoader } from './positron';

export default {
  loaders: {
    gravity: gravityLoader,
    positron: positronLoader
  },

  clearAll: () => {
    gravityLoader.clearAll();
    positronLoader.clearAll();
  }
};
