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
import {
  getArtistInsights,
  enrichWithArtistCareerHighlights,
} from "../artist/helpers"
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
          case "REVIEWED":
            reviewedCount += 1
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
        if (artist.solo_shows_count) soloShowCount += 1
        if (artist.group_shows_count) groupShowCount += 1
        if (artist.collected_by_institutions_count) collectedCount += 1

        getArtistInsights(artist).forEach((insight) => {
          if (insight.kind) countInsights(insight)
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
      const {
        collectionArtistsLoader,
        artistCareerHighlightsLoader,
        userID,
      } = context

      const { body: artists } = await collectionArtistsLoader("my-collection", {
        size: MAX_ARTISTS,
        user_id: userID,
        all: true,
      })

      const insights: ReturnType<typeof getArtistInsights> = []

      // Fetch career highlights based on insight kind for each artist
      const artistHighlightsPromises = artists.map(async (artist) => {
        await enrichWithArtistCareerHighlights(
          [args.kind],
          artist,
          artistCareerHighlightsLoader
        )
      })

      await Promise.all(artistHighlightsPromises)

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
    deprecationReason: "Please use `me.userInterestsConnection` instead",
    type: artistConnection.connectionType,
    args: pageable({
      sort: ArtistSorts,
      page: { type: GraphQLInt },
      size: { type: GraphQLInt },
      includePersonalArtists: {
        type: GraphQLBoolean,
        defaultValue: false,
        description: "Include artists that have been created by the user.",
      },
    }),
    resolve: async (_root, args, context) => {
      const { collectionArtistsLoader, userID } = context

      if (!collectionArtistsLoader) return

      const { page, offset, size, sort } = convertConnectionArgsToGravityArgs(
        args
      )

      // TODO: Remove this once all clients pass includePersonalArtists correctly
      // This is a hack we need to return the correct results for older cleints that don't send the param `includePersonalArtists`.
      // With this solution we are defaulting to true if the query comes from the My Collection artwork form (which is the only query that passes `first: 100`)
      const SIZE_ARG_VALUE_FOR_MY_COLLECTION_ARTWORK_FORM = 100
      const includePersonalArtists =
        args.first === SIZE_ARG_VALUE_FOR_MY_COLLECTION_ARTWORK_FORM
          ? true
          : args.includePersonalArtists

      const { body, headers } = await collectionArtistsLoader("my-collection", {
        size,
        page,
        sort,
        total_count: true,
        user_id: userID,
        include_personal_artists: includePersonalArtists,
      })
      const totalCount = parseInt(headers["x-total-count"] || "0", 10)

      // Augment the Gravity response with an `artworksCount` field
      // relevant to this connection.
      const artists = body.map((artist) => {
        return {
          ...artist,
          artworksCount: artist.artworks_count_within_collection,
        }
      })

      return paginationResolver({
        totalCount,
        offset,
        size,
        page,
        body: artists,
        args,
        resolveNode: (artist) => artist,
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
  resolve: async (_parent, _options, { userID, collectionLoader }) => {
    if (!userID) {
      return null
    }

    const collectionResponse = await collectionLoader("my-collection", {
      user_id: userID,
      private: true,
    })

    return collectionResponse
  },
}
