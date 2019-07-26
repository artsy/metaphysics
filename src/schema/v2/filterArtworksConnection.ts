import Artwork from "./artwork"
import {
  computeTotalPages,
  createPageCursors,
  pageToCursor,
} from "./fields/pagination"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs, removeNulls } from "lib/helpers"
import {
  connectionFromArraySlice,
  connectionDefinitions,
  toGlobalId,
} from "graphql-relay"
import { GraphQLFieldConfig, GraphQLNonNull, GraphQLID } from "graphql"

import { ResolverContext } from "types/graphql"
import { includesFieldsOtherThanSelectionSet } from "lib/hasFieldSelection"
import { FilterArtworksFields, filterArtworksArgs } from "./filter_artworks"
import { NodeInterface } from "./object_identification"

// The connection fields here match the original implementation's,
// except without `artworksConnection`.
const connectionFields = () => {
  const { artworksConnection, ...connectionFields } = FilterArtworksFields()
  return connectionFields
}

const filterArtworksConnectionType = connectionDefinitions({
  name: "FilterArtworks",
  nodeType: Artwork.type,
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
  },
  interfaces: [NodeInterface],
}).connectionType

const filterArtworksConnectionTypeFactory = (
  mapRootToFilterParams
): GraphQLFieldConfig<any, ResolverContext> => ({
  type: filterArtworksConnectionType,
  description: "Artworks Elastic Search results",
  args: pageable(filterArtworksArgs),
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
      convertConnectionArgsToGravityArgs(options),
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

    // If only queried for id, can just return w/o fetching.
    if (!includesFieldsOtherThanSelectionSet(info, ["id"])) {
      return { hits: null, aggregations: null, gravityOptions }
    }

    return loader(gravityOptions).then(({ aggregations, hits }) => {
      if (!aggregations || !aggregations.total) {
        throw new Error("This query must contain the total aggregation")
      }

      const totalPages = computeTotalPages(
        aggregations.total.value,
        gravityOptions.size
      )

      const connection = connectionFromArraySlice(hits, gravityOptions, {
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

export default function filterArtworksConnection(primaryKey?: string) {
  return filterArtworksConnectionTypeFactory(
    primaryKey ? ({ id }) => ({ [primaryKey]: id }) : () => ({})
  )
}

export function filterArtworksConnectionWithParams(mapRootToFilterParams) {
  return filterArtworksConnectionTypeFactory(mapRootToFilterParams)
}
