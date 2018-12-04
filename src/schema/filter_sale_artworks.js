import { map, omit } from "lodash"
import SaleArtwork from "./sale_artwork"
import numeral from "./fields/numeral"
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
} from "graphql"
import {
  SaleArtworksAggregationResultsType,
  SaleArtworksAggregation,
} from "./aggregations/filter_sale_artworks_aggregation"

/**
 * NOTE: This type has been deprecated in favor of `SaleArtworks`.
 */

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

export const SaleArtworkAggregations = {
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

export const SaleArtworkCounts = {
  type: new GraphQLObjectType({
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

export const FilterSaleArtworksType = new GraphQLObjectType({
  name: "FilterSaleArtworks",
  fields: () => ({
    aggregations: SaleArtworkAggregations,
    counts: SaleArtworkCounts,
    hits: {
      description: "Sale Artwork results.",
      type: new GraphQLList(SaleArtwork.type),
    },
  }),
})

const FilterSaleArtworks = {
  type: FilterSaleArtworksType,
  description: "Sale Artworks Elastic Search results",
  deprecationReason: "This type has been superceded by `sale_artworks`",
  args: filterSaleArtworksArgs,
  resolve: (
    root,
    options,
    request,
    { rootValue: { saleArtworksFilterLoader } }
  ) => {
    return saleArtworksFilterLoader(options)
  },
}

export default FilterSaleArtworks
