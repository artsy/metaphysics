import { connectionFromArray, connectionFromArraySlice } from "graphql-relay"
import { getPagingParameters, pageable } from "relay-cursor-paging"

import { artworkConnection } from "schema/v1/artwork"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

export const RecentlyViewedArtworks: GraphQLFieldConfig<
  { recently_viewed_artwork_ids: string[] },
  ResolverContext
> = {
  type: artworkConnection,
  args: pageable({}),
  description: "A list of the current user’s recently viewed artworks.",
  resolve: (
    { recently_viewed_artwork_ids: ids },
    options,
    { artworksLoader }
  ) => {
    if (ids.length === 0) {
      return connectionFromArray(ids, options)
    }
    const { offset } = getPagingParameters(options)
    return artworksLoader({ ids }).then((body) => {
      return connectionFromArraySlice(body, options, {
        arrayLength: body.length,
        sliceStart: offset,
      })
    })
  },
}
