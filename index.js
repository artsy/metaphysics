global.Promise = require('bluebird');

require('babel-core/register');
require('source-map-support/register');

require('./server.js');
