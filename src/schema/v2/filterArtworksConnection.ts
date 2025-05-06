import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLFieldConfigArgumentMap,
  GraphQLID,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLInterfaceType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
  GraphQLUnionType,
} from "graphql"
import {
  connectionDefinitions,
  connectionFromArraySlice,
  toGlobalId,
} from "graphql-relay"
import {
  convertConnectionArgsToGravityArgs,
  isExisty,
  removeEmptyValues,
  removeNulls,
} from "lib/helpers"
import { pageable } from "relay-cursor-paging"

import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import {
  computeTotalPages,
  createPageCursors,
  PageCursorsType,
  pageToCursor,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"

import { deprecate } from "lib/deprecation"
import { keys, map, omit } from "lodash"
import {
  ArtworksAggregation,
  ArtworksAggregationResultsType,
} from "./aggregations/filter_artworks_aggregation"
import Artist from "./artist"
import Artwork, {
  artworkConnection,
  ArtworkConnectionInterface,
  ArtworkEdgeInterface,
  ArtworkType,
} from "./artwork"
import ArtworkSizes from "./artwork/artworkSizes"
import numeral from "./fields/numeral"
import { GeneType } from "./gene"
import { GlobalIDField, NodeInterface } from "./object_identification"
import { TagType } from "./tag"

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
        ({ aggregations }) => aggregations.followed_artists?.value
      ),
    },
  }),
  resolve: (data) => data,
}

export const filterArtworksArgs: GraphQLFieldConfigArgumentMap = {
  acquireable: {
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
  artistSeriesID: {
    type: GraphQLString,
  },
  artistSeriesIDs: {
    type: new GraphQLList(GraphQLString),
  },
  artworkIDs: {
    type: new GraphQLList(GraphQLString),
    description: "When provided, will only return artworks with these IDs.",
  },
  atAuction: {
    type: GraphQLBoolean,
  },
  attributionClass: {
    type: new GraphQLList(GraphQLString),
  },
  availability: {
    type: GraphQLString,
  },
  categories: {
    type: new GraphQLList(GraphQLString),
  },
  color: {
    type: GraphQLString,
  },
  colors: {
    type: new GraphQLList(GraphQLString),
  },
  dimensionRange: {
    type: GraphQLString,
  },
  disableNotForSaleSorting: {
    type: GraphQLBoolean,
    description:
      "When true, will skip pushing sold works to the back of the list. Useful in a CMS context.",
  },
  excludeArtworkIDs: {
    type: new GraphQLList(GraphQLString),
  },
  extraAggregationGeneIDs: {
    type: new GraphQLList(GraphQLString),
  },
  forSale: {
    type: GraphQLBoolean,
  },
  framed: {
    type: GraphQLBoolean,
    description: "When true, will only return framed artworks.",
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
  importSources: {
    type: GraphQLList(GraphQLString),
  },
  includeAllJSON: {
    type: GraphQLBoolean,
  },
  includeArtworksByFollowedArtists: {
    type: GraphQLBoolean,
  },
  includeMediumFilterInAggregation: {
    type: GraphQLBoolean,
  },
  includeUnpublished: {
    type: GraphQLBoolean,
  },
  inquireableOnly: {
    type: GraphQLBoolean,
  },
  keyword: {
    type: GraphQLString,
  },
  keywordMatchExact: {
    type: GraphQLBoolean,
    description: "When true, will only return exact keyword match",
  },
  locationCities: {
    type: new GraphQLList(GraphQLString),
  },
  majorPeriods: {
    type: new GraphQLList(GraphQLString),
  },
  marketable: {
    type: GraphQLBoolean,
    description:
      "When true, will only return `marketable` works (not nude or provocative).",
  },
  marketingCollectionID: {
    type: GraphQLString,
  },
  materialsTerms: {
    type: GraphQLList(GraphQLString),
  },
  medium: {
    type: GraphQLString,
    description:
      "A string from the list of allocations, or * to denote all mediums",
  },
  offerable: {
    type: GraphQLBoolean,
  },
  page: {
    type: GraphQLInt,
  },
  partnerCities: {
    type: new GraphQLList(GraphQLString),
  },
  partnerID: {
    type: GraphQLID,
  },
  partnerIDs: {
    type: new GraphQLList(GraphQLString),
  },
  period: {
    type: GraphQLString,
  },
  periods: {
    type: new GraphQLList(GraphQLString),
  },
  priceRange: {
    type: GraphQLString,
  },
  published: {
    type: GraphQLBoolean,
    description:
      "When false, will only return unpublished artworks for authorized users.",
  },
  saleID: {
    type: GraphQLID,
  },
  showID: {
    type: GraphQLString,
  },
  sold: {
    type: GraphQLBoolean,
  },
  signed: {
    type: GraphQLBoolean,
    description: "When true, will only return signed artworks.",
  },
  size: {
    type: GraphQLInt,
  },
  sizes: {
    type: new GraphQLList(ArtworkSizes),
    description: "Filter results by Artwork sizes",
  },
  sort: {
    type: GraphQLString,
  },
  tagID: {
    type: GraphQLString,
  },
  width: {
    type: GraphQLString,
  },
  visibilityLevel: {
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
  artistSeriesIDs,
  artworkIDs,
  atAuction,
  attributionClass,
  dimensionRange,
  excludeArtworkIDs,
  extraAggregationGeneIDs,
  forSale,
  geneID,
  geneIDs,
  importSources,
  includeAllJSON,
  includeArtworksByFollowedArtists,
  includeMediumFilterInAggregation,
  includeUnpublished,
  inquireableOnly,
  keywordMatchExact,
  locationCities,
  majorPeriods,
  marketingCollectionID,
  materialsTerms,
  partnerCities,
  partnerID,
  partnerIDs,
  priceRange,
  saleID,
  showID,
  sizes,
  tagID,
  visibilityLevel,
  ..._options
}) => {
  return {
    additional_gene_ids: additionalGeneIDs,
    aggregation_partner_cities: aggregationPartnerCities,
    artist_id: artistID,
    artist_ids: artistIDs,
    artist_nationalities: artistNationalities,
    artist_series_id: artistSeriesID,
    artist_series_ids: artistSeriesIDs,
    at_auction: atAuction,
    attribution_class: attributionClass,
    dimension_range: dimensionRange,
    exclude_artwork_ids: excludeArtworkIDs,
    extra_aggregation_gene_ids: extraAggregationGeneIDs,
    for_sale: forSale,
    gene_id: geneID,
    gene_ids: geneIDs,
    ids: artworkIDs,
    import_sources: importSources,
    include_all_json: includeAllJSON,
    include_artworks_by_followed_artists: includeArtworksByFollowedArtists,
    include_medium_filter_in_aggregation: includeMediumFilterInAggregation,
    include_unpublished: includeUnpublished,
    inquireable_only: inquireableOnly,
    keyword_match_exact: keywordMatchExact,
    location_cities: locationCities,
    major_periods: majorPeriods,
    marketing_collection_id: marketingCollectionID,
    materials_terms: materialsTerms,
    partner_cities: partnerCities,
    partner_id: partnerID,
    partner_ids: partnerIDs,
    partner_show_id: showID,
    price_range: priceRange,
    sale_id: saleID,
    sizes: sizes,
    tag_id: tagID,
    visibility_level: visibilityLevel,
    ..._options,
  }
}

const filterArtworksConnectionTypeFactory = (
  mapRootToFilterParams
): GraphQLFieldConfig<any, ResolverContext> => ({
  type: filterArtworksConnectionType,
  description: "Artworks Elastic Search results",
  args: pageableFilterArtworksArgsWithInput,
  resolve: async (root, { input, ...rootArguments }, ctx, info) => {
    const {
      unauthenticatedLoaders: {
        filterArtworksLoader: filterArtworksUnauthenticatedLoader,
      },
      authenticatedLoaders: {
        filterArtworksLoader: filterArtworksAuthenticatedLoader,
      },
      filterArtworksUncachedLoader,
    } = ctx
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
      include_all_json,
      visibility_level,
      aggregations: aggregationOptions = [],
    } = options

    // Check if connection args missing.
    if (first == null && last == null && size == null) {
      throw new Error("You must pass either `first`, `last` or `size`.")
    }

    const requestedPersonalizedAggregation = aggregationOptions.includes(
      "followed_artists"
    )

    if (!aggregationOptions.includes("total")) {
      aggregationOptions.push("total")
    }

    const gravityOptions = {
      ...convertConnectionArgsToGravityArgs(options),
      ...mapRootToFilterParams(root),
      aggregations: aggregationOptions,
      disable_not_for_sale_sorting: options.disableNotForSaleSorting,
    }

    // We need to set `include_unpublished` when filtering for only unpublished works.
    if (gravityOptions.published === false) {
      gravityOptions.include_unpublished = true
    }

    const requestedAuthorizedFilters = !!(
      gravityOptions.include_unpublished ||
      include_artworks_by_followed_artists ||
      visibility_level ||
      include_all_json
    )

    // Support queries that show all mediums using the medium param.
    // If you specify "*" it results in metaphysics removing the query option
    // making the graphQL queries between all and a subset of mediums the same shape.
    if (gravityOptions.medium === "*" || !gravityOptions.medium) {
      delete gravityOptions.medium
    }

    removeNulls(gravityOptions)

    let loader
    if (requestedPersonalizedAggregation || requestedAuthorizedFilters) {
      if (!filterArtworksAuthenticatedLoader) {
        // TODO: Instead of throwing an error, let's use the unauthenticated loader
        // without the personalized options if they are specified while unauthenticated.
        //
        // throw new Error("You must be logged in to request these params.")

        delete gravityOptions.include_artworks_by_followed_artists
        delete gravityOptions.include_unpublished
        delete gravityOptions.visibility_level
        delete gravityOptions.include_json
        gravityOptions.aggregations = gravityOptions.aggregations.filter(
          (item) => item !== "followed_artists"
        )

        loader = filterArtworksUnauthenticatedLoader
      } else {
        loader = filterArtworksAuthenticatedLoader
      }
    } else {
      // If filtering by sale and filtering/sorting by price,
      // use the uncached loader to avoid stale data.
      const isSortingByPrice = ["-prices", "prices"].includes(
        gravityOptions.sort
      )
      const isFilteringByPrice =
        !!gravityOptions.price_range && gravityOptions.priceRange !== "*-*"
      const isFilteringBySale = !!gravityOptions.sale_id
      if ((isSortingByPrice || isFilteringByPrice) && isFilteringBySale) {
        loader = filterArtworksUncachedLoader
      } else {
        loader = filterArtworksUnauthenticatedLoader
      }
    }

    // If only queried for id, can just return w/o fetching.
    if (!includesFieldsOtherThanSelectionSet(info, ["id"])) {
      return { hits: null, aggregations: null, gravityOptions }
    }

    const { aggregations, hits } = await loader(gravityOptions)
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
