import { GraphQLFieldConfig, GraphQLInt } from "graphql"
import { connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { CursorPageable, pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import { flatten, uniq, uniqBy } from "lodash"
import { artworkConnection } from "schema/v2/artwork"
import moment from "moment"

const ARTWORKS_PER_ARTIST = 3
const MAX_AGE_IN_MONTHS = 6
const MAX_ARTISTS = 20

const InterestingWorksConnection: GraphQLFieldConfig<void, ResolverContext> = {
  description: "A connection of interestingworks",
  type: artworkConnection.connectionType,
  args: pageable({
    page: { type: GraphQLInt },
  }),
  resolve: async (
    _root,
    args: CursorPageable,
    { vortexUserLoader, meLoader, artistArtworksLoader }
  ) => {
    if (!meLoader || !vortexUserLoader) return

    const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

    const me = await meLoader?.()

    const vortexResult = await vortexUserLoader(me.id)

    const artistIds = uniq(vortexResult.artist_ids)
      .filter((a) => a !== "4dd1584de0091e000100207c") // Filter Banksy
      .slice(0, MAX_ARTISTS)

    const artists = await Promise.all(
      artistIds.map(async (artistId) => {
        try {
          const artistArtworks = await artistArtworksLoader(
            artistId as string,
            {
              size: 5,
              sort: "-created_at",
              filter: ["for_sale"],
              published: true,
            }
          )

          return artistArtworks
        } catch (e) {
          console.log(e)
          return []
        }
      })
    )

    const artworks = uniqBy(
      flatten(
        artists.map((a) =>
          a.slice(0, ARTWORKS_PER_ARTIST).map((a, index) => ({ ...a, index }))
        )
      ),
      "id"
    )
      .filter((artwork) => {
        return moment(artwork.published_at).isAfter(
          moment().subtract(MAX_AGE_IN_MONTHS, "month"),
          "month"
        )
      })
      .sort((a, b) =>
        a?.index > b?.index || moment(b?.published_at).isAfter(a?.published_at)
          ? 1
          : -1
      )

    const count = artworks.length

    return {
      totalCount: count,
      pageCursors: createPageCursors({ ...args, page, size }, count),
      ...connectionFromArraySlice(artworks, args, {
        arrayLength: count,
        sliceStart: offset,
      }),
    }
  },
}

export default InterestingWorksConnection
