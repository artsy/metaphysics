require('babel/register');
require('./server.js');

var xapp = require('artsy-xapp');
xapp.on('error', process.exit);
xapp.init({
  url: process.env.ARTSY_API_URL
}, function() {
  require('./config').ARTSY_XAPP_TOKEN = xapp.token;
});
