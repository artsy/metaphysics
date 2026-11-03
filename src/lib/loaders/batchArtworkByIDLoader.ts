import DataLoader from "dataloader"

// Coalesces single artwork-by-id loads made in the same tick into one batched
// /artworks call, so `representativeArtworks` fields across a connection don't
// fan out. Raw DataLoader (not batchLoader) since it coalesces regardless of
// ENABLE_RESOLVER_BATCHING.
export const createArtworkByIDLoader = (
  artworksLoader: (params: {
    ids: string[]
    batched: boolean
    size: number
  }) => Promise<any[]>
): DataLoader<string, any | null> =>
  new DataLoader<string, any | null>(
    async (ids) => {
      let artworks: any[] = []
      try {
        // `size` is required: fetching by id still paginates in Gravity, so
        // without it a batch of >10 ids silently loses the rest.
        artworks = await artworksLoader({
          ids: [...ids],
          batched: true,
          size: ids.length,
        })
      } catch {
        return ids.map(() => null)
      }

      const byId = new Map(artworks.filter(Boolean).map((a) => [a._id, a]))
      return ids.map((id) => byId.get(id) ?? null)
    },
    { maxBatchSize: 25 }
  )
