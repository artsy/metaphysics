const { RESIZING_SERVICE } = process.env;
import gemini from './gemini';
import embedly from './embedly';

module.exports = function() {
  if (RESIZING_SERVICE === 'gemini') {
    return gemini.apply(null, arguments);
  } else {
    return embedly.apply(null, arguments);
  }
};
