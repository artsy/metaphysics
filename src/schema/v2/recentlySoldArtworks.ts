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

export const recentlySoldArtworks: {
  artworkId: string
  currency: string
  priceRealizedCents: number
  highEstimateCents: number
  lowEstimateCents: number
}[] = [
  {
    artworkId: "6219368ce4ed3d000dc4a7af",
    currency: "USD",
    priceRealizedCents: 2016000,
    highEstimateCents: 300000,
    lowEstimateCents: 200000,
  },
  {
    artworkId: "6296f4bacbf44d000c529c57",
    currency: "USD",
    priceRealizedCents: 4851000,
    highEstimateCents: 2190900,
    lowEstimateCents: 1460600,
  },
  {
    artworkId: "62a0cd9aa67f00000d9a08ca",
    currency: "USD",
    priceRealizedCents: 2400000,
    highEstimateCents: 360000,
    lowEstimateCents: 260000,
  },
  {
    artworkId: "6245c9ab9ece0f000dd6c4a6",
    currency: "USD",
    priceRealizedCents: 8400000,
    highEstimateCents: 3000000,
    lowEstimateCents: 2000000,
  },
  {
    artworkId: "6254bf67e825b4000d997e4b",
    currency: "USD",
    priceRealizedCents: 20160000,
    highEstimateCents: 15000000,
    lowEstimateCents: 10000000,
  },
  {
    artworkId: "61d6f57867697a000da2256a",
    currency: "USD",
    priceRealizedCents: 4464200,
    highEstimateCents: 1634900,
    lowEstimateCents: 1089900,
  },
  {
    artworkId: "622bdb23c6df37000d516d7b",
    currency: "USD",
    priceRealizedCents: 35000000,
    highEstimateCents: 20000000,
    lowEstimateCents: 15000000,
  },
  {
    artworkId: "622bdb2806f9df000e059942",
    currency: "USD",
    priceRealizedCents: 25000000,
    highEstimateCents: 12000000,
    lowEstimateCents: 8000000,
  },
  {
    artworkId: "622bdb2569467d000ed08a11",
    currency: "USD",
    priceRealizedCents: 10000000,
    highEstimateCents: 5000000,
    lowEstimateCents: 3000000,
  },
  {
    artworkId: "622bdb23a72a6d000bc96aff",
    currency: "USD",
    priceRealizedCents: 5750000,
    highEstimateCents: 2000000,
    lowEstimateCents: 1500000,
  },
  {
    artworkId: "622bdb30135469000b8f8669",
    currency: "USD",
    priceRealizedCents: 4750000,
    highEstimateCents: 2000000,
    lowEstimateCents: 1500000,
  },
  {
    artworkId: "622bdb2469467d000ce0e130",
    currency: "USD",
    priceRealizedCents: 4000000,
    highEstimateCents: 1500000,
    lowEstimateCents: 1000000,
  },
  {
    artworkId: "622bdb1c0c7f5e000e949360",
    currency: "USD",
    priceRealizedCents: 3000000,
    highEstimateCents: 800000,
    lowEstimateCents: 600000,
  },
  {
    artworkId: "622bdb24cd3ca4000b47b9b9",
    currency: "USD",
    priceRealizedCents: 2375000,
    highEstimateCents: 500000,
    lowEstimateCents: 300000,
  },
  {
    artworkId: "62a79db6f6e7b6000e30e1dd",
    currency: "USD",
    priceRealizedCents: 11250000,
    highEstimateCents: 3000000,
    lowEstimateCents: 2000000,
  },
  {
    artworkId: "627af23e1d4b1b000b1c2807",
    currency: "USD",
    priceRealizedCents: 11250000,
    highEstimateCents: 5000000,
    lowEstimateCents: 3000000,
  },
]
