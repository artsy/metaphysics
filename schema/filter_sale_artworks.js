import gravity from "lib/loaders/gravity"
import { map, omit } from "lodash"
import SaleArtwork from "./sale_artwork"
import numeral from "./fields/numeral"
import {
  SaleArtworksAggregationResultsType,
  SaleArtworksAggregation,
} from "./aggregations/filter_sale_artworks_aggregation"
import { GraphQLList, GraphQLObjectType, GraphQLString, GraphQLBoolean, GraphQLInt, GraphQLID } from "graphql"

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
  }),
})

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

const FilterSaleArtworks = {
  type: FilterSaleArtworksType,
  description: "Sale Artworks Elastic Search results",
  args: filterSaleArtworksArgs,
  resolve: (root, options, request, { rootValue: { accessToken } }) => {
    return gravity.with(accessToken)("filter/sale_artworks", options)
  },
}

export default FilterSaleArtworks
