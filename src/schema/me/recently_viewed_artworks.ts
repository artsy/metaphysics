import { GraphQLBoolean, GraphQLNonNull, GraphQLString } from "graphql"
import {
  connectionFromArraySlice,
  mutationWithClientMutationId,
} from "graphql-relay"
import { getPagingParameters, pageable } from "relay-cursor-paging"

import { artworkConnection } from "schema/artwork"

export const RecentlyViewedArtworks = {
  type: artworkConnection,
  args: pageable(),
  description: "A list of the current user’s recently viewed artworks.",
  resolve: (
    { recently_viewed_artwork_ids: ids },
    options,
    _request,
    { rootValue: { artworksLoader } }
  ) => {
    const { offset } = getPagingParameters(options)
    return artworksLoader(ids).then(body => {
      return connectionFromArraySlice(body, options, {
        arrayLength: body.length,
        sliceStart: offset,
      })
    })
  },
}

export const recordArtworkViewMutation = mutationWithClientMutationId({
  name: "RecordArtworkView",
  description: "Records an artwork view.",
  inputFields: {
    artwork_id: {
      type: new GraphQLNonNull(GraphQLString),
    },
  },
  outputFields: {
    success: {
      type: GraphQLBoolean,
      resolve: () => true,
    },
  },
  mutateAndGetPayload: (
    { artwork_id },
    _request,
    { rootValue: { recordArtworkViewLoader } }
  ) => {
    if (!recordArtworkViewLoader) {
      throw new Error(
        "Missing recordArtworkViewLoader. Check that `X-Access-Token` and `X-User-Id` headers are set."
      )
    }
    return recordArtworkViewLoader(artwork_id)
  },
})
