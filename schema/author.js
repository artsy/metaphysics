import {
  GraphQLString,
  GraphQLObjectType
} from 'graphql';

let AuthorType = new GraphQLObjectType({
  name: 'Author',
  fields: {
    id: {
      type: GraphQLString
    },
    name: {
      type: GraphQLString
    },
    profile_handle: {
      type: GraphQLString
    },
    href: {
      type: GraphQLString,
      resolve: ({ profile_handle }) => `/${profile_handle}`
    }
  }
});

export default AuthorType;