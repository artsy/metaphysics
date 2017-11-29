import SaleArtwork from "./sale_artwork"
import { GraphQLObjectType } from "graphql"
import { SaleArtworkAggregations, SaleArtworkCounts } from "schema/filter_sale_artworks"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { filterSaleArtworksArgs } from "schema/filter_sale_artworks"
import { pageable } from "relay-cursor-paging"
import { parseRelayOptions } from "lib/helpers"

const DEFAULTS = {
  aggregations: ["total"],
  page: 1,
  size: 10,
  offset: 0,
}

const SaleArtworksType = connectionDefinitions({
  name: "SaleArtworks",
  nodeType: SaleArtwork.type,
  connectionFields: {
    aggregations: SaleArtworkAggregations,
    counts: SaleArtworkCounts,
  },
}).connectionType

export default {
  description: "Sale Artworks Elastic Search results",
  args: pageable(filterSaleArtworksArgs),
  type: new GraphQLObjectType({
    name: "SaleArtworks",
    fields: {
      connection: {
        args: pageable(filterSaleArtworksArgs),
        type: SaleArtworksType,
        resolve: async (_root, options, _request, { rootValue: { saleArtworksFilterLoader } }) => {
          const params = parseRelayOptions({ ...DEFAULTS, ...options })
          const response = await saleArtworksFilterLoader(params)
          const data = {
            ...response,
            ...connectionFromArraySlice(response.hits, options, {
              arrayLength: response.aggregations.total.value,
              sliceStart: params.offset,
            }),
          }

          return data
        },
      },
    },
  }),
  resolve: x => x,
}
