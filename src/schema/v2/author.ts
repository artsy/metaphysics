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
    profile_handle: {
      type: GraphQLString,
    },
  },
})

export default AuthorType
