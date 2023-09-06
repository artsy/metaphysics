import {
  GraphQLBoolean,
  GraphQLEnumType,
  GraphQLFieldConfig,
  GraphQLObjectType,
} from "graphql"
import { getRecentlySoldArtworksConnection } from "schema/v2/types/targetSupply/recentlySoldArtworksConnection"
import { TargetSupplyMicrofunnelMetadata } from "schema/v2/types/targetSupply/targetSupplyMicrofunnelMetadata"
import { ResolverContext } from "types/graphql"
import { getArtistMicrofunnelMetadata } from "./utils/getMicrofunnelData"

const ARTIST_TARGET_SUPPLY_PRIORITIES = {
  P1: { value: 1 },
  P2: { value: 2 },
} as const

export type ArtistTargetSupplyPriority = typeof ARTIST_TARGET_SUPPLY_PRIORITIES[keyof typeof ARTIST_TARGET_SUPPLY_PRIORITIES]["value"]

export const ArtistTargetSupplyPriorityEnum = new GraphQLEnumType({
  name: "ArtistTargetSupplyPriorityEnum",
  values: ARTIST_TARGET_SUPPLY_PRIORITIES,
})

const ARTIST_TARGET_SUPPLY_TYPES = {
  BLUE_CHIP: { value: "Blue-Chip" },
  CRITICALLY_ACCLAIMED: { value: "Critically-Acclaimed" },
  NEW_AND_NOTEWORTHY: { value: "New & Noteworthy" },
  STREET_AND_URBAN: { value: "Street & Urban" },
  TRENDING_EMERGING: { value: "Trending Emerging" },
  ULTRA_HIGH_DEMAND: { value: "Ultra High Demand" },
} as const

export type ArtistTargetSupplyType = typeof ARTIST_TARGET_SUPPLY_TYPES[keyof typeof ARTIST_TARGET_SUPPLY_TYPES]["value"]

export const ArtistTargetSupplyTypeEnum = new GraphQLEnumType({
  name: "ArtistTargetSupplyTypeEnum",
  values: ARTIST_TARGET_SUPPLY_TYPES,
})

const ArtistTargetSupplyType = new GraphQLObjectType<any, ResolverContext>({
  name: "ArtistTargetSupply",
  fields: {
    priority: {
      type: ArtistTargetSupplyPriorityEnum,
      resolve: (artist) => artist.target_supply_priority,
    },
    type: {
      type: ArtistTargetSupplyTypeEnum,
      resolve: (artist) => artist.target_supply_type,
    },
    isTargetSupply: {
      description: "True if artist is in target supply list.",
      type: GraphQLBoolean,
      resolve: (artist) => artist.target_supply,
    },
    isP1: {
      deprecationReason: 'Use "priority" field instead.',
      description: "True if an artist is a P1 artist.",
      type: GraphQLBoolean,
      resolve: (artist) => artist.target_supply_priority === 1,
    },
    isInMicrofunnel: {
      description: "True if an artist is in the microfunnel list.",
      type: GraphQLBoolean,
      resolve: (artist) =>
        Boolean(getArtistMicrofunnelMetadata(`/artist/${artist.id}`)),
    },
    microfunnel: {
      type: new GraphQLObjectType<any, ResolverContext>({
        name: "ArtistTargetSupplyMicrofunnel",
        fields: () => ({
          /**
           * This field is resolved by parsing static CSVtoJSON data.
           * @see src/schema/v2/artist/targetSupply/utils/getMicrofunnelData.ts
           */
          metadata: {
            type: TargetSupplyMicrofunnelMetadata,
          },

          artworksConnection: getRecentlySoldArtworksConnection(),
        }),
      }),
      resolve: (artist) => {
        const microfunnelData = getArtistMicrofunnelMetadata(
          `/artist/${artist.id}`
        ) // pass in artist href, as thats how CSV data is formatted
        return microfunnelData
      },
    },
  },
})

export const ArtistTargetSupply: GraphQLFieldConfig<void, ResolverContext> = {
  type: ArtistTargetSupplyType,
  resolve: (artist) => artist,
}
