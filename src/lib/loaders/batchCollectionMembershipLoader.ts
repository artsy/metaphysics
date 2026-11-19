import DataLoader from "dataloader"

// Request-scoped. Batches `Collection.isSavedArtwork` membership checks across
// every collection node in a page into one `collections?artwork_id=` call per
// distinct artwork. Gravity's collections endpoint, given an `artwork_id`,
// returns only the user's collections that contain that artwork — so a single
// call answers membership for the whole page instead of one call per list.
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
            // Gravity caps page size at 100; a single artwork living in more
            // than 100 of one user's lists is not a real scenario.
            size: 100,
          })

          return new Set(collections.map((collection) => collection.id))
        } catch (error) {
          // Degrade gracefully: a deleted/invalid artwork (Gravity 404) or a
          // transient failure must not reject here — `isSavedArtwork` is
          // non-null, so a throw would null the collection node and silently
          // drop it from the connection.
          return new Set<string>()
        }
      })
    )
  })

  return (artworkID: string) => loader.load(artworkID)
}
