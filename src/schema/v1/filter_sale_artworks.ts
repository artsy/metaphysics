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
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
} from "graphql"
import {
  SaleArtworksAggregationResultsType,
  SaleArtworksAggregation,
} from "./aggregations/filter_sale_artworks_aggregation"
import { ResolverContext } from "types/graphql"
import { deprecate } from "lib/deprecation"

/**
 * NOTE: This type has been deprecated in favor of `SaleArtworks`.
 */

export const filterSaleArtworksArgs: GraphQLFieldConfigArgumentMap = {
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
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "FilterSaleArtworksCounts",
    fields: {
      total: numeral(({ aggregations }) => aggregations.total.value),
      followed_artists: numeral(
        ({ aggregations }) => aggregations.followed_artists.value
      ),
    },
  }),
  resolve: (artist) => artist,
}

export const FilterSaleArtworksType = new GraphQLObjectType<
  any,
  ResolverContext
>({
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

const FilterSaleArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: FilterSaleArtworksType,
  description: "Sale Artworks Elastic Search results",
  deprecationReason: deprecate({
    inVersion: 2,
    preferUsageOf: "sale_artworks",
  }),
  args: filterSaleArtworksArgs,
  resolve: (_root, options, { saleArtworksFilterLoader }) => {
    return saleArtworksFilterLoader(options)
  },
}

export default FilterSaleArtworks
