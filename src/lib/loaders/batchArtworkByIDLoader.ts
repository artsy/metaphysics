import DataLoader from "dataloader"

// Coalesces single artwork-by-id loads made in the same tick into one batched
// /artworks call, so `representativeArtworks` fields across a connection don't
// fan out. Raw DataLoader (not batchLoader) since it coalesces regardless of
// ENABLE_RESOLVER_BATCHING.
export const createArtworkByIDLoader = (
  artworksLoader: (params: {
    ids: string[]
    batched: boolean
  }) => Promise<any[]>
): DataLoader<string, any | null> =>
  new DataLoader<string, any | null>(
    async (ids) => {
      let artworks: any[] = []
      try {
        artworks = await artworksLoader({ ids: [...ids], batched: true })
      } catch {
        return ids.map(() => null)
      }

      const byId = new Map(artworks.filter(Boolean).map((a) => [a._id, a]))
      return ids.map((id) => byId.get(id) ?? null)
    },
    { maxBatchSize: 25 }
  )
