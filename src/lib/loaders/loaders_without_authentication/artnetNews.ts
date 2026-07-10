import factories from "../api"

export default (opts) => {
  const { artnetNewsLoaderWithoutAuthenticationFactory } = factories(opts)
  const artnetNewsLoader = artnetNewsLoaderWithoutAuthenticationFactory

  return {
    // Returns { status, data: { found_posts, posts } }
    artnetNewsArticlesLoader: artnetNewsLoader("posts"),
    // Returns the same shape with a single post (including `body`)
    artnetNewsArticleLoader: artnetNewsLoader((id) => `detail/${id}`),
    artnetNewsSearchLoader: artnetNewsLoader("search"),
  }
}
