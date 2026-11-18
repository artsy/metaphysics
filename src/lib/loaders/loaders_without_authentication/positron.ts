import factories from "../api"
import { createArticleCountsLoader } from "../articleCountsLoader"

export default (opts) => {
  const { positronLoaderWithoutAuthenticationFactory } = factories(opts)
  const positronLoader = positronLoaderWithoutAuthenticationFactory

  return {
    articlesLoader: positronLoader("articles"),
    // skipCache: batched URL rarely repeats and overflows memcached's key limit; we cache per-artist.
    articleCountsLoader: createArticleCountsLoader(
      positronLoader("articles/counts", {}, { skipCache: true })
    ),
    articleLoader: positronLoader((id) => `articles/${id}`),
    authorsLoader: positronLoader("authors"),
    authorLoader: positronLoader((id) => `authors/${id}`),
    channelLoader: positronLoader((id) => `channels/${id}`),
  }
}
