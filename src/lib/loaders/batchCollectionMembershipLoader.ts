import DataLoader from "dataloader"
import { error } from "lib/loggers"

// Batches per-node `Collection.isSavedArtwork` checks into one
// `collections?artwork_id=` call (which returns only the collections containing
// the artwork), avoiding a per-list fan-out.
export const createBatchCollectionMembershipLoader = (
  fetchCollections: (params: {
    artwork_id: string
    user_id?: string
    private: boolean
    size: number
  }) => Promise<Array<{ id: string }>>,
  userID?: string
) => {
  const loader = new DataLoader<string, Set<string>>(async (artworkIDs) => {
    return Promise.all(
      artworkIDs.map(async (artworkID) => {
        try {
          const collections = await fetchCollections({
            artwork_id: artworkID,
            user_id: userID,
            private: true,
            // Gravity's max page size; far exceeds any real per-artwork list count.
            size: 100,
          })

          return new Set(collections.map((collection) => collection.id))
        } catch (e) {
          // Non-null isSavedArtwork: a reject here would null the node and drop it.
          error(e)
          return new Set<string>()
        }
      })
    )
  })

  return (artworkID: string) => loader.load(artworkID)
}
