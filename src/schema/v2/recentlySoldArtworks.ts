import { GraphQLFieldConfig, GraphQLObjectType, GraphQLString } from "graphql"
import { connectionDefinitions, connectionFromArray } from "graphql-relay"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { createPageCursors } from "schema/v1/fields/pagination"
import { ResolverContext } from "types/graphql"
import { ArtworkType } from "./artwork"

const RecentlySoldArtworkType = new GraphQLObjectType<any, ResolverContext>({
  name: "RecentlySoldArtworkType",
  fields: {
    lowEstimateUSD: {
      type: GraphQLString,
    },
    highEstimateUSD: {
      type: GraphQLString,
    },
    priceRealized: {
      type: GraphQLString,
    },
    artwork: {
      type: ArtworkType,
    },
  },
})

export const RecentlySoldArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  args: pageable({}),
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

const recentlySoldArtworks = [
  {
    artworkId: "622bdb23c6df37000d516d7b",
    lowEstimateUSD: "150,000",
    highEstimateUSD: "200,000",
    priceRealized: "350,000",
  },
  {
    artworkId: "622bdb2806f9df000e059942",
    lowEstimateUSD: "80,000",
    highEstimateUSD: "120,000",
    priceRealized: "250,000",
  },
  {
    artworkId: "622bdb274df6eb000c53769e",
    lowEstimateUSD: "50,000",
    highEstimateUSD: "70,000",
    priceRealized: "100,000",
  },
  {
    artworkId: "622bdb2569467d000ed08a11",
    lowEstimateUSD: "30,000",
    highEstimateUSD: "50,000",
    priceRealized: "100,000",
  },
  {
    artworkId: "622bdb24467f69000df2f005",
    lowEstimateUSD: "70,000",
    highEstimateUSD: "90,000",
    priceRealized: "75,000",
  },
  {
    artworkId: "622bdb2c0c7f5e000e949391",
    lowEstimateUSD: "50,000",
    highEstimateUSD: "70,000",
    priceRealized: "62,500",
  },
  {
    artworkId: "622bdb23a72a6d000bc96aff",
    lowEstimateUSD: "15,000",
    highEstimateUSD: "20,000",
    priceRealized: "57,500",
  },
  {
    artworkId: "622bdb28467f69000df2f014",
    lowEstimateUSD: "25,000",
    highEstimateUSD: "35,000",
    priceRealized: "55,000",
  },
  {
    artworkId: "622bdb19e1edd3000be22b7e",
    lowEstimateUSD: "50,000",
    highEstimateUSD: "70,000",
    priceRealized: "52,500",
  },
  {
    artworkId: "622bdb24cd3ca4000b47b9b9",
    lowEstimateUSD: "3,000",
    highEstimateUSD: "5,000",
    priceRealized: "23,750",
  },
  {
    artworkId: "622bdb2706f9df000c2fcfed",
    lowEstimateUSD: "20,000",
    highEstimateUSD: "30,000",
    priceRealized: "40,000",
  },
  {
    artworkId: "622bdb23135469000deebe69",
    lowEstimateUSD: "3,000",
    highEstimateUSD: "5,000",
    priceRealized: "17,500",
  },
  {
    artworkId: "622bdb27c6df37000cd91cb8",
    lowEstimateUSD: "15,000",
    highEstimateUSD: "20,000",
    priceRealized: "25,000",
  },
  {
    artworkId: "622bdb197c3db2000b438c26",
    lowEstimateUSD: "20,000",
    highEstimateUSD: "30,000",
    priceRealized: "25,000",
  },
  {
    artworkId: "622bdb245463fe000d6724ac",
    lowEstimateUSD: "4,000",
    highEstimateUSD: "6,000",
    priceRealized: "11,250",
  },
  {
    artworkId: "622bdb1bb18a5e000da28498",
    lowEstimateUSD: "1,500",
    highEstimateUSD: "2,500",
    priceRealized: "7,500",
  },
  {
    artworkId: "622bdb198d18ad000e1f998e",
    lowEstimateUSD: "10,000",
    highEstimateUSD: "15,000",
    priceRealized: "15,000",
  },
  {
    artworkId: "622bdb2e69467d000ed08a23",
    lowEstimateUSD: "3,000",
    highEstimateUSD: "5,000",
    priceRealized: "6,875",
  },
  {
    artworkId: "622bdb37467f69000c73ad48",
    lowEstimateUSD: "4,000",
    highEstimateUSD: "6,000",
    priceRealized: "5,000",
  },
  {
    artworkId: "622bdb317c3db2000dd2616b",
    lowEstimateUSD: "1,500",
    highEstimateUSD: "2,500",
    priceRealized: "2,000",
  },
]
