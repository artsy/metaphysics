import { toGlobalId } from "graphql-relay"
import { ResolverContext } from "types/graphql"
import { resolveArtistSeriesConnection } from "./shared/artistSeriesConnection"

// See resolver-specs/Artist.md
export default {
  Artist: {
    id: ({ _id }) => toGlobalId("Artist", _id),
    internalID: ({ _id }) => _id,
    slug: ({ id }) => id,
    alternateNames: ({ alternate_names }) => alternate_names,
    disablePriceContext: ({ disable_price_context }) => disable_price_context,
    displayLabel: ({ name }) => name,
    displayName: ({ display_name }) => display_name,
    artistSeriesConnection: ({ _id }, args, context: ResolverContext) =>
      resolveArtistSeriesConnection(args, { artist_id: _id }, context),
  },
}
