import { IDFields } from "./object_identification"
import { GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"
import { deprecate } from "lib/deprecation"

const AuthorType = new GraphQLObjectType<any, ResolverContext>({
  name: "Author",
  fields: {
    ...IDFields,
    name: {
      type: GraphQLString,
    },
    href: {
      type: GraphQLString,
      resolve: ({ profile_handle }) => `/${profile_handle}`,
      deprecationReason: deprecate({
        inVersion: 2,
        reason:
          "Profiles have been removed and thus author hrefs don't exist anymore.",
      }),
    },
    profile_handle: {
      type: GraphQLString,
    },
  },
})

export default AuthorType
