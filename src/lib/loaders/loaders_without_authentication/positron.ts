import factories from "../api"
import { createArticleCountsLoader } from "../articleCountsLoader"

export default (opts) => {
  const { positronLoaderWithoutAuthenticationFactory } = factories(opts)
  const positronLoader = positronLoaderWithoutAuthenticationFactory

  return {
    articlesLoader: positronLoader("articles"),
    articleCountsLoader: createArticleCountsLoader(
      positronLoader("articles/counts")
    ),
    articleLoader: positronLoader((id) => `articles/${id}`),
    authorsLoader: positronLoader("authors"),
    authorLoader: positronLoader((id) => `authors/${id}`),
    channelLoader: positronLoader((id) => `channels/${id}`),
  }
}
