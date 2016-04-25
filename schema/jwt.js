import Me from './me';
import jwt from 'jwt-simple';
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLSchema,
  graphql,
} from 'graphql';

const { HMAC_SECRET } = process.env;

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'RootQueryType',
    fields: { me: Me },
  }),
});

export default {
  type: GraphQLString,
  description: 'Encodes a GraphQL `me` query into a JSON Web Token',
  args: {
    query: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'A GraphQL `me` query e.g. `{ id email }`',
    },
  },
  resolve: (root, options, { rootValue: { accessToken } }) => {
    return graphql(schema, `{ me ${options.query} }`, { accessToken })
      .then((res) => {
        if (res.errors) throw res.errors[0];
        return jwt.encode(res.data.me, HMAC_SECRET);
      });
  },
};
