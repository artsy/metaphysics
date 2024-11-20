import {
  GraphQLString,
  GraphQLFieldConfig,
  GraphQLInt,
  GraphQLEnumType,
  GraphQLFloat,
  GraphQLNonNull,
  GraphQLBoolean,
} from "graphql"
import { ResolverContext } from "types/graphql"
import { artworkConnection } from "../artwork"
import { connectionFromArray } from "graphql-relay"
import { pageable } from "relay-cursor-paging"
import { sampleSize, shuffle } from "lodash"
import {
  insertSampleCuratedWorks,
  getUserFilterList,
  getCuratedArtworksQuery,
  getNearObjectQuery,
  getUser,
  getUserCreationBody,
  getUserQuery,
  GetArtworkIds,
  getFilteredIdList,
} from "lib/infiniteDiscovery/weaviate"

export const DiscoverArtworks: GraphQLFieldConfig<void, ResolverContext> = {
  type: artworkConnection.connectionType,
  args: pageable({
    userId: { type: GraphQLNonNull(GraphQLString) },
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
    useRelatedArtworks: { type: GraphQLBoolean, defaultValue: false },
  }),
  resolve: async (
    _root,
    args,
    {
      weaviateCreateObjectLoader,
      weaviateGraphqlLoader,
      artworksLoader,
      relatedArtworksLoader,
      marketingCollectionLoader,
      savedArtworksLoader,
    }
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
      limit = 5,
      offset = 0,
      certainty = 0.5,
      sort,
      useRelatedArtworks,
    } = args

    if (useRelatedArtworks) {
      if (!savedArtworksLoader) {
        return new Error("You need to be signed in to perform this action")
      }

      const { body: savedArtworks } = await savedArtworksLoader({
        size: 28,
        sort: "-position",
        user_id: userId,
        private: true,
      })

      const savedArtworkIds = savedArtworks.map((artwork) => artwork.id)

      const curatedArtworksCollection = await marketingCollectionLoader(
        "curators-picks"
      )

      const curatedArtworkIds = curatedArtworksCollection.artwork_ids

      // Select two random artworks from curated artworks
      const randomCuratedArtworksIds = sampleSize(curatedArtworkIds, 2)

      const curatedArtworks = await artworksLoader({
        ids: randomCuratedArtworksIds,
      })

      // use curated artworks if there are no saved artworks
      const finalArtworkIds =
        savedArtworkIds.length > 0 ? [...savedArtworkIds] : curatedArtworkIds

      // Limit the number of artwork IDs to a maximum of 10
      const queryArtworkIds = finalArtworkIds.slice(0, 10)

      const relatedArtworks = await relatedArtworksLoader({
        artwork_id: queryArtworkIds,
        size: 8,
      })

      // inject curated artworks and shuffle the list
      const shuffledArtworks = shuffle([...relatedArtworks, ...curatedArtworks])
      return connectionFromArray(shuffledArtworks, args)
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

    if (user!.likedArtworks?.length > 0) {
      const nearArtworksResponse = await weaviateGraphqlLoader({
        query: getNearObjectQuery(userId, { certainty, limit, offset }),
      })()

      // Insert two random curated artworks into the recommendations
      // to "challenge" the user's taste.
      const mixedArtworkIds = insertSampleCuratedWorks(
        GetArtworkIds(nearArtworksResponse),
        GetArtworkIds(curatedArtworksResponse),
        2
      )

      const filteredArtworkIds = getFilteredIdList(
        mixedArtworkIds,
        getUserFilterList(user!)
      )

      if (sort == "certainty") {
        filteredArtworkIds.reverse()
      }

      const artworks = await artworksLoader({ ids: filteredArtworkIds })

      return connectionFromArray(artworks, args)
    } else {
      const curatedArtworkIds = sampleSize(
        GetArtworkIds(curatedArtworksResponse),
        limit
      )

      const curatedArtworks = await artworksLoader({ ids: curatedArtworkIds })

      return connectionFromArray(curatedArtworks, args)
    }
  },
}
