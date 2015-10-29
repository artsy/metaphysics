import path from 'path';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import schema from './schema';

import { artsyLoader } from './lib/artsy_loader';

let app = express();
let port = process.env.PORT || 3000;

app.get('/favicon.ico', (req, res) => {
  res
    .status(200)
    .set({ 'Content-Type': 'image/x-icon' })
    .end();
});

app.all('/graphql', (req, res) => res.redirect('/'));

app.use('/', graphqlHTTP((req) => {
  console.log('-----------');

  artsyLoader.clearAll();

  return {
    schema: schema,
    graphiql: true
  }
}));

app.listen(port, () => console.log(`Listening on ${port}`));
