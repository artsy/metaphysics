import {
  GraphQLBoolean,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLString,
} from "graphql"
import { convertConnectionArgsToGravityArgs } from "lib/helpers"
import { pageable } from "relay-cursor-paging"
import { artistConnection } from "schema/v2/artist"
import { ResolverContext } from "types/graphql"
import { getArtistInsights } from "../artist/helpers"
import { ArtistInsight, ArtistInsightKind } from "../artist/insights"
import { paginationResolver } from "../fields/pagination"
import ArtistSorts from "../sorts/artist_sorts"

export const MAX_ARTISTS = 100

const artistInsightsCountType = new GraphQLObjectType({
  name: "ArtistInsightsCount",
  fields: {
    soloShowCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    groupShowCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    collectedCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    reviewedCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    biennialCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
    activeSecondaryMarketCount: {
      type: new GraphQLNonNull(GraphQLInt),
    },
  },
})

export const myCollectionInfoFields = {
  description: {
    type: new GraphQLNonNull(GraphQLString),
  },
  default: {
    type: new GraphQLNonNull(GraphQLBoolean),
  },
  includesPurchasedArtworks: {
    type: new GraphQLNonNull(GraphQLBoolean),
    resolve: (myCollection) => myCollection.includes_purchased_artworks,
  },
  name: {
    type: new GraphQLNonNull(GraphQLString),
  },
  private: {
    type: new GraphQLNonNull(GraphQLBoolean),
  },
  artworksCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ artworks_count }) => artworks_count,
  },
  artistsCount: {
    type: new GraphQLNonNull(GraphQLInt),
    resolve: ({ artists_count }) => artists_count,
  },
  artistInsightsCount: {
    type: artistInsightsCountType,
    resolve: async (_root, _args, context) => {
      const { collectionArtistsLoader, userID } = context

      if (!collectionArtistsLoader) return

      const { body: artists } = await collectionArtistsLoader("my-collection", {
        size: MAX_ARTISTS,
        user_id: userID,
        all: true,
      })

      let soloShowCount = 0
      let groupShowCount = 0
      let collectedCount = 0
      let reviewedCount = 0
      let biennialCount = 0
      let activeSecondaryMarketCount = 0

      const countInsights = (
        insight: ReturnType<typeof getArtistInsights>[0]
      ) => {
        switch (insight.kind) {
          case "SOLO_SHOW":
            soloShowCount += 1
            break
          case "GROUP_SHOW":
            groupShowCount += 1
            break
          case "REVIEWED":
            reviewedCount += 1
            break
          case "COLLECTED":
            collectedCount += 1
            break
          case "BIENNIAL":
            biennialCount += 1
            break
          case "ACTIVE_SECONDARY_MARKET":
            activeSecondaryMarketCount += 1
            break
        }
      }

      artists.forEach((artist) => {
        getArtistInsights(artist).forEach((insight) => {
          if (!!insight.kind) countInsights(insight)
        })
      })

      return {
        soloShowCount,
        groupShowCount,
        collectedCount,
        reviewedCount,
        biennialCount,
        activeSecondaryMarketCount,
      }
    },
  },
  artistInsights: {
    description: "Insights for all collected artists",
    type: new GraphQLNonNull(
      new GraphQLList(new GraphQLNonNull(ArtistInsight))
    ),
    args: {
      kind: {
        type: ArtistInsightKind,
        description: "The type of insight.",
      },
    },
    resolve: async (_root, args, context) => {
      const { collectionArtistsLoader, userID } = context

      const { body: artists } = await collectionArtistsLoader("my-collection", {
        size: MAX_ARTISTS,
        user_id: userID,
        all: true,
      })

      const insights: ReturnType<typeof getArtistInsights> = []

      artists.map((artist) => {
        getArtistInsights(artist).map((insight) => {
          if (insight.kind === args.kind || !args.kind) insights.push(insight)
        })
      })

      return insights
    },
  },
  collectedArtistsConnection: {
    description: "A connection of artists in the users' collection",
    type: artistConnection.connectionType,
    args: pageable({
      sort: ArtistSorts,
      page: { type: GraphQLInt },
      size: { type: GraphQLInt },
    }),
    resolve: async (_root, args, context) => {
      const { collectionArtistsLoader, userID } = context

      if (!collectionArtistsLoader) return

      const { page, offset, size, sort } = convertConnectionArgsToGravityArgs(
        args
      )

      const { body, headers } = await collectionArtistsLoader("my-collection", {
        size,
        page,
        sort,
        all: true,
        total_count: true,
        user_id: userID,
      })
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      return paginationResolver({
        totalCount,
        offset,
        size,
        page,
        body,
        args,
      })
    },
  },
}

const MyCollectionInfoType = new GraphQLObjectType<any, ResolverContext>({
  name: "MyCollectionInfo",
  fields: myCollectionInfoFields,
})

export const MyCollectionInfo: GraphQLFieldConfig<any, ResolverContext> = {
  type: MyCollectionInfoType,
  description: "Info about the current user's my-collection",
  resolve: async ({ id }, _options, context) => {
    if (!context.collectionLoader) {
      return null
    }

    context.userID = id

    const collectionResponse = await context.collectionLoader("my-collection", {
      user_id: id,
      private: true,
    })

    return collectionResponse
  },
}
