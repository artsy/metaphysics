import DataLoader from "dataloader"
import { groupBy, uniq } from "lodash"
import cache from "lib/cache"

export interface ArticleCountsKey {
  artistId: string
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

// Short, stable per-artist memcache key.
const articleCountCacheKey = ({
  artistId,
  inEditorialFeed,
  biography,
}: ArticleCountsKey) =>
  `article_count:${artistId}:${inEditorialFeed ? "ed" : "all"}:${
    biography ? "bio" : "feat"
  }`

const MAX_BATCH_SIZE = 100

/**
 * Loads the published article count for one artist, collapsing the per-artist
 * `Artist.counts.articles` fan-out — one Positron call per node of an artist
 * connection — into batched `GET /api/articles/counts` requests.
 */
export const createArticleCountsLoader = (
  restLoader: ArticleCountsRESTLoader
): ArticleCountsLoader => {
  const loader = new DataLoader<ArticleCountsKey, number | null>(
    async (keys) => {
      const cached: (number | null)[] = await Promise.all(
        keys.map((key) =>
          cache
            .get<{ count: number }>(articleCountCacheKey(key))
            .then((hit) => (typeof hit?.count === "number" ? hit.count : null))
            .catch(() => null)
        )
      )

      const missIndexes = keys
        .map((_key, i) => i)
        .filter((i) => cached[i] === null)
      const fetched: Record<number, number | null> = {}

      if (missIndexes.length) {
        const requests = groupBy(
          missIndexes.map((i) => keys[i]),
          requestKey
        )
        const responses = Object.fromEntries(
          Object.entries(requests).map(([rk, group]) => {
            const artist_ids = uniq(group.map(({ artistId }) => artistId))
            return [
              rk,
              restLoader({
                artist_ids,
                published: true,
                in_editorial_feed: group[0].inEditorialFeed,
                biography: group[0].biography,
              }),
            ]
          })
        )

        await Promise.all(
          missIndexes.map(async (i) => {
            const key = keys[i]
            const counts = await responses[requestKey(key)].then(
              (c) => c,
              () => null
            )
            if (counts === null) {
              fetched[i] = null
              return
            }
            const count = counts?.[key.artistId] ?? 0
            fetched[i] = count
            cache.set(articleCountCacheKey(key), { count })
          })
        )
      }

      return keys.map((_key, i) =>
        cached[i] !== null ? cached[i] : fetched[i] ?? null
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
