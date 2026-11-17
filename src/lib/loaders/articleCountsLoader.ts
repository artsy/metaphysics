import DataLoader from "dataloader"
import { groupBy, uniq } from "lodash"

export interface ArticleCountsKey {
  artistId: string
  /** Limit to editorial-feed layouts (feature/standard/series/video). */
  inEditorialFeed?: boolean
  /** Count biography articles (`biography_for_artist_id`) only. */
  biography?: boolean
}

type ArticleCountsRESTLoader = (params: {
  artist_ids: string[]
  published: boolean
  in_editorial_feed?: boolean
  biography?: boolean
}) => Promise<Record<string, number>>

export type ArticleCountsLoader = (
  key: ArticleCountsKey
) => Promise<number | null>

// Keys that resolve to the same Positron query share one request.
const requestKey = ({ inEditorialFeed, biography }: ArticleCountsKey) =>
  JSON.stringify([!!inEditorialFeed, !!biography])

// Cap how many artists go into one Positron request so no page can blow the
// URL length / `$in` size; DataLoader splits larger batches across requests.
const MAX_BATCH_SIZE = 100

/**
 * Loads the published article count for one artist, batching every artist asked
 * for in the same tick into a single Positron `GET /api/articles/counts`
 * request. This collapses the per-artist `Artist.counts.articles` fan-out — one
 * Positron call per node of an artist connection — into one call per page.
 *
 * Keys are grouped by `inEditorialFeed`, which changes the query. A failed
 * request degrades each of its keys to `null` rather than throwing, so a
 * Positron hiccup can't null out the artist nodes.
 *
 * Create one per request: results are cached for the request's lifetime.
 */
export const createArticleCountsLoader = (
  restLoader: ArticleCountsRESTLoader
): ArticleCountsLoader => {
  const loader = new DataLoader<ArticleCountsKey, number | null>(
    async (keys) => {
      const requests = groupBy(keys, requestKey)

      const responses = Object.fromEntries(
        Object.entries(requests).map(([key, group]) => {
          const artist_ids = uniq(group.map(({ artistId }) => artistId))
          return [
            key,
            restLoader({
              artist_ids,
              published: true,
              in_editorial_feed: group[0].inEditorialFeed,
              biography: group[0].biography,
            }),
          ]
        })
      )

      return Promise.all(
        keys.map((key) =>
          responses[requestKey(key)].then(
            (counts) => counts?.[key.artistId] ?? 0,
            () => null
          )
        )
      )
    },
    {
      maxBatchSize: MAX_BATCH_SIZE,
      cacheKeyFn: (key) =>
        JSON.stringify([key.artistId, !!key.inEditorialFeed, !!key.biography]),
    }
  )

  return (key) => loader.load(key)
}
