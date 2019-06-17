import { map, omit, keys, create, assign } from "lodash"
import { isExisty } from "lib/helpers"
import Artwork from "./artwork"
import Artist from "./artist"
import Tag from "./tag"
import numeral from "./fields/numeral"
import {
  computeTotalPages,
  createPageCursors,
  pageToCursor,
} from "./fields/pagination"
import { artworkConnection } from "./artwork"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs, removeNulls } from "lib/helpers"
import { connectionFromArraySlice, toGlobalId } from "graphql-relay"
import {
  ArtworksAggregationResultsType,
  ArtworksAggregation,
} from "./aggregations/filter_artworks_aggregation"
import {
  GraphQLList,
  GraphQLObjectType,
  GraphQLString,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLID,
  GraphQLUnionType,
  GraphQLNonNull,
  GraphQLFieldConfig,
} from "graphql"

import { NodeInterface } from "schema/object_identification"
import { ResolverContext } from "types/graphql"
import { deprecate } from "lib/deprecation"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"

const ArtworkFilterTagType = create(Tag.type, {
  name: "ArtworkFilterTag",
  isTypeOf: ({ context_type }) => context_type === "Tag",
})

const ArtworkFilterGeneType = create(Tag.type, {
  name: "ArtworkFilterGene",
  isTypeOf: ({ context_type }) => context_type === "Gene",
})

export const ArtworkFilterFacetType = new GraphQLUnionType({
  name: "ArtworkFilterFacet",
  types: [ArtworkFilterTagType, ArtworkFilterGeneType],
})

export const ArtworkFilterAggregations: GraphQLFieldConfig<
  any,
  ResolverContext
> = {
  description: "Returns aggregation counts for the given filter query.",
  type: new GraphQLList(ArtworksAggregationResultsType),
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

export const FilterArtworksCounts = {
  type: new GraphQLObjectType<any, ResolverContext>({
    name: "FilterArtworksCounts",
    fields: {
      total: numeral(({ aggregations }) => aggregations.total.value),
      followed_artists: numeral(
        ({ aggregations }) => aggregations.followed_artists.value
      ),
    },
  }),
  resolve: data => data,
}

export const FilterArtworksType = new GraphQLObjectType<any, ResolverContext>({
  name: "FilterArtworks",
  interfaces: [NodeInterface],
  fields: () => ({
    __id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the object.",
      resolve: ({ options }) =>
        toGlobalId("FilterArtworks", JSON.stringify(omit(options, "page"))),
    },
    aggregations: ArtworkFilterAggregations,
    artworks_connection: {
      type: artworkConnection,
      // FIXME: Uncomment deprecationReason once https://github.com/apollographql/apollo-tooling/issues/805
      // has been addressed.
      //deprecationReason:
      //  "Use only for filtering over ElasticSearch-backed fields, otherwise favor artwork connections that take filter arguments.",
      args: pageable({
        sort: {
          type: GraphQLString,
        },
      }),
      resolve: (
        { options: gravityOptions },
        args,
        {
          unauthenticatedLoaders: { filterArtworksLoader: loaderWithCache },
          authenticatedLoaders: { filterArtworksLoader: loaderWithoutCache },
        }
      ) => {
        const relayOptions = convertConnectionArgsToGravityArgs(args)
        if (!!gravityOptions.page) relayOptions.page = gravityOptions.page

        const { page, size } = relayOptions
        const {
          include_artworks_by_followed_artists,
          aggregations,
        } = gravityOptions
        const requestedPersonalizedAggregation = aggregations.includes(
          "followed_artists"
        )

        let loader
        if (
          include_artworks_by_followed_artists ||
          requestedPersonalizedAggregation
        ) {
          if (!loaderWithoutCache) {
            throw new Error("You must be logged in to request these params.")
          }
          loader = loaderWithoutCache
        } else {
          loader = loaderWithCache
        }

        return loader(Object.assign(gravityOptions, relayOptions, {})).then(
          ({ aggregations, hits }) => {
            if (!aggregations || !aggregations.total) {
              throw new Error("This query must contain the total aggregation")
            }

            const totalPages = computeTotalPages(
              aggregations.total.value,
              relayOptions.size
            )

            const connection = connectionFromArraySlice(hits, args, {
              arrayLength: Math.min(
                aggregations.total.value,
                totalPages * relayOptions.size
              ),
              sliceStart: relayOptions.offset,
            })

            connection.pageInfo.endCursor = pageToCursor(page + 1, size)

            return Object.assign(
              {
                pageCursors: createPageCursors(
                  relayOptions,
                  aggregations.total.value
                ),
              },
              connection
            )
          }
        )
      },
    },
    counts: FilterArtworksCounts,
    followed_artists_total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.followed_artists.value,
      deprecationReason: deprecate({
        inVersion: 2,
        preferUsageOf: "counts.followed_artists",
      }),
    },
    hits: {
      description: "Artwork results.",
      type: new GraphQLList(Artwork.type),
    },
    merchandisable_artists: {
      type: new GraphQLList(Artist.type),
      description:
        "Returns a list of merchandisable artists sorted by merch score.",
      resolve: ({ aggregations }, _options, { artistsLoader }) => {
        if (!isExisty(aggregations.merchandisable_artists)) {
          return null
        }
        return artistsLoader({
          ids: keys(aggregations.merchandisable_artists),
        })
      },
    },
    total: {
      type: GraphQLInt,
      resolve: ({ aggregations }) => aggregations.total.value,
      deprecationReason: deprecate({
        inVersion: 2,
        preferUsageOf: "counts.total",
      }),
    },
    facet: {
      type: ArtworkFilterFacetType,
      resolve: ({ options }, _options, { geneLoader, tagLoader }) => {
        const { tag_id, gene_id } = options
        if (tag_id) {
          return tagLoader(tag_id).then(tag =>
            assign({ context_type: "Tag" }, tag)
          )
        }
        if (gene_id) {
          return geneLoader(gene_id).then(gene =>
            assign({ context_type: "Gene" }, gene)
          )
        }
        return null
      },
    },
  }),
})

export const filterArtworksArgs = {
  acquireable: {
    type: GraphQLBoolean,
  },
  offerable: {
    type: GraphQLBoolean,
  },
  aggregation_partner_cities: {
    type: new GraphQLList(GraphQLString),
  },
  aggregations: {
    type: new GraphQLList(ArtworksAggregation),
  },
  artist_id: {
    type: GraphQLString,
  },
  artist_ids: {
    type: new GraphQLList(GraphQLString),
  },
  at_auction: {
    type: GraphQLBoolean,
  },
  attribution_class: {
    type: new GraphQLList(GraphQLString),
  },
  color: {
    type: GraphQLString,
  },
  dimension_range: {
    type: GraphQLString,
  },
  extra_aggregation_gene_ids: {
    type: new GraphQLList(GraphQLString),
  },
  include_artworks_by_followed_artists: {
    type: GraphQLBoolean,
  },
  include_medium_filter_in_aggregation: {
    type: GraphQLBoolean,
  },
  inquireable_only: {
    type: GraphQLBoolean,
  },
  for_sale: {
    type: GraphQLBoolean,
  },
  gene_id: {
    type: GraphQLString,
  },
  gene_ids: {
    type: new GraphQLList(GraphQLString),
  },
  height: {
    type: GraphQLString,
  },
  width: {
    type: GraphQLString,
  },
  marketable: {
    type: GraphQLBoolean,
    description:
      "When true, will only return `marketable` works (not nude or provocative).",
  },
  medium: {
    type: GraphQLString,
    description:
      "A string from the list of allocations, or * to denote all mediums",
  },
  period: {
    type: GraphQLString,
  },
  periods: {
    type: new GraphQLList(GraphQLString),
  },
  major_periods: {
    type: new GraphQLList(GraphQLString),
  },
  partner_id: {
    type: GraphQLID,
  },
  partner_cities: {
    type: new GraphQLList(GraphQLString),
  },
  price_range: {
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
  tag_id: {
    type: GraphQLString,
  },
  keyword: {
    type: GraphQLString,
  },
  keyword_match_exact: {
    type: GraphQLBoolean,
    description: "When true, will only return exact keyword match",
  },
}

const filterArtworksTypeFactory = (
  mapRootToFilterParams
): GraphQLFieldConfig<any, ResolverContext> => ({
  type: FilterArtworksType,
  description: "Artworks Elastic Search results",
  args: filterArtworksArgs,
  resolve: (
    root,
    options,
    {
      unauthenticatedLoaders: { filterArtworksLoader: loaderWithCache },
      authenticatedLoaders: { filterArtworksLoader: loaderWithoutCache },
    },
    info
  ) => {
    const { include_artworks_by_followed_artists, aggregations } = options
    const requestedPersonalizedAggregation = aggregations.includes(
      "followed_artists"
    )
    const gravityOptions = Object.assign(
      {},
      options,
      mapRootToFilterParams(root)
    )

    // Support queries that show all mediums using the medium param.
    // If you specify "*" it results in metaphysics removing the query option
    // making the graphQL queries between all and a subset of mediums the same shape.
    if (gravityOptions.medium === "*" || !gravityOptions.medium) {
      delete gravityOptions.medium
    }

    removeNulls(gravityOptions)

    let loader
    if (
      include_artworks_by_followed_artists ||
      requestedPersonalizedAggregation
    ) {
      if (!loaderWithoutCache) {
        throw new Error("You must be logged in to request these params.")
      }
      loader = loaderWithoutCache
    } else {
      loader = loaderWithCache
    }

    const blacklistedFields = ["artworks_connection", "__id"]
    if (
      info.fieldNodes &&
      includesFieldsOtherThanSelectionSet(info, blacklistedFields)
    ) {
      return loader(gravityOptions).then(response =>
        Object.assign({}, response, { options: gravityOptions })
      )
    }
    return { hits: null, aggregations: null, options: gravityOptions }
  },
})

// Support passing in your own primary key
// so that you can nest this function into another.

// When given a primary key, this function take the
// value out of the parent payload and moves it into
// the query itself

export default function filterArtworks(primaryKey: string) {
  return filterArtworksTypeFactory(
    primaryKey ? ({ id }) => ({ [primaryKey]: id }) : () => ({})
  )
}

export function filterArtworksWithParams(mapRootToFilterParams) {
  return filterArtworksTypeFactory(mapRootToFilterParams)
}
