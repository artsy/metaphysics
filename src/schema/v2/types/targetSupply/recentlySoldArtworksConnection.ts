import { ResolverContext } from "types/graphql"
import { GraphQLBoolean, GraphQLFieldConfig } from "graphql"
import { pageable } from "relay-cursor-paging"
import { connectionFromArray } from "graphql-relay"
import { artworkConnection } from "schema/v2/artwork"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { createPageCursors } from "schema/v2/fields/pagination"
import { shuffle } from "lodash"

export interface RecentlySoldArtworksConnectionSource {
  metadata: { recentlySoldArtworkIDs: string[] }
}

// This is a function so that execution is deferred; otherwise
//   `artworkConnection.connectionType` errs because `artworkConnection` is undefined.
export const getRecentlySoldArtworksConnection: () => GraphQLFieldConfig<
  RecentlySoldArtworksConnectionSource,
  ResolverContext
> = () => {
  return {
    description: "A list of recently sold artworks.",
    type: artworkConnection.connectionType,
    args: pageable({
      randomize: {
        type: GraphQLBoolean,
        description: "Randomize the order of artworks for display purposes.",
      },
    }),
    resolve: async (artist, options, { artworksLoader }) => {
      const { page, size } = convertConnectionArgsToGravityArgs(options)
      let response = await artworksLoader({
        ids: artist.metadata.recentlySoldArtworkIDs,
      })
      const totalCount = response.length
      if (options.randomize) {
        response = shuffle(response)
      }
      return {
        totalCount,
        pageCursors: createPageCursors({ page, size }, totalCount),
        ...connectionFromArray(response, options),
      }
    },
  }
}
