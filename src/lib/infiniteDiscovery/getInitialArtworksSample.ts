import { opensearch } from "lib/apis/opensearch"

export const getInitialArtworksSample = async (
  limit,
  excludeArtworkIds,
  artworksLoader
) => {
  // initial artworks sample comes from indexed curators picks, but
  // in future we plan to come up with a more sophisticated approach
  const RANDOM_SEED = Math.floor(Math.random() * 1000)

  const curatorsPicks = await opensearch(`/curators_picks/_search`, undefined, {
    method: "POST",
    body: JSON.stringify({
      size: limit,
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

  const artworkIds = curatorsPicks.hits?.hits?.map((hit) => hit._id) || []

  return await artworksLoader({ ids: artworkIds })
}
