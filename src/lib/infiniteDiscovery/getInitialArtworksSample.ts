import { opensearch } from "lib/apis/opensearch"

export const getInitialArtworksSample = async (limit, artworksLoader) => {
  // initial artworks sample comes from indexed curators picks, but
  // in future we plan to come up with a more sophisticated approach
  const curatorsPicks = await opensearch(`/curators_picks/_search`, undefined, {
    method: "POST",
    body: JSON.stringify({
      size: limit,
      query: {
        function_score: {
          functions: [
            {
              random_score: {
                seed: Math.floor(Math.random() * 1000),
              },
            },
          ],
        },
      },
    }),
  })

  const artworkIds = curatorsPicks.hits?.hits?.map((hit) => hit._id) || []

  return await artworksLoader({ ids: artworkIds })
}
