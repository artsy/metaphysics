import config from "config"
import { opensearch } from "lib/apis/opensearch"

interface FindSimilarArtworksOptions {
  vectorEmbedding: number[]
  size?: number
  likedArtworkIds?: string[]
  excludeArtworkIds?: string[]
  fields?: string[]
  useMltQuery?: boolean
}

/**
 * Perform kNN operation to find artworks similar to a vector embedding
 * and optionally use a More Like This (MLT) query.
 *
 * @param options - Configuration options for the query
 * @param artworksLoader - Function to load artworks
 */
export const findSimilarArtworks = async (
  options: FindSimilarArtworksOptions,
  artworksLoader: (params: { ids: string[] }) => Promise<any>
) => {
  const {
    vectorEmbedding,
    size,
    likedArtworkIds = [],
    excludeArtworkIds = [],
    fields = [],
    useMltQuery,
  } = options

  const mltQuery = {
    more_like_this: {
      fields,
      like: likedArtworkIds.map((id) => ({ _id: id })),
      min_term_freq: 1,
      min_doc_freq: 1,
    },
  }

  const knnQuery = {
    knn: {
      vector_embedding: {
        vector: vectorEmbedding,
        k: size,
      },
    },
  }

  // Combine MLT and k-NN queries into a `should` clause
  const shouldQueries = useMltQuery ? [mltQuery, knnQuery] : [knnQuery]

  const query = {
    size,
    _source: ["_id"],
    collapse: { field: "artistName" },
    query: {
      bool: {
        must_not: { terms: { _id: excludeArtworkIds } },
        should: shouldQueries,
      },
    },
  }

  // Execute the query
  const response = await opensearch(
    `/${config.OPENSEARCH_ARTWORKS_INFINITE_DISCOVERY_INDEX}/_search`,
    undefined,
    {
      method: "POST",
      body: JSON.stringify(query),
    }
  )

  // Extract and return artwork IDs
  const artworkIds = response.hits?.hits?.map((hit) => hit._id) || []
  return artworksLoader({ ids: artworkIds })
}
