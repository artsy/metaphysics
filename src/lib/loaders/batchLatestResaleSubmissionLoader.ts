import DataLoader from "dataloader"

export interface LatestResaleSubmissionRow {
  artwork_id: string
  resale_submission: any | null
}

// Built once per request by the authenticated factory, so no viewer's submissions enter a shared cache.
// No row from Gravity means the work isn't in the viewer's My Collection, so it resolves to null.
export const createBatchLatestResaleSubmissionLoader = (
  fetchLatest: (params: {
    artwork_id: string[]
  }) => Promise<LatestResaleSubmissionRow[]>
) =>
  new DataLoader<string, LatestResaleSubmissionRow | null>(
    async (artworkIDs) => {
      const rows = await fetchLatest({ artwork_id: [...artworkIDs] })
      const byArtworkID = new Map(rows.map((row) => [row.artwork_id, row]))
      return artworkIDs.map((id) => byArtworkID.get(id) ?? null)
    },
    { maxBatchSize: 50 }
  )
