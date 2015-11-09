const { RESIZING_SERVICE } = process.env;

module.exports = function() {
  if (RESIZING_SERVICE === 'gemini') {
    return require('./gemini').apply(null, arguments);
  } else {
    return require('./embedly').apply(null, arguments);
  }
};
