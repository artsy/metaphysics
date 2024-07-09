import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLInputObjectType,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import {
  connectionWithCursorInfo,
  createPageCursors,
  emptyConnection,
} from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { IDFields } from "../object_identification"
import GraphQLJSON from "graphql-type-json"
import {
  SearchCriteriaFields,
  SearchCriteriaLabel,
  resolveSearchCriteriaLabels,
} from "../previewSavedSearch/searchCriteriaLabel"
import { ArtistType, artistConnection } from "../artist"
import { pageable } from "relay-cursor-paging"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { connectionFromArray } from "graphql-relay"
import { generateDisplayName } from "../previewSavedSearch/generateDisplayName"

type GravityAlertSettingsJSON = {
  name: string
  email: boolean
  push: boolean
  details: string
  frequency: string
}

export const AlertSettingsFrequencyType = new GraphQLEnumType({
  name: "AlertSettingsFrequency",
  values: {
    DAILY: { value: "daily" },
    INSTANT: { value: "instant" },
  },
})

const AlertSettingsType = new GraphQLObjectType<
  GravityAlertSettingsJSON,
  ResolverContext
>({
  name: "AlertSettings",
  fields: {
    name: {
      type: GraphQLString,
    },
    email: {
      type: GraphQLNonNull(GraphQLBoolean),
    },
    push: {
      type: GraphQLNonNull(GraphQLBoolean),
    },
    details: {
      type: GraphQLString,
    },
    frequency: {
      type: AlertSettingsFrequencyType,
    },
  },
})

// Fields the `createAlert` and `updateAlert` mutations have in common.
// Notably, `artistIDs` isn't included as it's required for `createAlert`,
// but not for `updateAlert`.
export const AlertInputFields = {
  acquireable: {
    type: GraphQLBoolean,
  },
  additionalGeneIDs: {
    type: new GraphQLList(GraphQLString),
  },
  artistSeriesIDs: {
    type: new GraphQLList(GraphQLString),
  },
  atAuction: {
    type: GraphQLBoolean,
  },
  attributionClass: {
    type: new GraphQLList(GraphQLString),
  },
  colors: {
    type: new GraphQLList(GraphQLString),
  },
  dimensionRange: {
    type: GraphQLString,
  },
  height: {
    type: GraphQLString,
  },
  inquireableOnly: {
    type: GraphQLBoolean,
  },
  keyword: {
    type: GraphQLString,
  },
  locationCities: {
    type: new GraphQLList(GraphQLString),
  },
  majorPeriods: {
    type: new GraphQLList(GraphQLString),
  },
  materialsTerms: {
    type: new GraphQLList(GraphQLString),
  },
  offerable: {
    type: GraphQLBoolean,
  },
  partnerIDs: {
    type: new GraphQLList(GraphQLString),
  },
  priceRange: {
    type: GraphQLString,
  },
  settings: {
    type: new GraphQLInputObjectType({
      name: "AlertSettingsInput",
      fields: {
        name: {
          type: GraphQLString,
        },
        email: {
          type: GraphQLBoolean,
        },
        push: {
          type: GraphQLBoolean,
        },
        details: {
          type: GraphQLString,
        },
        frequency: {
          type: AlertSettingsFrequencyType,
        },
      },
    }),
  },
  sizes: {
    type: new GraphQLList(GraphQLString),
  },
  width: {
    type: GraphQLString,
  },
}

type GravitySearchCriteriaJSON = {
  id: string
  price_range: string
  formatted_price_range: string
  materials_terms: string[]
  attribution_class: string[]
  additional_gene_names: string[]
  summary: JSON
  count_30d?: number // only present when data is returned from ElasticSearch
  count_7d?: number // only present when data is returned from ElasticSearch
  artist_ids: string[]
  artist_series_ids: string[]
  partner_ids: string[]
  location_cities: string[]
  major_periods: string[]
  additional_gene_ids: string[]
  price_array: number[]
  dimension_range: string
  for_sale: boolean
  inquireable_only: boolean
  at_auction: boolean
  offerable: boolean
  search_criteria_id: string
}

export const AlertType = new GraphQLObjectType<
  GravitySearchCriteriaJSON,
  ResolverContext
>({
  name: "Alert",
  fields: () => {
    const {
      filterArtworksConnectionWithParams,
    } = require("../filterArtworksConnection")

    return {
      ...IDFields,
      acquireable: {
        type: GraphQLBoolean,
      },
      additionalGeneIDs: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ additional_gene_ids }) => additional_gene_ids,
      },
      additionalGeneNames: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ additional_gene_names }) => additional_gene_names,
      },
      artistIDs: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ artist_ids }) => artist_ids,
      },
      artists: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(ArtistType))
        ),
        resolve: async ({ artist_ids }, _args, { artistsLoader }) => {
          if (!artist_ids) return []

          const { body } = await artistsLoader({ ids: artist_ids })
          return body ?? []
        },
      },
      artistsConnection: {
        type: new GraphQLNonNull(artistConnection.connectionType),
        args: pageable(),
        resolve: async ({ artist_ids }, args, { artistsLoader }) => {
          if (!artist_ids || artist_ids.length === 0) return emptyConnection

          const { page, size } = convertConnectionArgsToGravityArgs(args)
          const { body } = await artistsLoader({ ids: artist_ids })

          const totalCount = body.length
          return {
            totalCount,
            pageCursors: createPageCursors({ page, size }, totalCount),
            ...connectionFromArray(body, args),
          }
        },
      },
      artworksConnection: filterArtworksConnectionWithParams((args) => {
        const filterArtworksArgs = {
          acquireable: args.acquireable,
          additional_gene_ids: args.additional_gene_ids,
          artist_ids: args.artist_ids,
          artist_series_ids: args.artist_series_ids,
          at_auction: args.at_auction,
          attribution_class: args.attribution_class,
          colors: args.colors,
          dimension_range: args.dimension_range,
          height: args.height,
          inquireable_only: args.inquireable_only,
          keyword: args.keyword,
          location_cities: args.location_cities,
          major_periods: args.major_periods,
          materials_terms: args.materials_terms,
          offerable: args.offerable,
          partner_ids: args.partner_ids,
          price_range: args.price_range,
          sizes: args.sizes,
          width: args.width,
          for_sale: args.for_sale,
        }

        return filterArtworksArgs
      }),
      artistSeriesIDs: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ artist_series_ids }) => artist_series_ids,
      },
      atAuction: {
        type: GraphQLBoolean,
        resolve: ({ at_auction }) => at_auction,
      },
      attributionClass: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ attribution_class }) => attribution_class,
      },
      colors: {
        type: new GraphQLList(GraphQLString),
      },
      dimensionRange: {
        type: GraphQLString,
        resolve: ({ dimension_range }) => dimension_range,
      },
      displayName: {
        type: new GraphQLNonNull(GraphQLString),
        args: {
          only: {
            type: new GraphQLList(SearchCriteriaFields),
            description: "An array of fields to include in the display name.",
          },
          except: {
            type: new GraphQLList(SearchCriteriaFields),
            description: "An array of fields to exclude from the display name.",
          },
        },
        resolve: generateDisplayName,
        description:
          "A suggestion for a name that describes a set of saved search criteria in a conventional format",
      },
      forSale: {
        type: GraphQLBoolean,
        resolve: ({ for_sale }) => for_sale,
      },
      formattedPriceRange: {
        type: GraphQLString,
        resolve: ({ formatted_price_range }) => formatted_price_range,
      },
      height: {
        type: GraphQLString,
      },
      href: {
        type: GraphQLString,
      },
      inquireableOnly: {
        type: GraphQLBoolean,
        resolve: ({ inquireable_only }) => inquireable_only,
      },
      keyword: {
        type: GraphQLString,
      },
      labels: {
        type: new GraphQLNonNull(
          new GraphQLList(new GraphQLNonNull(SearchCriteriaLabel))
        ),
        args: {
          only: {
            type: new GraphQLList(SearchCriteriaFields),
            description: "An array of fields to include in labels array.",
          },
          except: {
            type: new GraphQLList(SearchCriteriaFields),
            description: "An array of fields to exclude from labels array.",
          },
        },
        resolve: resolveSearchCriteriaLabels,
        description:
          "Human-friendly labels that are added by Metaphysics to the upstream SearchCriteria type coming from Gravity",
      },
      locationCities: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ location_cities }) => location_cities,
      },
      majorPeriods: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ major_periods }) => major_periods,
      },
      materialsTerms: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ materials_terms }) => materials_terms,
      },
      offerable: {
        type: GraphQLBoolean,
      },
      partnerIDs: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ partner_ids }) => partner_ids,
      },
      priceArray: {
        type: new GraphQLList(GraphQLInt),
        resolve: ({ price_array }) => price_array,
      },
      priceRange: {
        type: GraphQLString,
        resolve: ({ price_range }) => price_range,
      },
      searchCriteriaID: {
        type: new GraphQLNonNull(GraphQLString),
        resolve: ({ search_criteria_id }) => search_criteria_id,
      },
      sizes: {
        type: new GraphQLList(GraphQLString),
      },
      // Summary is a generic/dynamic JSON object.
      // TODO: This should probably be structured.
      summary: {
        type: GraphQLJSON,
      },
      width: {
        type: GraphQLString,
      },
      settings: {
        type: new GraphQLNonNull(AlertSettingsType),
      },

      // Below fields are injected in the JSON when the alert data is being returned
      // from ElasticSearch - currently when queried from the following places:
      //
      // - `alertsConnection` under `Artist`
      // - `alertsSummaryArtistsConnection` under `Partner`.
      totalUserSearchCriteriaCount: {
        type: GraphQLInt,
        resolve: ({ count_30d }) => count_30d,
      },
      hasRecentlyEnabledUserSearchCriteria: {
        type: GraphQLBoolean,
        resolve: ({ count_7d }) => count_7d && count_7d > 0,
      },
    }
  },
})

const AlertsEdgeFields = {
  counts: {
    type: new GraphQLObjectType({
      name: "AlertsCounts",
      fields: {
        totalUserSearchCriteriaCount: {
          type: GraphQLInt,
          resolve: ({ count_30d }) => count_30d,
        },
      },
    }),
    resolve: (x) => x,
  },
  isRecentlyEnabled: {
    type: GraphQLBoolean,
    resolve: ({ count_7d }) => count_7d > 0,
  },
}

export const AlertsConnectionSortEnum = new GraphQLEnumType({
  name: "AlertsConnectionSortEnum",
  values: {
    NAME_ASC: {
      value: "name",
    },

    ENABLED_AT_DESC: {
      value: "-enabled_at",
    },
  },
})

export const resolveAlertFromJSON = (alert) => {
  const { search_criteria, id, ...rest } = alert
  return {
    ...search_criteria,
    id, // Inject the ID from the `UserSearchCriteria` object
    search_criteria_id: search_criteria.id,
    settings: rest,
  }
}

export const AlertsConnectionType = connectionWithCursorInfo({
  name: "Alert",
  nodeType: AlertType,
  edgeFields: AlertsEdgeFields,
}).connectionType

export const AlertsSummaryFields = {
  topHit: {
    type: AlertType,
    resolve: ({ top_hit }) => top_hit,
  },
  isRecentlyEnabled: {
    type: GraphQLBoolean,
    resolve: ({ total_user_search_criteria_enabled_within_last_7d }) =>
      total_user_search_criteria_enabled_within_last_7d > 0,
  },
  counts: {
    type: new GraphQLObjectType({
      name: "AlertsSummaryCounts",
      fields: {
        totalUserSearchCriteriaCount: {
          type: GraphQLInt,
          resolve: ({ total_user_search_criteria_count }) =>
            total_user_search_criteria_count,
        },
        totalWithAdditionalGeneIdsCount: {
          type: GraphQLInt,
          resolve: ({ total_with_additional_gene_ids_count }) =>
            total_with_additional_gene_ids_count,
        },
        totalWithAttributionClassCount: {
          type: GraphQLInt,
          resolve: ({ total_with_attribution_class_count }) =>
            total_with_attribution_class_count,
        },
        totalWithPriceRangeCount: {
          type: GraphQLInt,
          resolve: ({ total_with_price_range_count }) =>
            total_with_price_range_count,
        },
        totalWithOtherMetadataCount: {
          type: GraphQLInt,
          resolve: ({ total_with_other_metadata_count }) =>
            total_with_other_metadata_count,
        },
      },
    }),
    resolve: (resp) => resp,
  },
}

export const PartnerAlertsFields = {
  id: { type: GraphQLString },
  searchCriteriaId: {
    type: GraphQLString,
    resolve: ({ search_criteria_id }) => search_criteria_id,
  },
  partnerId: {
    type: GraphQLString,
    resolve: ({ partner_id }) => partner_id,
  },
  score: { type: GraphQLString },
  matchedAt: {
    type: GraphQLString,
    resolve: ({ matched_at }) => matched_at,
  },
  alert: {
    type: AlertType,
    resolve: ({ search_criteria }) => search_criteria,
  },
  userIds: {
    type: new GraphQLList(GraphQLString),
    resolve: ({ user_ids }) => user_ids,
  },
  artistId: {
    type: GraphQLString,
    resolve: ({ artist_id }) => artist_id,
  },
}
