import {
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLBoolean,
  GraphQLList,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { sampleSize, uniqBy } from "lodash"
import {
  insertSampleCuratedWorks,
  getUserFilterList,
  getCuratedArtworksQuery,
  getNearObjectQuery,
  getUser,
  getUserCreationBody,
  getUserQuery,
  getArtworkIds,
  getFilteredIdList,
} from "lib/infiniteDiscovery/weaviate"
import { getInitialArtworksSample } from "lib/infiniteDiscovery/getInitialArtworksSample"
import { calculateMeanArtworksVector } from "lib/infiniteDiscovery/calculateMeanArtworksVector"
import { findSimilarArtworks } from "lib/infiniteDiscovery/findSimilarArtworks"

export const DiscoverArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  args: pageable({
    userId: { type: GraphQLString },
    limit: { type: GraphQLInt },
    offset: { type: GraphQLInt },
    certainty: { type: GraphQLFloat },
    sort: {
      type: new GraphQLEnumType({
        name: "DiscoverArtworksSort",
        values: {
          CERTAINTY_ASC: {
            value: "certainty",
            description:
              "Sort by certainty ascending. High certainty means the artwork is more likely to be recommended.",
          },
          CERTAINTY_DESC: {
            value: "-certainty",
            description:
              "Sort by certainty descending. High certainty means the artwork is more likely to be recommended.",
          },
        },
      }),
    },
    useOpenSearch: { type: GraphQLBoolean, defaultValue: false },
    excludeArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "(Only for when useOpenSearch is true) Exclude these artworks from the response",
    },
    mltFields: {
      type: new GraphQLList(GraphQLString),
      description:
        "(Only for when useOpenSearch is true) These fields are used to calculate the More Like This query",
      defaultValue: ["genes", "materials", "tags", "medium"],
    },
    likedArtworkIds: {
      type: new GraphQLList(GraphQLString),
      description:
        "(Only for when useOpenSearch is true) These artworks are used to calculate the taste profile vector. Such artworks are excluded from the response",
    },
    osWeights: {
      type: new GraphQLList(GraphQLFloat),
      description:
        "(Only for when useOpenSearch is true) Weights for the OpenSearch query",
      defaultValue: [0.6, 0.4],
    },
    curatedPicksSize: {
      type: GraphQLInt,
      description:
        "The number of curated artworks to return. This is a temporary field to support the transition to OpenSearch",
      defaultValue: 2,
    },
  }),
  resolve: async (
    _root,
    args,
    { weaviateCreateObjectLoader, weaviateGraphqlLoader, artworksLoader }
  ) => {
    if (
      !artworksLoader ||
      !weaviateGraphqlLoader ||
      !weaviateCreateObjectLoader
    ) {
      new Error("A loader is not available")
    }

    const {
      userId,
      limit = 10,
      offset = 0,
      certainty = 0.5,
      sort,
      useOpenSearch,
      mltFields,
      osWeights,
      curatedPicksSize,
    } = args

    if (useOpenSearch) {
      const { excludeArtworkIds = [], likedArtworkIds = [] } = args

      let result: any = []

      if (likedArtworkIds.length < 3) {
        result = await getInitialArtworksSample(
          limit,
          excludeArtworkIds,
          artworksLoader
        )
      } else {
        const tasteProfileVector = await calculateMeanArtworksVector(
          likedArtworkIds
        )
        // we don't want to recommend the same artworks that the user already liked
        excludeArtworkIds.push(...likedArtworkIds)

        const options = {
          vectorEmbedding: tasteProfileVector,
          size: limit,
          likedArtworkIds,
          excludeArtworkIds,
          fields: mltFields,
          weights: osWeights,
        }

        result = await findSimilarArtworks(options, artworksLoader)

        result = result.slice(0, limit - curatedPicksSize)

        // backfill with random curated picks if we don't have enough similar artworks
        const randomArtworks = await getInitialArtworksSample(
          curatedPicksSize,
          excludeArtworkIds,
          artworksLoader
        )
        result.push(...randomArtworks)
      }

      return connectionFromArray(result, args)
    }

    const userQueryResponse = await weaviateGraphqlLoader({
      query: getUserQuery(userId),
    })()

    let user = getUser(userQueryResponse)

    // Create a InfiniteDiscoveryUsers object if it doesn't exist
    if (!user) {
      try {
        user = await weaviateCreateObjectLoader(
          "/objects",
          getUserCreationBody(userId)
        )
      } catch (error) {
        throw new Error(`Error creating user in Weaviate: ${error}`)
      }
    }

    // Get curated artworks. We do this outside the conditional since we will always use them
    const curatedArtworksResponse = await weaviateGraphqlLoader({
      query: getCuratedArtworksQuery(),
    })()

    const userFilterList = getUserFilterList(user!)

    // If the user has liked more than 3 artworks, we will use the nearObject query
    // to get recommendations based on the user's taste.
    if (user!.likedArtworks?.length > 2) {
      const nearArtworksResponse = await weaviateGraphqlLoader({
        query: getNearObjectQuery(userId, { certainty, limit, offset }),
      })()

      // Insert two random curated artworks into the recommendations
      // to "challenge" the user's taste.
      const mixedArtworkIds = insertSampleCuratedWorks(
        getArtworkIds(nearArtworksResponse),
        getArtworkIds(curatedArtworksResponse),
        2
      )

      const filteredNearArtworkIds = getFilteredIdList(
        mixedArtworkIds,
        userFilterList
      )

      if (sort == "certainty") {
        filteredNearArtworkIds.reverse()
      }

      const artworks = await artworksLoader({
        ids: filteredNearArtworkIds,
      })

      return connectionFromArray(uniqBy(artworks, "artist.id"), args)
    } else {
      const curatedArtworkIds = sampleSize(
        getArtworkIds(curatedArtworksResponse),
        limit
      )

      const filteredCuratedArtworkIds = getFilteredIdList(
        curatedArtworkIds,
        userFilterList
      )

      const curatedArtworks = await artworksLoader({
        ids: filteredCuratedArtworkIds,
      })

      return connectionFromArray(uniqBy(curatedArtworks, "artist.id"), args)
    }
  },
}
