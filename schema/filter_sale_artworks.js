import gravity from "lib/loaders/legacy/gravity"
import { map, omit } from "lodash"
import SaleArtwork from "./sale_artwork"
import numeral from "./fields/numeral"
import {
  SaleArtworksAggregationResultsType,
  SaleArtworksAggregation,
} from "./aggregations/filter_sale_artworks_aggregation"
import { GraphQLList, GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLInt, GraphQLID } from "graphql"
import { connectionDefinitions, connectionFromArraySlice } from "graphql-relay"
import { parseRelayOptions } from "lib/helpers"
import { pageable } from "relay-cursor-paging"

export const filterSaleArtworksArgs = {
  aggregations: {
    type: new GraphQLList(SaleArtworksAggregation),
  },
  artist_ids: {
    type: new GraphQLList(GraphQLString),
  },
  include_artworks_by_followed_artists: {
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

export const FilterSaleArtworksType = new GraphQLObjectType({
  name: "FilterSaleArtworks",
  fields: () => ({
    aggregations: {
      description: "Returns aggregation counts for the given filter query.",
      type: new GraphQLList(SaleArtworksAggregationResultsType),
      resolve: ({ aggregations }) => {
        const whitelistedAggregations = omit(aggregations, ["total", "followed_artists"])
        return map(whitelistedAggregations, (counts, slice) => ({
          slice,
          counts,
        }))
      },
    },
    counts: {
      type: new GraphQLObjectType({
        name: "FilterSaleArtworksCounts",
        fields: {
          total: numeral(({ aggregations }) => aggregations.total.value),
          followed_artists: numeral(({ aggregations }) => aggregations.followed_artists.value),
        },
      }),
      resolve: artist => artist,
    },
    hits: {
      description: "Sale Artwork results.",
      type: new GraphQLList(SaleArtwork.type),
    },
    sale_artworks_connection: {
      type: connectionDefinitions({
        name: "FilterSaleArtworks",
        nodeType: SaleArtwork.type,
      }).connectionType,
      args: pageable(filterSaleArtworksArgs),
      resolve: async ({ aggregations }, options, _request, { rootValue: { accessToken } }) => {
        if (!aggregations || !aggregations.total) {
          throw new Error("This query must contain the total aggregation")
        }

        const relayOptions = parseRelayOptions(options)
        const { hits } = await gravity.with(accessToken)("filter/sale_artworks", relayOptions)
        return connectionFromArraySlice(hits, options, {
          arrayLength: aggregations.total.value,
          sliceStart: relayOptions.offset,
        })
      },
    },
  }),
})

const FilterSaleArtworks = {
  type: FilterSaleArtworksType,
  description: "Sale Artworks Elastic Search results",
  args: filterSaleArtworksArgs,
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    return gravity.with(accessToken)("filter/sale_artworks", options)
  },
}

export default FilterSaleArtworks
