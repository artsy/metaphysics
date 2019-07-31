import { map, omit, keys } from "lodash"
import { isExisty } from "lib/helpers"
import Artwork from "./artwork"
import Artist from "./artist"
import { TagType } from "./tag"
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
import { NodeInterface } from "schema/v2/object_identification"
import { ResolverContext } from "types/graphql"
import {
  includesFieldsOtherThanSelectionSet,
  parseConnectionArgsFromConnection,
} from "lib/hasFieldSelection"
import { GeneType } from "./gene"

interface ContextSource {
  context_type: GraphQLObjectType<any, ResolverContext>
}

export const ArtworkFilterFacetType = new GraphQLUnionType<ContextSource>({
  name: "ArtworkFilterFacet",
  types: [TagType, GeneType],
  resolveType: ({ context_type }) => context_type,
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
      followedArtists: numeral(
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
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the object.",
      resolve: ({ options }) =>
        toGlobalId(
          "FilterArtworks",
          JSON.stringify(omit(options, "page", "size", "offset"))
        ),
    },
    aggregations: ArtworkFilterAggregations,
    artworksConnection: {
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
        { options: gravityOptions, aggregations, hits },
        args,
        _context
      ) => {
        if (!aggregations || !aggregations.total) {
          throw new Error("This query must contain the total aggregation")
        }

        const totalPages = computeTotalPages(
          aggregations.total.value,
          gravityOptions.size
        )

        const connection = connectionFromArraySlice(hits, args, {
          arrayLength: Math.min(
            aggregations.total.value,
            totalPages * gravityOptions.size
          ),
          sliceStart: gravityOptions.offset,
        })

        connection.pageInfo.endCursor = pageToCursor(
          gravityOptions.page + 1,
          gravityOptions.size
        )

        return Object.assign(
          {
            pageCursors: createPageCursors(
              gravityOptions,
              aggregations.total.value
            ),
          },
          connection
        )
      },
    },
    counts: FilterArtworksCounts,
    hits: {
      description: "Artwork results.",
      type: new GraphQLList(Artwork.type),
    },
    merchandisableArtists: {
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
    facet: {
      type: ArtworkFilterFacetType,
      resolve: (
        { options },
        _options,
        { geneLoader, tagLoader }
      ): Promise<ContextSource> | null => {
        const { tag_id, gene_id } = options
        if (tag_id) {
          return tagLoader(tag_id).then(tag => ({
            ...tag,
            context_type: TagType,
          }))
        }
        if (gene_id) {
          return geneLoader(gene_id).then(gene => ({
            ...gene,
            context_type: GeneType,
          }))
        }
        return null
      },
    },
  }),
})

const filterArtworksTypeFactory = (
  mapRootToFilterParams
): GraphQLFieldConfig<any, ResolverContext> => ({
  type: FilterArtworksType,
  description: "Artworks Elastic Search results",
  args: {
    acquireable: {
      type: GraphQLBoolean,
    },
    offerable: {
      type: GraphQLBoolean,
    },
    aggregationPartnerCities: {
      type: new GraphQLList(GraphQLString),
    },
    aggregations: {
      type: new GraphQLList(ArtworksAggregation),
    },
    artistID: {
      type: GraphQLString,
    },
    artistIDs: {
      type: new GraphQLList(GraphQLString),
    },
    atAuction: {
      type: GraphQLBoolean,
    },
    attributionClass: {
      type: new GraphQLList(GraphQLString),
    },
    color: {
      type: GraphQLString,
    },
    dimensionRange: {
      type: GraphQLString,
    },
    extraAggregationGeneIDs: {
      type: new GraphQLList(GraphQLString),
    },
    includeArtworksByFollowedArtists: {
      type: GraphQLBoolean,
    },
    includeMediumFilterInAggregation: {
      type: GraphQLBoolean,
    },
    inquireableOnly: {
      type: GraphQLBoolean,
    },
    forSale: {
      type: GraphQLBoolean,
    },
    geneID: {
      type: GraphQLString,
    },
    geneIDs: {
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
    majorPeriods: {
      type: new GraphQLList(GraphQLString),
    },
    partnerID: {
      type: GraphQLID,
    },
    partnerCities: {
      type: new GraphQLList(GraphQLString),
    },
    priceRange: {
      type: GraphQLString,
    },
    page: {
      type: GraphQLInt,
    },
    saleID: {
      type: GraphQLID,
    },
    size: {
      type: GraphQLInt,
    },
    sort: {
      type: GraphQLString,
    },
    tagID: {
      type: GraphQLString,
    },
    keyword: {
      type: GraphQLString,
    },
    keywordMatchExact: {
      type: GraphQLBoolean,
      description: "When true, will only return exact keyword match",
    },
  },
  resolve: (
    root,
    {
      aggregationPartnerCities,
      artistID,
      artistIDs,
      atAuction,
      attributionClass,
      dimensionRange,
      extraAggregationGeneIDs,
      includeArtworksByFollowedArtists,
      includeMediumFilterInAggregation,
      inquireableOnly,
      forSale,
      geneID,
      geneIDs,
      majorPeriods,
      partnerID,
      partnerCities,
      priceRange,
      saleID,
      tagID,
      keywordMatchExact,
      ..._options
    },
    {
      unauthenticatedLoaders: { filterArtworksLoader: loaderWithCache },
      authenticatedLoaders: { filterArtworksLoader: loaderWithoutCache },
    },
    info
  ) => {
    const options: any = {
      aggregation_partner_cities: aggregationPartnerCities,
      artist_id: artistID,
      artist_ids: artistIDs,
      at_auction: atAuction,
      attribution_class: attributionClass,
      dimension_range: dimensionRange,
      extra_aggregation_gene_ids: extraAggregationGeneIDs,
      include_artworks_by_followed_artists: includeArtworksByFollowedArtists,
      include_medium_filter_in_aggregation: includeMediumFilterInAggregation,
      inquireable_only: inquireableOnly,
      for_sale: forSale,
      gene_id: geneID,
      gene_ids: geneIDs,
      major_periods: majorPeriods,
      partner_id: partnerID,
      partner_cities: partnerCities,
      price_range: priceRange,
      sale_id: saleID,
      tag_id: tagID,
      keyword_match_exact: keywordMatchExact,
      ..._options,
    }

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

    // Introspect connection args for `artworks_connection`.
    // Use those and fetch all data in one request.
    // Resolver for `artworks_connection` just creates a connection
    // from the already fetched data, instead of re-fetching.
    const connectionArgs = parseConnectionArgsFromConnection(
      info,
      "artworks_connection"
    )

    let relayOptions: any = {}
    if (Object.keys(connectionArgs).length) {
      relayOptions = convertConnectionArgsToGravityArgs(connectionArgs)
    }

    if (!!gravityOptions.page) relayOptions.page = gravityOptions.page

    // If only queried for __id, can just return w/o fetching.
    if (!includesFieldsOtherThanSelectionSet(info, ["__id"])) {
      return { hits: null, aggregations: null, options: gravityOptions }
    }

    const allOptions = Object.assign({}, gravityOptions, relayOptions)
    return loader(allOptions).then(response =>
      Object.assign({}, response, { options: allOptions })
    )
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
