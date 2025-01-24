import { opensearch } from "lib/apis/opensearch"

const EXTRA_FETCH_SIZE = 10

export const getInitialArtworksSample = async (
  limit,
  excludeArtworkIds,
  artworksLoader,
  indexName
) => {
  // initial artworks sample comes from indexed curators picks, but
  // in future we plan to come up with a more sophisticated approach
  const RANDOM_SEED = Math.floor(Math.random() * 1000)

  const curatorsPicks = await opensearch(`/${indexName}/_search`, undefined, {
    method: "POST",
    body: JSON.stringify({
      size: limit + EXTRA_FETCH_SIZE,
      query: {
        function_score: {
          query: {
            bool: {
              must_not: {
                terms: {
                  _id: excludeArtworkIds,
                },
              },
            },
          },
          functions: [
            {
              random_score: {
                seed: RANDOM_SEED,
              },
            },
          ],
          boost_mode: "replace",
        },
      },
    }),
  })

  if (curatorsPicks.hits?.hits?.length === 0) {
    throw Error("Failed to fetch curated artworks")
  }

  const artworkIds = curatorsPicks.hits?.hits?.map((hit) => hit._id) || []
  const artworks = await artworksLoader({ ids: artworkIds })

  return artworks.slice(0, limit)
}
