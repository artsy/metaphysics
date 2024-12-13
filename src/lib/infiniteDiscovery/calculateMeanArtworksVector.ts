import config from "config"
import { opensearch } from "lib/apis/opensearch"
import { mean } from "mathjs"

export const calculateMeanArtworksVector = async (artworkIds) => {
  const getVectorsQuery = {
    size: artworkIds.length,
    _source: ["_id", "vector_embedding"],
    query: {
      ids: {
        values: artworkIds,
      },
    },
  }

  const artworksResponse = await opensearch(
    `/${config.OPENSEARCH_ARTWORKS_INFINITE_DISCOVERY_INDEX}/_search`,
    undefined,
    {
      method: "POST",
      body: JSON.stringify(getVectorsQuery),
    }
  )

  const vectorEmbeddings = artworksResponse.hits?.hits?.map(
    (hit) => hit._source.vector_embedding
  )

  return mean(vectorEmbeddings, 0)
}
