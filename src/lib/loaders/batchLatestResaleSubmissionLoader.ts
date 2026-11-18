import DataLoader from "dataloader"

type GravityListFetch = (
  params: Record<string, unknown>
) => Promise<{ body: any[]; headers: Record<string, string> }>

const PAGE_SIZE = 100

// Built once per request by the authenticated factory, so no viewer's submissions enter a shared cache.
// Resolves to each work's newest submission, or null when it has none.
export const createBatchLatestResaleSubmissionLoader = (
  fetchResaleSubmissions: GravityListFetch
) =>
  new DataLoader<string, any | null>(
    async (artworkIDs) => {
      const newestByArtworkID = new Map<string, any>()

      // Newest first, so the first row seen for a work is its latest. Page on until every work is seen.
      for (let page = 1; ; page++) {
        const { body, headers } = await fetchResaleSubmissions({
          artwork_ids: [...artworkIDs],
          sort: "-created_at",
          size: PAGE_SIZE,
          page,
          total_count: true,
        })
        body.forEach((submission) => {
          if (!newestByArtworkID.has(submission.submitted_artwork_id)) {
            newestByArtworkID.set(submission.submitted_artwork_id, submission)
          }
        })

        const totalCount = parseInt(headers?.["x-total-count"] || "0", 10)
        if (
          newestByArtworkID.size === artworkIDs.length ||
          page * PAGE_SIZE >= totalCount
        ) {
          break
        }
      }

      return artworkIDs.map((id) => newestByArtworkID.get(id) ?? null)
    },
    { maxBatchSize: 50 }
  )
