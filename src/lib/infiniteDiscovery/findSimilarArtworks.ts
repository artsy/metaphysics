import config from "config"
import { opensearch } from "lib/apis/opensearch"

interface FindSimilarArtworksOptions {
  vectorEmbedding: number[]
  size?: number
  likedArtworkIds?: string[]
  excludeArtworkIds?: string[]
  fields?: string[]
  weights?: number[]
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
    weights,
  } = options

  const mltQuery = {
    more_like_this: {
      fields,
      like: likedArtworkIds.map((id) => ({ _id: id })),
      min_term_freq: 1,
      min_doc_freq: 1,
    },
  }

  const boolQuery = {
    bool: {
      must_not: {
        terms: {
          _id: excludeArtworkIds,
        },
      },
      must: mltQuery,
    },
  }

  const knnQuery = {
    knn: {
      vector_embedding: {
        vector: vectorEmbedding,
        k: size,
        filter: {
          bool: {
            must_not: {
              terms: {
                _id: excludeArtworkIds,
              },
            },
          },
        },
      },
    },
  }

  // Combine MLT and k-NN queries into a `should` clause
  const query = {
    size,
    _source: ["id", "artist_id"],
    query: {
      hybrid: {
        queries: [boolQuery, knnQuery],
      },
    },
    search_pipeline: {
      phase_results_processors: [
        {
          "normalization-processor": {
            normalization: {
              technique: "min_max",
            },
            combination: {
              technique: "arithmetic_mean",
              parameters: {
                weights,
              },
            },
            ignore_failure: false,
          },
        },
      ],
      response_processors: [
        {
          collapse: {
            field: "artist_id",
          },
        },
      ],
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
