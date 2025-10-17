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
  paginationResolver,
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
import { CollectorProfileType } from "../CollectorProfile/collectorProfile"

type GravityAlertSettingsJSON = {
  name: string
  email: boolean
  push: boolean
  details: string
  frequency: string
}

const PartnerCollectorProfilesConnectionType = connectionWithCursorInfo({
  name: "PartnerCollectorProfiles",
  nodeType: CollectorProfileType,
}).connectionType

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
  count_30d?: number // only present when data is returned from search
  count_7d?: number // only present when data is returned from search
  artist_ids: string[]
  artist_series_ids: string[]
  artist_series_names: string[]
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

const DEFAULT_COLLECTOR_PROFILES_BATCH_SIZE = 20

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
      artistSeriesNames: {
        type: new GraphQLList(GraphQLString),
        resolve: ({ artist_series_names }) => artist_series_names,
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
    }
  },
})

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
}).connectionType

export const PartnerAlertsEdgeFields = {
  ...IDFields,
  searchCriteriaID: {
    type: GraphQLString,
    resolve: ({ search_criteria_id }) => search_criteria_id,
  },
  partnerID: {
    type: GraphQLString,
    resolve: ({ partner_id }) => partner_id,
  },
  score: { type: GraphQLString },
  matchedAt: {
    type: GraphQLString,
    resolve: ({ matched_at }) => matched_at,
  },
  userIDs: {
    type: new GraphQLList(GraphQLString),
    resolve: ({ user_ids }) => user_ids,
  },
  artistID: {
    type: GraphQLString,
    resolve: ({ artist_id }) => artist_id,
  },
  collectorProfilesConnection: {
    type: PartnerCollectorProfilesConnectionType,
    args: pageable({
      page: {
        type: GraphQLInt,
      },
      size: {
        type: GraphQLInt,
      },
    }),
    resolve: async (parent, args, { partnerCollectorProfilesLoader }) => {
      if (!partnerCollectorProfilesLoader) return null

      const { page, size, offset } = convertConnectionArgsToGravityArgs(args)

      const { partner_id, user_ids } = parent
      if (!partner_id || !user_ids) {
        throw new Error(
          "partnerId or userIds is undefined in the parent object"
        )
      }

      // Make API call to fetch the first X collector profile records
      const first = args.first ?? DEFAULT_COLLECTOR_PROFILES_BATCH_SIZE
      const slicedUserIds = parent.user_ids.slice(0, first)

      type GravityArgs = {
        page: number
        size: number
        offset: number
        total_count: boolean
        partner_id: string
        user_ids: string[]
      }

      const gravityArgs: GravityArgs = {
        page,
        size,
        offset,
        total_count: true,
        partner_id: parent.partner_id,
        user_ids: slicedUserIds,
      }

      const { body } = await partnerCollectorProfilesLoader(gravityArgs)

      const collectorProfiles = body.flatMap((item) =>
        item.collector_profile ? [item.collector_profile].flat() : []
      )

      const totalCount = parent.user_ids.length

      return paginationResolver({
        totalCount,
        offset,
        page,
        size,
        body: collectorProfiles,
        args,
      })
    },
  },
}
