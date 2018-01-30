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
    { rootValue: { saleArtworksFilterLoader, saleArtworksAllLoader } }
  ) => {
    const relayOptions = { ...DEFAULTS, ...options }
    const params = parseRelayOptions(relayOptions)
    let response

    if (options.live_sale) {
      delete params.page
      response = await saleArtworksAllLoader(params)

      // Piggyback on existing ES API. TODO: This could perhaps be unified
      // better, but quickfix.
      response = {
        hits: response,
        aggregations: {
          total: {
            value: 10,
          },
        },
      }
    } else {
      response = await saleArtworksFilterLoader(params)
    }

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
