import {
  GraphQLBoolean,
  GraphQLID,
  GraphQLNonNull,
  GraphQLObjectType,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { InternalIDField } from "./object_identification"

export const ViewingRoomArtworkType = new GraphQLObjectType<
  any,
  ResolverContext
>({
  name: "ViewingRoomArtwork",
  fields: () => {
    return {
      ...InternalIDField,
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
