import path from 'path';
import express from 'express';
import graphqlHTTP from 'express-graphql';
import schema from './schema';

let app = express();
let port = process.env.PORT || 3000;

app.all('/graphql', (req, res) => res.redirect('/'));
app.use('/', graphqlHTTP(() => ({
  schema: schema,
  graphiql: true
})));

app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
