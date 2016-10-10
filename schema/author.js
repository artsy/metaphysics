/* @flow */

import {
  GraphQLString,
  GraphQLObjectType,
} from 'graphql';

import { IDFields } from './object_identification';

const AuthorType = new GraphQLObjectType({
  name: 'Author',
  fields: {
    ...IDFields,
    name: {
      type: GraphQLString,
    },
    profile_handle: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ profile_handle }) => `/${profile_handle}`,
      deprecationReason: "Profiles have been removed and thus author hrefs don't exist anymore.",
    },
  },
});

export default AuthorType;
