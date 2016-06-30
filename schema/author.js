import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  fields: {
    id: {
      type: GraphQLString,
    },
    name: {
      type: GraphQLString,
    },
    profile_handle: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ profile_handle }) => `/${profile_handle}`,
      deprecationReason: "Profiles and thus artist hrefs don't exist anymore",
    },
  },
});

export default AuthorType;
