import { pageable } from "relay-cursor-paging"
import {
  convertConnectionArgsToGravityArgs,
  removeNulls,
  removeEmptyValues,
  isExisty,
} from "lib/helpers"
import {
  connectionFromArraySlice,
  connectionDefinitions,
  toGlobalId,
} from "graphql-relay"
import {
  GraphQLFieldConfig,
  GraphQLNonNull,
  GraphQLID,
  GraphQLFieldConfigArgumentMap,
  GraphQLBoolean,
  GraphQLList,
  GraphQLString,
  GraphQLInt,
  GraphQLUnionType,
  GraphQLObjectType,
  GraphQLInterfaceType,
  GraphQLInputObjectType,
} from "graphql"

import { ResolverContext } from "types/graphql"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import {
  computeTotalPages,
  createPageCursors,
  pageToCursor,
  PageCursorsType,
} from "schema/v2/fields/pagination"

import Artwork, {
  artworkConnection,
  ArtworkConnectionInterface,
  ArtworkEdgeInterface,
} from "./artwork"
import { NodeInterface, GlobalIDField } from "./object_identification"
import {
  ArtworksAggregation,
  ArtworksAggregationResultsType,
} from "./aggregations/filter_artworks_aggregation"
import { omit, keys, map } from "lodash"
import Artist from "./artist"
import { TagType } from "./tag"
import { GeneType } from "./gene"
import numeral from "./fields/numeral"
import { ArtworkType } from "./artwork"
import { deprecate } from "lib/deprecation"
import ArtworkSizes from "./artwork/artworkSizes"

interface ContextSource {
  context_type: GraphQLObjectType<any, ResolverContext>
}

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

export const ArtworkFilterFacetType = new GraphQLUnionType<ContextSource>({
  name: "ArtworkFilterFacet",
  types: [TagType, GeneType],
  resolveType: ({ context_type }) => context_type,
})

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
  resolve: (data) => data,
}

export const filterArtworksArgs: GraphQLFieldConfigArgumentMap = {
  acquireable: {
    type: GraphQLBoolean,
  },
  offerable: {
    type: GraphQLBoolean,
  },
  additionalGeneIDs: {
    type: new GraphQLList(GraphQLString),
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
  artistNationalities: {
    type: GraphQLList(GraphQLString),
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
  colors: {
    type: new GraphQLList(GraphQLString),
  },
  sizes: {
    type: new GraphQLList(ArtworkSizes),
    description: "Filter results by Artwork sizes",
  },
  dimensionRange: {
    type: GraphQLString,
  },
  excludeArtworkIDs: {
    type: new GraphQLList(GraphQLString),
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
  materialsTerms: {
    type: GraphQLList(GraphQLString),
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
  partnerIDs: {
    type: new GraphQLList(GraphQLString),
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
  artistSeriesID: {
    type: GraphQLString,
  },
  locationCities: {
    type: new GraphQLList(GraphQLString),
  },
  marketingCollectionID: {
    type: GraphQLString,
  },
}

const pageableFilterArtworksArgs = pageable(filterArtworksArgs)

const FilterArtworksInputType = new GraphQLInputObjectType({
  name: "FilterArtworksInput",
  fields: pageableFilterArtworksArgs,
})

// exported for use in stitching SDL
export const pageableFilterArtworksArgsWithInput = {
  ...pageableFilterArtworksArgs,
  input: { type: FilterArtworksInputType },
}

export const FilterArtworksFields = () => {
  return {
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
      type: artworkConnection.connectionType,
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
    // TODO: Remove after Reaction v2 migration, if unused in Emission.
    hits: {
      deprecationReason: deprecate({ inVersion: 2, preferUsageOf: "edges" }),
      description: "Artwork results.",
      type: new GraphQLList(Artwork.type),
    },
    merchandisableArtists: {
      type: new GraphQLList(Artist.type),
      description:
        "Returns a list of merchandisable artists sorted by merch score.",
      args: {
        size: {
          type: GraphQLInt,
          description: "The number of artists to return",
          defaultValue: 12,
        },
      },
      resolve: ({ aggregations }, { size }: any, { artistsLoader }) => {
        if (!isExisty(aggregations.merchandisable_artists)) {
          return null
        }

        const artistIdsToReturn = keys(
          aggregations.merchandisable_artists
        ).slice(0, size)

        return artistsLoader({ ids: artistIdsToReturn }).then(
          ({ body }) => body
        )
      },
    },
    facet: {
      type: ArtworkFilterFacetType,
      resolve: (
        { gravityOptions },
        _options,
        { geneLoader, tagLoader }
      ): Promise<ContextSource> | null => {
        const { tag_id, gene_id } = gravityOptions
        if (tag_id) {
          return tagLoader(tag_id).then((tag) => ({
            ...tag,
            context_type: TagType,
          }))
        }
        if (gene_id) {
          return geneLoader(gene_id).then((gene) => ({
            ...gene,
            context_type: GeneType,
          }))
        }
        return null
      },
    },
  }
}

// The connection fields here match the original implementation's,
// except without `artworksConnection`.
const connectionFields = () => {
  const { artworksConnection, ...connectionFields } = FilterArtworksFields()
  return connectionFields
}

const filterArtworksConnectionType = connectionDefinitions({
  name: "FilterArtworks",
  nodeType: ArtworkType,
  connectionFields: {
    ...connectionFields(),
    id: {
      type: new GraphQLNonNull(GraphQLID),
      description: "The ID of the object.",
      resolve: ({ gravityOptions }) => {
        const { offset, ...filterOptions } = gravityOptions
        return toGlobalId(
          "filterArtworksConnection",
          JSON.stringify(filterOptions, Object.keys(filterOptions).sort())
        )
      },
    },
    pageCursors: {
      type: new GraphQLNonNull(PageCursorsType),
    },
  },
  connectionInterfaces: [NodeInterface, ArtworkConnectionInterface],
  edgeInterfaces: [ArtworkEdgeInterface],
}).connectionType

// Convert between incoming filter arguments, and backend-suitable format.
const convertFilterArgs = ({
  additionalGeneIDs,
  aggregationPartnerCities,
  artistID,
  artistIDs,
  artistNationalities,
  artistSeriesID,
  atAuction,
  attributionClass,
  sizes,
  dimensionRange,
  excludeArtworkIDs,
  extraAggregationGeneIDs,
  includeArtworksByFollowedArtists,
  includeMediumFilterInAggregation,
  inquireableOnly,
  forSale,
  geneID,
  geneIDs,
  majorPeriods,
  marketingCollectionID,
  materialsTerms,
  partnerID,
  partnerIDs,
  partnerCities,
  priceRange,
  saleID,
  tagID,
  keywordMatchExact,
  locationCities,
  ..._options
}) => {
  return {
    additional_gene_ids: additionalGeneIDs,
    aggregation_partner_cities: aggregationPartnerCities,
    artist_id: artistID,
    artist_ids: artistIDs,
    artist_nationalities: artistNationalities,
    artist_series_id: artistSeriesID,
    at_auction: atAuction,
    attribution_class: attributionClass,
    sizes: sizes,
    dimension_range: dimensionRange,
    exclude_artwork_ids: excludeArtworkIDs,
    extra_aggregation_gene_ids: extraAggregationGeneIDs,
    include_artworks_by_followed_artists: includeArtworksByFollowedArtists,
    include_medium_filter_in_aggregation: includeMediumFilterInAggregation,
    inquireable_only: inquireableOnly,
    for_sale: forSale,
    gene_id: geneID,
    gene_ids: geneIDs,
    major_periods: majorPeriods,
    marketing_collection_id: marketingCollectionID,
    materials_terms: materialsTerms,
    partner_id: partnerID,
    partner_ids: partnerIDs,
    partner_cities: partnerCities,
    price_range: priceRange,
    sale_id: saleID,
    tag_id: tagID,
    keyword_match_exact: keywordMatchExact,
    location_cities: locationCities,
    ..._options,
  }
}

const filterArtworksConnectionTypeFactory = (
  mapRootToFilterParams
): GraphQLFieldConfig<any, ResolverContext> => ({
  type: filterArtworksConnectionType,
  description: "Artworks Elastic Search results",
  args: pageableFilterArtworksArgsWithInput,
  resolve: (
    root,
    { input, ...rootArguments },
    {
      unauthenticatedLoaders: { filterArtworksLoader: loaderWithCache },
      authenticatedLoaders: { filterArtworksLoader: loaderWithoutCache },
    },
    info
  ) => {
    const argsProvidedAtRoot = convertFilterArgs(rootArguments as any)
    removeEmptyValues(argsProvidedAtRoot)
    const argsProvidedInInput = convertFilterArgs(input ?? {})
    removeEmptyValues(argsProvidedInInput)

    const options: any = {
      ...argsProvidedAtRoot,
      ...argsProvidedInInput,
    }

    const {
      first,
      last,
      after,
      before,
      size,
      include_artworks_by_followed_artists,
      aggregations = [],
    } = options

    // Check if connection args missing.
    if (first == null && last == null && size == null) {
      throw new Error("You must pass either `first`, `last` or `size`.")
    }

    const requestedPersonalizedAggregation = aggregations.includes(
      "followed_artists"
    )

    if (!aggregations.includes("total")) {
      aggregations.push("total")
    }

    const gravityOptions = {
      ...convertConnectionArgsToGravityArgs(options),
      ...mapRootToFilterParams(root),
      aggregations,
    }

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

    // If only queried for id, can just return w/o fetching.
    if (!includesFieldsOtherThanSelectionSet(info, ["id"])) {
      return { hits: null, aggregations: null, gravityOptions }
    }

    return loader(gravityOptions).then(({ aggregations, hits }) => {
      if (!aggregations || !aggregations.total) {
        throw new Error(
          "Expected filter results to contain a `total` aggregation"
        )
      }

      const totalPages = computeTotalPages(
        aggregations.total.value,
        gravityOptions.size
      )

      const connection = connectionFromArraySlice(
        hits,
        { first, last, after, before },
        {
          arrayLength: Math.min(
            aggregations.total.value,
            totalPages * gravityOptions.size
          ),
          sliceStart: gravityOptions.offset,
        }
      )

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
          aggregations,
          gravityOptions, // include for convenience in nested resolvers
        },
        connection
      )
    })
  },
})

// Support passing in your own primary key
// so that you can nest this function into another.

// When given a primary key, this function take the
// value out of the parent payload and moves it into
// the query itself

export function filterArtworksConnection(primaryKey?: string) {
  return filterArtworksConnectionTypeFactory(
    primaryKey ? ({ id, _id }) => ({ [primaryKey]: _id || id }) : () => ({})
  )
}

export default filterArtworksConnection

export function filterArtworksConnectionWithParams(mapRootToFilterParams) {
  return filterArtworksConnectionTypeFactory(mapRootToFilterParams)
}

export const EntityWithFilterArtworksConnectionInterface = new GraphQLInterfaceType(
  {
    name: "EntityWithFilterArtworksConnectionInterface",
    fields: {
      id: GlobalIDField,
      filterArtworksConnection: {
        type: filterArtworksConnectionType,
        args: pageable(filterArtworksArgs),
      },
    },
  }
)
