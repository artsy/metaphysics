import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLID,
  GraphQLInt,
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { map, omit } from "lodash"
import { pageable } from "relay-cursor-paging"

import numeral from "./fields/numeral"
import { ResolverContext } from "types/graphql"
import { SaleArtworkType } from "./sale_artwork"
import {
  SaleArtworksAggregation,
  SaleArtworksAggregationResultsType,
} from "./aggregations/filter_sale_artworks_aggregation"

const DEFAULTS = {
  aggregations: ["total"],
  first: 10,
}

const filterSaleArtworksArgs: GraphQLFieldConfigArgumentMap = {
  aggregations: {
    type: new GraphQLList(SaleArtworksAggregation),
  },
  artist_ids: {
    type: new GraphQLList(GraphQLString),
  },
  include_artworks_by_followed_artists: {
    type: GraphQLBoolean,
  },
  live_sale: {
    type: GraphQLBoolean,
  },
  is_auction: {
    type: GraphQLBoolean,
  },
  gene_ids: {
    type: new GraphQLList(GraphQLString),
  },
  estimate_range: {
    type: GraphQLString,
  },
  page: {
    type: GraphQLInt,
  },
  sale_id: {
    type: GraphQLID,
  },
  size: {
    type: GraphQLInt,
  },
  sort: {
    type: GraphQLString,
  },
}

const SaleArtworkAggregations = {
  description: "Returns aggregation counts for the given filter query.",
  type: new GraphQLList(SaleArtworksAggregationResultsType),
  resolve: ({ aggregations }) => {
    const allowedAggregations = omit(aggregations, [
      "total",
      "followed_artists",
    ])
    return map(allowedAggregations, (counts, slice) => ({
      slice,
      counts,
    }))
  },
}

const SaleArtworkCounts = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "FilterSaleArtworksCounts",
    fields: {
      total: numeral(({ aggregations }) => aggregations.total.value),
      followed_artists: numeral(
        ({ aggregations }) => aggregations.followed_artists.value
      ),
    },
  }),
  resolve: artist => artist,
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
      const { body, headers } = await saleArtworksAllLoader({
        ...params,
        total_count: true,
      })
      response = body

      // Piggyback on existing ES API. TODO: This could perhaps be unified
      // better, but quickfix.
      response = {
        hits: response,
        aggregations: {
          total: {
            value: parseInt(headers["x-total-count"] || "0", 10),
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
