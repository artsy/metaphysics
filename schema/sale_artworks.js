import SaleArtwork from "./sale_artwork"
import { parseRelayOptions } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { filterSaleArtworksArgs } from "schema/filter_sale_artworks"
import { SaleArtworkAggregations, SaleArtworkCounts } from "schema/filter_sale_artworks"

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
  args: pageable(filterSaleArtworksArgs),
  description: "Sale Artworks Elastic Search results",
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
}
