import { GraphQLFieldConfig, GraphQLNonNull, GraphQLString } from "graphql"
import { ResolverContext } from "types/graphql"
import { CollectionType } from "./me/collection"

export const Collection: GraphQLFieldConfig<any, ResolverContext> = {
  type: CollectionType,
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
      description: "The ID or slug of the Collection",
    },
    userID: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (_parent, args, { collectionLoader }, _info) => {
    const { id, userID } = args

    if (!collectionLoader) return null

    const response = await collectionLoader(id, {
      user_id: userID,
    })

    return {
      ...response,
      userID, // Inject the userID into the response
    }
  },
}
