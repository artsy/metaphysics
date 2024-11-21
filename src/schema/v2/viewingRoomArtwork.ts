import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
} from "graphql"
import { ResolverContext } from "types/graphql"

export const ViewingRoomArtworkType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomArtwork",
  fields: () => {
    return {
      internalID: {
        description: "A type-specific ID likely used as a database ID.",
        type: new GraphQLNonNull(GraphQLID),
        resolve: ({ id }) => id,
      },
      artworkID: {
        type: new GraphQLNonNull(GraphQLID),
        resolve: ({ artwork_id }) => artwork_id,
      },
      published: {
        type: new GraphQLNonNull(GraphQLBoolean),
      },
    }
  },
})
