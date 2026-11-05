import { ResolverContext } from "types/graphql"
import { resolveArtistSeriesConnection } from "./shared/artistSeriesConnection"

// See resolver-specs/_Query.md
export default {
  Query: {
    artist: (
      _root: unknown,
      { id }: { id: string },
      { artistLoader }: ResolverContext
    ) => {
      if (id.length === 0) return null
      return artistLoader(id)
    },
    artistSeriesConnection: (_root: unknown, args, context: ResolverContext) =>
      resolveArtistSeriesConnection(
        args,
        {
          artist_id: args.artistID,
          artwork_id: args.artworkID,
          exclude_ids: args.excludeIDs,
        },
        context
      ),
  },
}
