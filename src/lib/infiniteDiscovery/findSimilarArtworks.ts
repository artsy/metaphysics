import config from "config"
import { opensearch } from "lib/apis/opensearch"

/**
 * Perform kNN operation to find artworks similiar to vectorEmbedding
 * and then return the artworks loaded by artworksLoader
 *
 * @param vectorEmbedding - vector embedding of the artwork
 * @param size - number of similar artworks to return
 * @param excludeArtworkIds - list of artwork ids to exclude from the response
 * @param artworksLoader - artworks loader
 */
export const findSimilarArtworks = async (
  vectorEmbedding: number[],
  size = 10,
  excludeArtworkIds: string[] = [],
  artworksLoader
) => {
  const knnQuery = {
    size: size,
    _source: ["_id"],
    query: {
      bool: {
        must_not: {
          terms: {
            _id: excludeArtworkIds,
          },
        },
        should: [
          {
            knn: {
              vector_embedding: {
                vector: vectorEmbedding,
                k: size,
              },
            },
          },
        ],
      },
    },
  }

  const knnResponse = await opensearch(
    `/${config.OPENSEARCH_ARTWORKS_INFINITE_DISCOVERY_INDEX}/_search`,
    undefined,
    {
      method: "POST",
      body: JSON.stringify(knnQuery),
    }
  )

  const artworkIds = knnResponse.hits?.hits?.map((hit) => hit._id) || []

  return await artworksLoader({ ids: artworkIds })
}
