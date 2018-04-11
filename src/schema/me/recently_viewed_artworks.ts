import { getPagingParameters, pageable } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"
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
