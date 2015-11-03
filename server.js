import xapp from 'artsy-xapp';
import debug from 'debug';
import morgan from 'morgan';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import schema from './schema';
import loaders from './lib/loaders';

const {
  PORT,
  GRAVITY_API_URL,
  GRAVITY_ID,
  GRAVITY_SECRET
} = process.env

let app = express();
let port = PORT || 3000;

xapp.on('error', debug('error'));
xapp.init({
  url: GRAVITY_API_URL,
  id: GRAVITY_ID,
  secret: GRAVITY_SECRET
}, () => require('./config').GRAVITY_XAPP_TOKEN = xapp.token);

app.get('/favicon.ico', (req, res) => {
  res
    .status(200)
    .set({ 'Content-Type': 'image/x-icon' })
    .end();
});

app.all('/graphql', (req, res) => res.redirect('/'));

app.use('/', morgan('combined'), graphqlHTTP((req) => {
  loaders.clearAll();

  return {
    schema: schema,
    graphiql: true
  }
}));

app.listen(port, () => debug('info')(`Listening on ${port}`));
