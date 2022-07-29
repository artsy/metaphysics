import { GraphQLFieldConfig, GraphQLObjectType } from "graphql"
import { connectionDefinitions, connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { priceDisplayText } from "lib/moneyHelpers"
import { pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v2/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "./artwork"
import { Money } from "./fields/money"

const moneyResolver = (cents, currency) => {
  if (!cents) return null
  return {
    cents,
    currency,
    display: priceDisplayText(cents, currency, ""),
  }
}

const RecentlySoldArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "RecentlySoldArtworkType",
  fields: {
    lowEstimate: {
      type: Money,
      resolve: ({ lowEstimateCents, currency }) =>
        moneyResolver(lowEstimateCents, currency),
    },
    highEstimate: {
      type: Money,
      resolve: ({ highEstimateCents, currency }) =>
        moneyResolver(highEstimateCents, currency),
    },
    priceRealized: {
      type: Money,
      resolve: ({ priceRealizedCents, currency }) =>
        moneyResolver(priceRealizedCents, currency),
    },
    artwork: {
      type: ArtworkType,
    },
  },
})

export const RecentlySoldArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  args: pageable({}),
  description: "Static set of recently sold artworks for the SWA landing page",
  type: connectionDefinitions({ nodeType: RecentlySoldArtworkType })
    .connectionType,
  resolve: async (_, options, { artworksLoader }) => {
    const { page, size } = convertConnectionArgsToGravityArgs(options)
    const totalCount = recentlySoldArtworks.length
    const ids = recentlySoldArtworks.map(({ artworkId }) => artworkId)

    const response = await artworksLoader({ ids })

    const result = response.map((artwork) => {
      const a = recentlySoldArtworks.find((a) => a.artworkId === artwork._id)

      return { ...a, artwork }
    })

    return {
      totalCount,
      pageCursors: createPageCursors({ page, size }, totalCount),
      ...connectionFromArray(result, options),
    }
  },
}

export const recentlySoldArtworks = [
  {
    artworkId: "622bdb23c6df37000d516d7b",
    currency: "USD",
    lowEstimateCents: 15000000,
    highEstimateCents: 20000000,
    priceRealizedCents: 35000000,
  },
  {
    artworkId: "622bdb2806f9df000e059942",
    currency: "USD",
    lowEstimateCents: 8000000,
    highEstimateCents: 12000000,
    priceRealizedCents: 25000000,
  },
  {
    artworkId: "622bdb274df6eb000c53769e",
    currency: "USD",
    lowEstimateCents: 5000000,
    highEstimateCents: 7000000,
    priceRealizedCents: 10000000,
  },
  {
    artworkId: "622bdb2569467d000ed08a11",
    currency: "USD",
    lowEstimateCents: 3000000,
    highEstimateCents: 5000000,
    priceRealizedCents: 10000000,
  },
  {
    artworkId: "622bdb24467f69000df2f005",
    currency: "USD",
    lowEstimateCents: 7000000,
    highEstimateCents: 9000000,
    priceRealizedCents: 7500000,
  },
  {
    artworkId: "622bdb2c0c7f5e000e949391",
    currency: "USD",
    lowEstimateCents: 5000000,
    highEstimateCents: 7000000,
    priceRealizedCents: 6250000,
  },
  {
    artworkId: "622bdb23a72a6d000bc96aff",
    currency: "USD",
    lowEstimateCents: 1500000,
    highEstimateCents: 2000000,
    priceRealizedCents: 5750000,
  },
  {
    artworkId: "622bdb28467f69000df2f014",
    currency: "USD",
    lowEstimateCents: 2500000,
    highEstimateCents: 3500000,
    priceRealizedCents: 5500000,
  },
  {
    artworkId: "622bdb19e1edd3000be22b7e",
    currency: "USD",
    lowEstimateCents: 5000000,
    highEstimateCents: 7000000,
    priceRealizedCents: 5250000,
  },
  {
    artworkId: "622bdb24cd3ca4000b47b9b9",
    currency: "USD",
    lowEstimateCents: 300000,
    highEstimateCents: 500000,
    priceRealizedCents: 2375000,
  },
  {
    artworkId: "622bdb2706f9df000c2fcfed",
    currency: "USD",
    lowEstimateCents: 2000000,
    highEstimateCents: 3000000,
    priceRealizedCents: 4000000,
  },
  {
    artworkId: "622bdb23135469000deebe69",
    currency: "USD",
    lowEstimateCents: 300000,
    highEstimateCents: 500000,
    priceRealizedCents: 1750000,
  },
  {
    artworkId: "622bdb27c6df37000cd91cb8",
    currency: "USD",
    lowEstimateCents: 1500000,
    highEstimateCents: 2000000,
    priceRealizedCents: 2500000,
  },
  {
    artworkId: "622bdb197c3db2000b438c26",
    currency: "USD",
    lowEstimateCents: 2000000,
    highEstimateCents: 3000000,
    priceRealizedCents: 2500000,
  },
  {
    artworkId: "622bdb245463fe000d6724ac",
    currency: "USD",
    lowEstimateCents: 400000,
    highEstimateCents: 600000,
    priceRealizedCents: 1125000,
  },
  {
    artworkId: "622bdb1bb18a5e000da28498",
    currency: "USD",
    lowEstimateCents: 150000,
    highEstimateCents: 250000,
    priceRealizedCents: 750000,
  },
  {
    artworkId: "622bdb198d18ad000e1f998e",
    currency: "USD",
    lowEstimateCents: 1000000,
    highEstimateCents: 1500000,
    priceRealizedCents: 1500000,
  },
  {
    artworkId: "622bdb2e69467d000ed08a23",
    currency: "USD",
    lowEstimateCents: 300000,
    highEstimateCents: 500000,
    priceRealizedCents: 687500,
  },
  {
    artworkId: "622bdb37467f69000c73ad48",
    currency: "USD",
    lowEstimateCents: 400000,
    highEstimateCents: 600000,
    priceRealizedCents: 500000,
  },
  {
    artworkId: "622bdb317c3db2000dd2616b",
    currency: "USD",
    lowEstimateCents: 150000,
    highEstimateCents: 250000,
    priceRealizedCents: 200000,
  },
]
