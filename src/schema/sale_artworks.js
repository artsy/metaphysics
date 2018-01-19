import SaleArtwork from "./sale_artwork"
import { parseRelayOptions } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { filterSaleArtworksArgs } from "schema/filter_sale_artworks"
import {
  SaleArtworkAggregations,
  SaleArtworkCounts,
} from "schema/filter_sale_artworks"

const DEFAULTS = {
  aggregations: ["total"],
  first: 10,
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
  resolve: async (
    _root,
    options,
    _request,
    { rootValue: { saleArtworksFilterLoader } }
  ) => {
    const relayOptions = { ...DEFAULTS, ...options }
    const params = parseRelayOptions(relayOptions)
    const response = await saleArtworksFilterLoader(params)
    const data = {
      ...response,
      ...connectionFromArraySlice(response.hits, relayOptions, {
        arrayLength: response.aggregations.total.value,
        sliceStart: params.offset,
      }),
    }

    return data
  },
}
