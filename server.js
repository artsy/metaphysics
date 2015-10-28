import path from 'path';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import schema from './schema';

import { artsyLoader } from './lib/artsy_loader';

let app = express();
let port = process.env.PORT || 3000;

let clearArtsyLoader = (req, res, next) => {
  artsyLoader.clearAll();
  next();
};

app.all('/graphql', (req, res) => res.redirect('/'));
app.use('/', clearArtsyLoader, graphqlHTTP({
  schema: schema,
  graphiql: true
}));

app.listen(port, () => console.log(`Listening on ${port}`));
