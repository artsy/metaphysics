import { IDFields } from "./object_identification"
import { GraphQLString, GraphQLObjectType } from "graphql"
import { ResolverContext } from "types/graphql"

const AuthorType = new GraphQLObjectType<any, ResolverContext>({
  name: "Author",
  fields: {
    ...IDFields,
    name: {
      type: GraphQLString,
    },
    profileHandle: {
      type: GraphQLString,
      resolve: ({ profile_handle }) => profile_handle,
    },
  },
})

export default AuthorType
