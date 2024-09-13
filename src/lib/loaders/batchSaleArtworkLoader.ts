import DataLoader from "dataloader"

// Take the list of params that the loader is called with, tuples of `artworkId` and `saleId`.
// Group them by saleId, and return a dictionary where the the value for each record
// is the list of artwork ids for that sale.
const groupByParams = (
  params: { artworkId: string; saleId: string }[]
): Record<string, string[]> => {
  const groupedParams = params.reduce((acc, { saleId, artworkId }) => {
    if (!acc[saleId]) {
      acc[saleId] = []
    }

    if (!acc[saleId].includes(artworkId)) {
      acc[saleId].push(artworkId)
    }
    return acc
  }, {})

  return groupedParams
}

export const createBatchSaleArtworkLoader = (saleArtworksLoader) => {
  const dataLoader = new DataLoader(
    async (saleIdArtworkIdTuples: { artworkId: string; saleId: string }[]) => {
      const groupedParams = groupByParams(saleIdArtworkIdTuples)

      // Array of promises for fetching sale artworks for each sale in parallel via `Promise.all`.
      const fetchPromises = Object.entries(groupedParams).map(
        ([saleId, artwork_ids]) => {
          return saleArtworksLoader(saleId, {
            artwork_ids,
            size: artwork_ids.length,
          }).then((saleData) => ({ saleId, saleData })) // inject saleId into the response
        }
      )

      const fetchedData = await Promise.all(fetchPromises)

      // Assemble the results. For each set of params the loader was invoked with,
      // find the corresponding sale artwork in the resolved data, and return in that order.
      const results = saleIdArtworkIdTuples.map(({ artworkId, saleId }) => {
        // Find the sale data for the given sale
        const saleData = fetchedData.find(({ saleId: id }) => id === saleId)
          ?.saleData

        // Find the corresponding artwork in that sale data
        return saleData?.find(
          (artworkData) => artworkData.artwork._id === artworkId
        )
      })

      return results
    },

    // Maximum number of keys to batch together.
    // In the case of 30 sale artworks in the same sale, we will make 2 requests.
    { maxBatchSize: 20 }
  )

  // Return a wrapper to abide by our existing factory API pattern.
  return (key) => {
    return dataLoader.load(key)
  }
}
