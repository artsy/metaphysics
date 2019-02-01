import { SaleArtworkType } from "./sale_artwork"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { filterSaleArtworksArgs } from "schema/filter_sale_artworks"
import {
  SaleArtworkAggregations,
  SaleArtworkCounts,
} from "schema/filter_sale_artworks"
import { GraphQLFieldConfig } from "graphql"
import { ResolverContext } from "types/graphql"

const DEFAULTS = {
  aggregations: ["total"],
  first: 10,
}

const SaleArtworksType = connectionDefinitions({
  name: "SaleArtworks",
  nodeType: SaleArtworkType,
  connectionFields: {
    aggregations: SaleArtworkAggregations,
    counts: SaleArtworkCounts,
  },
}).connectionType

const SaleArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  args: pageable(filterSaleArtworksArgs),
  description: "Sale Artworks search results",
  type: SaleArtworksType,
  resolve: async (
    _root,
    options,
    { saleArtworksFilterLoader, saleArtworksAllLoader }
  ) => {
    const relayOptions = { ...DEFAULTS, ...options }
    const params = convertConnectionArgsToGravityArgs(relayOptions)
    let response

    if (saleArtworksAllLoader && options.live_sale) {
      delete params.page
      params.total_count = true
      const { body, headers } = await saleArtworksAllLoader(params)
      response = body

      // Piggyback on existing ES API. TODO: This could perhaps be unified
      // better, but quickfix.
      response = {
        hits: response,
        aggregations: {
          total: {
            value: headers["x-total-count"],
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

export default SaleArtworks
