import factories from "../api"

export default (opts) => {
  const { positronLoaderWithoutAuthenticationFactory } = factories(opts)
  const positronLoader = positronLoaderWithoutAuthenticationFactory

  return {
    articlesLoader: positronLoader("articles"),
    articleLoader: positronLoader((id) => `articles/${id}`),
    authorsLoader: positronLoader("authors"),
    authorLoader: positronLoader((id) => `authors/${id}`),
  }
}
