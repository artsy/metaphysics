import { GraphQLObjectType } from "graphql"
import { pageable } from "relay-cursor-paging"
import { ResolverContext } from "types/graphql"
import { connectionWithCursorInfo } from "./fields/pagination"
import { InternalIDFields } from "./object_identification"
import SaleArtwork from "./sale_artwork"

const AuctionLotType = new GraphQLObjectType<any, ResolverContext>({
  name: "AuctionLot",
  fields: () => ({
    saleArtwork: {
      type: SaleArtwork,
      resolve: ({ saleArtwork }) => saleArtwork as any,
    },
    lot: () => ({ lot }) => lot,
    // internalID: ({saleArtwork}) => saleArtwork.id
    // ...InternalIDFields,
  }),
})

export const auctionLotConnection = connectionWithCursorInfo({
  nodeType: AuctionLotType,
})

export const watchedLotsConnection = {
  description: "A list of lots a user is watching",
  type: auctionLotConnection.connectionType,
  args: pageable(),
  resolve: async () => {
    // rough approach:

    // get Sale Artworks
    // query gravity api/v2/sale_artworks?included_watched_artworks=true

    // get lot state for each sale artwork from causality (ex query:
    // query {
    //   lots( ids: saleArtworks.map(sa => sa.id) ) {
    //    # We probably have to select all graphql fields here?
    //   }
    // }

    // zip them together and return with full necessary relay fields
    return {
      totalCount: 1,
      pageCursors: {},
      edges: [{ node: { saleArtwork: {}, lot: {} } }],
    }
  },
}
