import {
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDFields } from "../object_identification"

export const Collection: GraphQLFieldConfig<any, ResolverContext> = {
  description: "A collection belonging to the current user",
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "Collection",
    description: "A collection of artworks",
    fields: () => ({
      ...InternalIDFields,
      artworksCount: {
        type: new GraphQLNonNull(GraphQLInt),
        description: "Number of artworks associated with this collection.",
        resolve: ({ artworks_count }) => artworks_count,
      },
      default: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description:
          "True if this is the default collection for this user, i.e. the default Saved Artwork collection.",
      },
      name: {
        type: new GraphQLNonNull(GraphQLString),
        description:
          "Name of the collection. Has a predictable value for 'standard' collections such as Saved Artwork, My Collection, etc. Can be provided by user otherwise.",
      },
      saves: {
        type: new GraphQLNonNull(GraphQLBoolean),
        description:
          "True if this collection represents artworks explicitly saved by the user, false otherwise.",
      },
    }),
  }),
  args: {
    id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  resolve: async (parent, args, context, _info) => {
    const { id: meID } = parent
    const { id } = args
    const { collectionLoader } = context

    if (!collectionLoader) return null

    const response = await collectionLoader(id, {
      user_id: meID,
      private: true,
    })

    return response
  },
}
